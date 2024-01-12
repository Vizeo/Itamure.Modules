namespace MediaServer.Entities
{
	public class VideoGroup : IEntity
	{
		public long Id { get; set; }
		public string? Name { get; set; }
		public MovieGroupingType MovieGroupingType { get; set; }
		public int Count { get; set; }
		public string? Options { get; set; }
		public int? Order { get; set; }
	}
}
