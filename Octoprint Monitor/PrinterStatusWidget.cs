using Itamure.Core;

namespace OctoprintMonitor
{
    public class PrinterStatusWidget : Widget
    {
        public PrinterStatusWidget(long printerId)
        {
            Instance = printerId;
        }

        public override string Link => $"/{Module.WEB_ROUTE_BASE}/PrinterStatusWidget?printerId={Instance}";
    }
}
