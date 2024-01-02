using IntegratedWebServer.Core;
using Itamure.Core;
using MediaServer.Entities;
using MediaServer.Events;
using System.Collections.Concurrent;
using System.Reflection.Metadata.Ecma335;
using System.Text;
using System.Text.Json;
using static MediaServer.Api.RemoteControllers.WebScreenController;

namespace MediaServer.Api.RemoteControllers
{
    internal class WebScreenController : IRemoteController
    {
        private static readonly List<IScreen> _receivers = new List<IScreen>();
        private static readonly object _locket = new object();
        private static bool _closing = false;
        private static readonly ConcurrentDictionary<string, Receiver> _webReceivers = new ConcurrentDictionary<string, Receiver>();
        private static readonly ConcurrentDictionary<string, EventWaitHandle> _pending = new ConcurrentDictionary<string, EventWaitHandle>();
        protected static UTF8Encoding UTF8Encoding { get; } = new UTF8Encoding(false);

        static WebScreenController()
        {
            Task.Run(async () =>
            {
                while (!_closing)
                {
                    lock (_receivers)
                    {
                        var screens = Module.CurrentModule!.GetScreens().ToList();
                        foreach (var screen in screens)
                        {
                            if (!_receivers.Any(r => r.Id == screen.Id))
                            {
                                _receivers.Add(screen);

                                var mediaReceiver = new MediaReceiver()
                                {
                                    Id = screen.Id.ToString(),
                                    Name = screen.Name,
                                    ReceiverType = "Web"
                                };

                                var receiverAddedEvent = new ReceiverAddedEvent()
                                {
                                    Receiver = mediaReceiver
                                };

                                Module.CurrentModule?.SendEvent(receiverAddedEvent);
                            }
                        }

                        foreach (var receiver in _receivers.ToArray())
                        {
                            if (!screens.Any(s => s.Id == receiver.Id))
                            {
                                _receivers.Remove(receiver);
                                Module.CurrentModule?.SendEvent(new ReceiverRemovedEvent()
                                {
                                    ReceiverId = receiver.Id.ToString()
                                });
                            }
                        }
                    }

                    await Task.Delay(TimeSpan.FromSeconds(10));
                }
            });
        }

        public static IEnumerable<IScreen> Screens 
        {
            get
            {
                lock (_receivers)
                {
                    return _receivers.ToArray();
                }
            }
        }

        public void AddWebSocket(string screen, WebSocket webSocket)
        {
            webSocket.OnClosed += (s, e) =>
            { 
                lock (_locket)
                {
                    _webReceivers.TryRemove(screen, out _);
                }
            };

            if (!_closing)
            {
                lock (_locket)
                {
                    _webReceivers.TryAdd(screen, new Receiver(webSocket, screen));
                }

                webSocket.DataReceive += (s, e) =>
                {
                    var json = UTF8Encoding.GetString(e);
                    var update = JsonSerializer.Deserialize<Update>(json);

					switch (update!.State)
                    {
                        case "Ready":
                            if(_pending.TryRemove(screen, out var waitHandle))
                            {
                                waitHandle.Set();
                            }
							break;
						case "Position":
							var positionUpdate = JsonSerializer.Deserialize<PositionUpdate>(json);
							var updateEvent = GetReceiveData(screen, out var receiver);
                            if (receiver != null)
                            {
                                updateEvent.Status = receiver.State;
                                updateEvent.Position = positionUpdate!.Position;
                                MediaServerService.UpdatePosition(receiver.CastMediaInfo!.UserMediaReferenceId, Convert.ToInt64(positionUpdate!.Position));
                                Module.CurrentModule?.SendEvent(updateEvent);
                            }
							break;
						case "Playing":
						case "Paused":
							updateEvent = GetReceiveData(screen, out receiver);
							if (receiver != null)
                            {
                                receiver.State = update!.State;
								updateEvent.Status = receiver.State;
								Module.CurrentModule?.SendEvent(updateEvent);
							}
							break;
					}
				};               
            }
        }

        private ReceiverEvent GetReceiveData(string screen, out Receiver? receiver)
        {
			var result = new ReceiverEvent()
			{
				ReceiverId = screen,
			};
			
            if (_webReceivers.TryGetValue(screen, out receiver))
            {
                result.Length = Convert.ToDouble(receiver.CastMediaInfo!.Duration!);
                result.MediaName = receiver.CastMediaInfo!.Title;
				result.UserName = receiver.CastMediaInfo!.UserName;
                result.UniqueLink = receiver.CastMediaInfo.UniqueLink.ToString();
			}

            return result;
		}

