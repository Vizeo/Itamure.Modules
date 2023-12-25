using IntegratedWebServer.Core;
using MediaServer.Entities;
using MediaServer.SubServices;
using UpnpLib.Devices.Services;
using UpnpLib.Devices.Services.Media.AVTransport_1;

namespace MediaServer.Api.RemoteControllers
{
	internal class UpnpController : IRemoteController
	{
		public MediaCastResult Cast(IRequest request, FileInfo fileInfo, string receiverId, CastMediaInfo castMediaInfo)
		{
			MediaCastResult? result = null;
			foreach (var device in UpnpSubService.SsdpServer!.Devices)
			{
				if (device.UniformResourceName == UpnpLib.KnownDevices.MediaRenderer1)
				{
					var indexOfIdEnd = device.UniqueServiceName.IndexOf("::");
					var deviceId = device.UniqueServiceName.Substring(5, indexOfIdEnd - 5);

					if (deviceId == receiverId)
					{
						var task = Task.Run(async () =>
						{
							await device.Load();
							var service = device.Services.FirstOrDefault() as UpnpLib.Devices.Services.Media.AVTransport_1.AVTransport1;
							if (service != null)
							{
								var port = string.Empty;
								if ((request.LocalEndPoint.Port == 80 && !request.IsSecure) ||
									(request.LocalEndPoint.Port == 443 && request.IsSecure))
								{
									port = $":{request.LocalEndPoint.Port}";
								}
								var url = $"http://{device.ClientIpAddress}{port}/mediaServer/streamingService?UniqueKey={castMediaInfo.UniqueLink}";

								var videoItem = new UpnpLib.Devices.Services.Media.VideoItem(castMediaInfo.UniqueLink.ToString(), $"Streamer{fileInfo.Extension}");
								videoItem.Resources = new List<UpnpLib.Devices.Services.Media.Resource>();
								videoItem.Resources.Add(new UpnpLib.Devices.Services.Media.Resource()
								{
									MimeType = castMediaInfo.MimeType,
									Value = url,
									//AudioChannels = "2",
									//Bitrate = "78639",
									//SampleFrequency = "48000",
									Duration = TimeSpan.FromSeconds(Convert.ToDouble(castMediaInfo.Duration!)).ToString(@"h\:mm\:ss\.ffff"),
									Resolution = $"{castMediaInfo.Width}x{castMediaInfo.Height}",
									Size = fileInfo.Length,
								});

								var setResponse = await service!.SetAVTransportURI(url, videoItem);
								if (setResponse.HasError)
								{
									result = new MediaCastResult() { Success = false, Message = setResponse.ErrorMessage };
									return;
								}

								var playResponse = await service!.Play();
								if (playResponse.HasError)
								{
									result = new MediaCastResult() { Success = false, Message = playResponse.ErrorMessage };
									return;
								}

								result = new MediaCastResult() { Success = true, Message = string.Empty };
							}
							else
							{
								result = new MediaCastResult() { Success = false, Message = "Device service not found" };
							}							
						});
						task.Wait();
						break;
					}
				}
			}

			return result!;
		}

		public AVTransport1? GetTransportService(string receiverId)
		{
			foreach (var device in UpnpSubService.SsdpServer!.Devices)
			{
				if (device.UniformResourceName == UpnpLib.KnownDevices.MediaRenderer1)
				{
					device.Load().Wait();
					var indexOfIdEnd = device.UniqueServiceName.IndexOf("::");
					if (receiverId == device.UniqueServiceName.Substring(5, indexOfIdEnd - 5))
					{
						return device.Services.FirstOrDefault() as AVTransport1;						
					}
				}
			}

			return null;
		}

		public void Pause(string receiverId)
		{
			var service = GetTransportService(receiverId);
			service?.Pause().Wait();
		}

		public void Play(string receiverId)
		{
			var service = GetTransportService(receiverId);
			service?.Play().Wait();
		}

		public void Seek(string receiverId, double second)
		{
			var service = GetTransportService(receiverId);
			service?.SeekRealTime(TimeSpan.FromSeconds(second)).Wait();
		}

		public void Stop(string receiverId)
		{
			var service = GetTransportService(receiverId);
			service?.Stop().Wait();
		}
	}
}
