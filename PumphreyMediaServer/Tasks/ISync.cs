using MediaServer.Entities;

namespace PumphreyMediaServer.Tasks
{
    public interface ISync
    {
        bool TryImportMetadata(MediaItem mediaItem, TagLib.File metaData);
        bool TryImportImage(MediaItem mediaItem, TagLib.File metaData);
    }
}
