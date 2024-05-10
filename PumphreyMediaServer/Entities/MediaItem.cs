using RizeDb.ObjectOriented;
using System.Text.Json.Serialization;

namespace MediaServer.Entities
{
    [JsonConverter(typeof(MediaItemConverter))]
    [SerializerTypeIdentifier(typeof(MediaItemIdentifier))]
    public abstract class MediaItem : IEntity
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public DateTimeOffset AddedDate { get; set; }

        [Index(IndexSearchOptions.Int16)]
        public MediaType MediaType { get; set; }

        [Index(IndexSearchOptions.Int16)]
        public MediaItemType MediaItemType { get; set; }
        public DateTimeOffset? MetadataDate { get; set; }
        public string? Error { get; set; }
        [Index(IndexSearchOptions.Int64)]
        public long? FolderId { get; set; }
        public List<long>? TagIds { get; set; }
        public List<MetadataTag>? MetadataTags { get; set; }
        public DateTime? UnavailableDate { get; set; }
        public bool Restricted { get; set; }
        public List<Guid>? UserAccess { get; set; }
	}
}
