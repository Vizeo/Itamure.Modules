using MediaServer.Entities;

namespace MediaServer.Tasks
{
    public interface ISync
    {
        bool TryImportMetadata(MediaItem mediaItem, TagLib.File metaData);
        bool TryImportImage(MediaItem mediaItem, TagLib.File metaData);
    }
}
