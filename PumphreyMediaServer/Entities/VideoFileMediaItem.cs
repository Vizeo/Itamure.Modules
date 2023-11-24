using RizeDb.ObjectOriented;

namespace MediaServer.Entities
{
    public class VideoFileMediaItem : FileMediaItem
    {
        [Index(IndexSearchOptions.Int16)]
        public short? SeriesId { get; set; }
        public short? SeasonId { get; set; }
        public short? Width { get; set; }
        public short? Height { get; set; }
        public uint? Year { get; set; }
        public decimal? Duration { get; set; }
        public int Order { get; set; }
        public string? Description { get; set; }
    }
}
