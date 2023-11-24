using Itamure.Core;

namespace OctoprintMonitor
{
    public class PrinterStatus3DWidget : Widget
    {
        public PrinterStatus3DWidget(long printerId)
        {
            Instance = printerId;
        }

        public override string Link => $"/{Module.WEB_ROUTE_BASE}/PrinterStatus3DWidget?printerId={Instance}";
    }
}
