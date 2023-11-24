using RizeDb.ObjectOriented;

namespace MediaServer.Entities
{
    public class SeriesImage : IEntity
    {
        public long Id { get; set; }
        [Index(IndexSearchOptions.Int64)]
        public long SeriesId { get; set; }
        public string? MimeType { get; set; }
        public byte[]? Data { get; set; }
    }
}
