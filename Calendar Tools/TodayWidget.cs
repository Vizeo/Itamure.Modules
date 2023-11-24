using Itamure.Core;

namespace CalendarTools
{
    public class TodayWidget : Widget
    {
        public TodayWidget()
        {
        }

        public override string SettingsLink => $"/{Module.WEB_ROUTE_BASE}/TodayWidgetSettings";
        public override string Link => $"/{Module.WEB_ROUTE_BASE}/TodayWidget";
        public override string Name => "Today";
    }
}
