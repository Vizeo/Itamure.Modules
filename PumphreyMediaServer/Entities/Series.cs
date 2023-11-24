namespace MediaServer.Entities
{
    public class Series : IEntity
    {
        public long Id { get; set; }
        public string? ImdbID { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public long? RatingId { get; set; }
        public List<Season>? Seasons { get; set; }
    }
}
