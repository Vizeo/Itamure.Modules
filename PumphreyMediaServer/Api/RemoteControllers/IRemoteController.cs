using IntegratedWebServer.Core;
using MediaServer.Entities;

namespace MediaServer.Api.RemoteControllers
{
	internal interface IRemoteController
	{
		MediaCastResult Cast(IRequest request, FileInfo fileInfo, string receiverId, VideoFileMediaItem videoFileMediaItem, UserMediaItem userMediaItem);
		void Play(string receiverId);
		void Pause(string receiverId);
		void Stop(string receiverId);
		void Seak(string receiverId, double second);
	}
}
