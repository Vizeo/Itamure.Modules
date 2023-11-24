using System.Text.Json.Serialization;

namespace CalendarTools.Entities
{
    public class Calendar : IEntity
    {
        public long Id { get; set; }
        public Guid? UserId { get; set; }
        public string? Name { get; set; }
        public string? Color { get; set; }
        public string? ICalAddress { get; set; }

        [JsonIgnore]
        public string? Data { get; set; }
    }
}