        public int Count()
        {
            int result;
            lock (_locket)
            {
                result = _webReceivers.Count;
            }
            return result;
        }

        public void Close()
        {
            _closing = true;
            lock (_locket)
            {
                foreach (var receivers in _webReceivers.Values)
                {
                    receivers.WebSocket.Close();
                }
                _webReceivers.Clear();
            }
        }

		public MediaCastResult Cast(IRequest request, FileInfo fileInfo, string receiverId, CastMediaInfo castMediaInfo)
		{            
            if(!_webReceivers.TryGetValue(receiverId, out var webReceiver))
            {
                //The web receiver is not currently running on that screen launch it and wait for it to respond for upto one minute
                var screen = Module.CurrentModule!.GetScreens().FirstOrDefault(s => s.Id.ToString() == receiverId);
                if(screen != null) 
                {
				    var waitHandle = new EventWaitHandle(false, EventResetMode.ManualReset);
					_pending.TryAdd(receiverId, waitHandle);
					Module.CurrentModule.LaunchScreenWindow("Media Server Web Receiver", $"/mediaServer/RemoteWebScreen?screen={screen.Id}", screen);
                    waitHandle.WaitOne(TimeSpan.FromMinutes(1));

					if(!_webReceivers.TryGetValue(receiverId, out webReceiver))
				    {
						return new MediaCastResult()
						{
							Success = false,
							Message = "Screen is no longer available or could not connect"
						};
					}
				}
                else
                {
                    return new MediaCastResult()
                    {
                        Success = false,
                        Message = "Screen is no longer available or could not connect"
                    };
				}
			}

			webReceiver.CastMediaInfo = castMediaInfo;
			var json = JsonSerializer.Serialize(new LoadCommand()
            {
                Position = castMediaInfo.StartPosition,
                UniqueLink = castMediaInfo.UniqueLink,
            });
            webReceiver.WebSocket.Send(UTF8Encoding.GetBytes(json));
            return new MediaCastResult();
		}

		public void Play(string receiverId)
		{
            if (_webReceivers.TryGetValue(receiverId, out var webReceiver))
            {
                var json = JsonSerializer.Serialize(new Command()
                {
                    State = "Play"
                });
                webReceiver!.WebSocket.Send(UTF8Encoding.GetBytes(json));
            }
		}

		public void Pause(string receiverId)
		{
			if (_webReceivers.TryGetValue(receiverId, out var webReceiver))
			{
				var json = JsonSerializer.Serialize(new Command()
				{
					State = "Pause"
				});
				webReceiver!.WebSocket.Send(UTF8Encoding.GetBytes(json));
			}
		}

		public void Stop(string receiverId)
		{
			if (_webReceivers.TryGetValue(receiverId, out var webReceiver))
			{
				var updateEvent = GetReceiveData(receiverId, out var receiver);
				if (receiver != null)
				{
					updateEvent.Length = 0;
					updateEvent.Status = "Stopped";
					updateEvent.Position = 0;
					updateEvent.MediaName = string.Empty;
					updateEvent.UserName = string.Empty;
					Module.CurrentModule?.SendEvent(updateEvent);
				}

				var json = JsonSerializer.Serialize(new Command()
				{
					State = "Stop"
				});
				webReceiver!.WebSocket.Send(UTF8Encoding.GetBytes(json));		
                
                //The receiver will be cleared when the websocket dies
			}
		}

		public void Seek(string receiverId, double second)
		{
            if (_webReceivers.TryGetValue(receiverId, out var webReceiver))
            {
                var json = JsonSerializer.Serialize(new SeekCommand()
                {
                    Position = second
                });
                webReceiver!.WebSocket.Send(UTF8Encoding.GetBytes(json));
            };
		}
        
        private class Receiver
        {
            public Receiver(WebSocket webSocket, string screen)
			{
				WebSocket = webSocket;
				Screen = screen;
			}

			public WebSocket WebSocket { get; }
            public string Screen { get; }
            public string? State { get; set; }
            public CastMediaInfo? CastMediaInfo { get; set; }
		}

		public class Command
        {
            public string? State { get; set; }    
        }

        public class LoadCommand : Command
		{
            public LoadCommand()
            {
                State = "Load";
			}

			public Guid UniqueLink { get; set; }
			public double Position { get; set; }
		}

		public class SeekCommand : Command
		{
			public SeekCommand()
			{
				State = "Seek";
			}

			public double Position { get; set; }
		}

        public class Update {
			public string? State { get; set; }
		}

		public class PositionUpdate : Update
		{
			public double Position { get; set; }
		}
	}
}
