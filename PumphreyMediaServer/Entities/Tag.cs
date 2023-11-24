using MediaServer.Entities;

namespace MediaServer
{
    public class Tag : IEntity
    {
        public long Id { get; set; }
        public MediaSubType MediaSubType { get; set; }
        public string? Name { get; set; }
    }
}
