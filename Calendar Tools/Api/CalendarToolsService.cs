using IntegratedWebServer.Core.RequestProcessors;
using Itamure.Core;
using Itamure.Core.Web;
using Itamure.Core.Web.Security;

namespace CalendarTools.Api
{
    [RequestProcessorMap($"/{Module.WEB_ROUTE_BASE}/Api/CalendarToolsService")]
    public class CalendarToolsService : RestServiceBase
    {
    }
}
