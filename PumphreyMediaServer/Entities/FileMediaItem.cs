namespace MediaServer.Entities
{
    public class FileMediaItem: MediaItem
    {
        public string? FilePath { get; set; }
        public long? RatingId { get; set; }
        public string? ImdbID { get; set; }
    }
}
