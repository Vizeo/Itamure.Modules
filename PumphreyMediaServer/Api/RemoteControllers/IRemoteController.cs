using IntegratedWebServer.Core;
using MediaServer.Entities;

namespace MediaServer.Api.RemoteControllers
{
	internal interface IRemoteController
	{
		MediaCastResult Cast(IRequest request, FileInfo fileInfo, string receiverId, CastMediaInfo castMediaInfo);
		void Play(string receiverId);
		void Pause(string receiverId);
		void Stop(string receiverId);
		void Seek(string receiverId, double second);
	}
}
