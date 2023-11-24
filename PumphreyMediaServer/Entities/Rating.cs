namespace MediaServer.Entities
{
    public class Rating : IEntity
    {
        public long Id { get; set; }
        public MediaSubType MediaSubType { get; set; }
        public string? Name { get; set; }
    }
}
