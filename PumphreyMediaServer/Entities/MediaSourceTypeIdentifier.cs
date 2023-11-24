using RizeDb.ObjectOriented;

namespace MediaServer.Entities
{
    public class MediaSourceTypeIdentifier : SerializerTypeIdentifier
    {

        public override ushort GetInheritedTypeId(object objectToIdentify)
        {
            return (ushort)((MediaSource)objectToIdentify).MediaSourceType;
        }

        public override Type IdentifyTypeFromId(ushort id)
        {
            switch ((MediaSourceType)id)
            {
                case MediaSourceType.Directory:
                    return typeof(DirectoryMediaSource);
                default:
                    throw new Exception("Unknown Display Item Type " + (MediaSourceType)id);
            }
        }
    }
}
