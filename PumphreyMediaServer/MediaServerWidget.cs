using Itamure.Core;

namespace MediaServer
{
    public class MediaServerWidget : Widget
    {
        public MediaServerWidget()
        {
        }

        public override string Name => "Overview";

        public override string Link => $"/{Module.WEB_ROUTE_BASE}/OverviewWidget";
    }
}
