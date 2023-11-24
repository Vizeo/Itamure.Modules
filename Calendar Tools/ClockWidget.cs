using Itamure.Core;

namespace CalendarTools
{
    public class ClockWidget : Widget
    {
        public ClockWidget()
        {
        }

        public override string SettingsLink => $"/{Module.WEB_ROUTE_BASE}/ClockWidgetSettings";
        public override string Link => $"/{Module.WEB_ROUTE_BASE}/ClockWidget";
        public override string Name => "Clock";
    }
}
