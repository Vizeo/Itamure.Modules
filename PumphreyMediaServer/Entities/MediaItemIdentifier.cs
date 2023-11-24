using RizeDb.ObjectOriented;

namespace MediaServer.Entities
{
    public class MediaItemIdentifier : SerializerTypeIdentifier
    {
        public override ushort GetInheritedTypeId(object objectToIdentify)
        {
            return (ushort)((MediaItem)objectToIdentify).MediaItemType;
        }

        public override Type IdentifyTypeFromId(ushort id)
        {
            switch ((MediaItemType)id)
            {
                case MediaItemType.UnknownVideoFile:
                case MediaItemType.MovieFile:
                case MediaItemType.SeriesFile:
                    return typeof(VideoFileMediaItem);
                case MediaItemType.MusicFile:
                    return typeof(MusicFileMediaItem);
                case MediaItemType.PictureFile:
                    return typeof(PictureFileMediaItem);
                default:
                    throw new Exception("Unknown Media Item Type " + (MediaSourceType)id);
            }
        }
    }
}
