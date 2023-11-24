using RizeDb.ObjectOriented;
using System.Text.Json.Serialization;

namespace MediaServer.Entities
{
    [JsonConverter(typeof(MediaSourceConverter))]
    [SerializerTypeIdentifier(typeof(MediaSourceTypeIdentifier))]
    public abstract class MediaSource : IEntity
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public MediaSourceType MediaSourceType { get; set; }
        [JsonIgnore]
        public DateTimeOffset CreatedDate { get; set; }
    }
}
