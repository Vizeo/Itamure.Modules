using RizeDb.ObjectOriented;

namespace MediaServer.Entities
{
    public class MetadataImage : IEntity
    {
        public long Id { get; set; }
        [Index(IndexSearchOptions.Int64)]
        public long MediaItemId { get; set; }
        public string? MimeType { get; set; }
        public byte[]? Data { get; set; }
    }
}
