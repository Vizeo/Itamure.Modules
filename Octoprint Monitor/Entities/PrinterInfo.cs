namespace OctoprintMonitor.Entities
{
    public class PrinterInfo : IEntity
    {
        public long Id { get; set; }
        public string? Address { get; set; }
        public string? Name { get; set; }
        public string? ApiKey { get; set; }
    }
}
