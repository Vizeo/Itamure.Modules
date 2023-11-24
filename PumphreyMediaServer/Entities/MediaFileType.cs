namespace MediaServer.Entities
{
    public class MediaFileType : IEntity
    {
        public long Id { get; set; }
        public MediaType MediaType { get; set; }
        public string? FileExtension { get; set; }
        public string? ContentType { get; set; }
    }
}
