using MediaServer.Entities;

namespace MediaServer.Tasks
{
    public class UnknownSync : ISync
    {
        public bool TryImportMetadata(MediaItem mediaItem, TagLib.File metaData)
        {
            //This is for handling files I don't have syncs for yet
            return true;
        }

        public bool TryImportImage(MediaItem mediaItem, TagLib.File metaData)
        {
            return true;
        }
    }
}
