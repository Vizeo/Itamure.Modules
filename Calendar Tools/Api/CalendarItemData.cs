namespace CalendarTools.Api
{
    public class CalendarItemData
    {
        public string? Summary { get; set; }
        public int? DurationMinutes { get; set; }
        public Boolean IsAllDay { get; set; }
        public DateTimeOffset? StartDate { get; set; }
        public DateTimeOffset? EndDate { get; set; }
        public string? Uid { get; set; }
        public string? Color { get; set; }
        public string? Calendar { get; set; }
    }
}
