using Itamure.Core;

namespace CalendarTools
{
    public class CalendarToolsWidget : Widget
    {
        public CalendarToolsWidget()
        {
        }

        public override string Link => $"/{Module.WEB_ROUTE_BASE}/TodayWidget";
    }
}
