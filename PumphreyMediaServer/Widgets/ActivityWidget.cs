using Itamure.Core;
using TagLib.Id3v2;

namespace MediaServer.Widgets
{
    public class ActivityWidget : Widget
    {
        public ActivityWidget()
        {
        }

        public override string Name => "Activity";

        public override string Link => $"/{Module.WEB_ROUTE_BASE}/ActivityWidget";
    }
}
