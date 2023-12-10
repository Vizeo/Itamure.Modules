using MediaServer.Entities;

namespace MediaServer.Tasks
{
    public class SyncFactory
    {
        private VideoFileSync? _videoFileSync = null;
        private UnknownSync? _unknokwnSync = null;

        public ISync GetSync(MediaItem mediaItem)
        {
            switch(mediaItem)
            {
                case VideoFileMediaItem:
                    return _videoFileSync ?? (_videoFileSync = new VideoFileSync());
                default:
                    return _unknokwnSync ?? (_unknokwnSync = new UnknownSync());
            }
        }
    }
}
