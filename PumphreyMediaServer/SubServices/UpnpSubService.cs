using UpnpLib;
using UpnpLib.Ssdp;
using UpnpLib.Devices.Services.Media;
using MediaServer.Events;
using System.Collections.Concurrent;
using MediaServer.Entities;
using MediaServer.Api;

namespace MediaServer.SubServices
{
	public static class UpnpSubService
	{
		internal static SsdpServer? SsdpServer { get; private set; }
		private static bool _running = false;
		private static ConcurrentDictionary<string, ReceiverEvent> _recentEvents = new ConcurrentDictionary<string, ReceiverEvent>();

		public static void Start()
		{
			_running = true;
			SsdpServer = new SsdpServer();
			SsdpServer.DeviceDiscovered += SsdpServerDeviceDiscovered;
			SsdpServer.DeviceOffline += SsdpServerDeviceOffline; 
			SsdpServer.Start();
			SsdpServer.Search(KnownDevices.MediaRenderer1);
			Task.Run(() => ReceiverPositionUpdateTimer());
		}

		private static async void SsdpServerDeviceDiscovered(object? sender, DeviceChangeArg e)
		{
			try
			{
				if (e.Device.UniformResourceName == UpnpLib.KnownDevices.MediaRenderer1)
				{
					var indexOfIdEnd = e.Device.UniqueServiceName.IndexOf("::");
					var Id = e.Device.UniqueServiceName.Substring(5, indexOfIdEnd - 5);

					await e.Device.Load();

					var mediaReceiver = new MediaReceiver()
					{
						Id = e.Device.UniqueServiceName.Substring(5, indexOfIdEnd - 5),
						Name = e.Device.FriendlyName,
						ReceiverType = "Upnp"
					};

					var receiverAddedEvent = new ReceiverAddedEvent()
					{
						Receiver = mediaReceiver
					};

					Module.CurrentModule?.SendEvent(receiverAddedEvent);
				}
			}
			catch { }
		}

		private static void SsdpServerDeviceOffline(object? sender, DeviceChangeArg e)
		{
			if (e.Device.UniformResourceName == UpnpLib.KnownDevices.MediaRenderer1)
			{
				var indexOfIdEnd = e.Device.UniqueServiceName.IndexOf("::");
				var Id = e.Device.UniqueServiceName.Substring(5, indexOfIdEnd - 5);

				Module.CurrentModule?.SendEvent(new ReceiverRemovedEvent()
				{
					ReceiverId = Id
				});
			}
		}

		private static async Task ReceiverPositionUpdateTimer()
		{
			while (_running)
			{
				//Get Updates
				foreach (var device in SsdpServer!.Devices)
				{
					if (device.UniformResourceName == UpnpLib.KnownDevices.MediaRenderer1)
					{
						try
						{
							device.Load().Wait();
							await device.Load();
							var service = device.Services.FirstOrDefault() as UpnpLib.Devices.Services.Media.AVTransport_1.AVTransport1;
							if (service != null)
							{							
								var indexOfIdEnd = device.UniqueServiceName.IndexOf("::");
								var Id = device.UniqueServiceName.Substring(5, indexOfIdEnd - 5);

								var receiverEvent = new ReceiverEvent()
								{
									ReceiverId = Id,
								};

								var transportInfo = await service.GetTransportInfo();

								switch(transportInfo.TransportState)
								{
									case TransportState.Playing:
										receiverEvent.Status = "Playing";
										await GetMediaInfo(service, receiverEvent);
										break;
									case TransportState.PausedPlayback:
										receiverEvent.Status = "Paused";
										await GetMediaInfo(service, receiverEvent);
										break;
									default:
										receiverEvent.Status = "Stopped";
										receiverEvent.Length = 0;
										receiverEvent.Position = 0;
										receiverEvent.MediaName = string.Empty;
										receiverEvent.UserName = string.Empty;
										break;
								}

								//Compare last to current and send if different
								if(!_recentEvents.TryGetValue(receiverEvent.ReceiverId, out var recent) ||
									!Compare(receiverEvent, recent))
								{
									if(recent == null)
									{
										_recentEvents.TryAdd(Id, receiverEvent);
									}
									else
									{
										_recentEvents.TryUpdate(Id, receiverEvent, recent);
									}

									Module.CurrentModule?.SendEvent(receiverEvent);
								}
							}
						}
						catch
						{
							//Send a removed event
						}
					}
				}

				await Task.Delay(TimeSpan.FromSeconds(1));
			}
		}

		private static async Task GetMediaInfo(UpnpLib.Devices.Services.Media.AVTransport_1.AVTransport1 service, ReceiverEvent receiverEvent)
		{
			var positionInfo = await service.GetPositionInfo();
			receiverEvent.Length = positionInfo.TrackDuration.TotalSeconds;
			receiverEvent.Position = positionInfo.RelTime.TotalSeconds;
			if(positionInfo.Item != null)
			{
				var mediaId = positionInfo.Item.Id;
				if(Guid.TryParse(mediaId, out var mediaLinkId) &&
					Module.ObjectStore != null)
				{
					var userMediaReferences = Module.ObjectStore.Retrieve<UserMediaReference>()
						.FirstOrDefault(u => u.UniqueLink == mediaLinkId);
					if(userMediaReferences != null) 
					{
						var mediaItem = Module.ObjectStore.Retrieve<MediaItem>(userMediaReferences.MediaItemId);
						if(mediaItem != null) 
						{
							receiverEvent.MediaName = mediaItem.Name;
						}

						var users = Module.CurrentModule!.GetUsers();
						var user = users.FirstOrDefault(u => u.Id == userMediaReferences.UserUniqueId);
						if(user != null) 
						{
							receiverEvent.UserName = user.Name;
						}						
					}
				}
			}
		}

		private static bool Compare(ReceiverEvent a, ReceiverEvent b)
		{
			return a.ReceiverId == b.ReceiverId &&
				a.UserName == b.UserName &&
				a.MediaName == b.MediaName &&
				a.Length == b.Length &&
				a.Position == b.Position &&
				a.Status == b.Status;
		}

		public static void Stop()
		{
			_running = false;

			SsdpServer?.Stop();
			SsdpServer = null;
		}
	}
}
