using RizeDb.ObjectOriented;

namespace MediaServer.Entities
{
    public enum SpecialPerentFolder : long
    {
        Movies = -1
    }

    public class Folder : IEntity
    {
        public long Id { get; set; }
        [Index(IndexSearchOptions.Int64)]
        public long ParentId { get; set; }
        public string? Name { get; set; }
    }
}
