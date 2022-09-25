using Itamure.Core;

namespace OctoprintMonitor.Events
{
    public class PrinterStatus : Event
    {
        public PrinterStatus()
        {
        }

        public long? PrinterId { get; set; }
        public string? State { get; set; }
        public string? Name { get; set; }
        public double? ToolActual { get; set; }
        public double? ToolTarget { get; set; }
        public double? BedActual { get; set; }
        public double? BedTarget { get; set; }
        public string? JobState { get; set; }
        public double? JobProgress { get; set; }
        public double? PrintTime { get; set; }
        public double? PrintTimeLeft { get; set; }
        public double? EstimatedPrintTime { get; set; }
        public string? FileName { get; set; }
        public string? Url { get; set; }
    }
}
