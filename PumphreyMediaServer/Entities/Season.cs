namespace MediaServer.Entities
{
    public class Season : IEntity
	{
        public long Id { get; set; }
        public string? Name { get; set; }
        public int Order { get; set; }
    }
}
