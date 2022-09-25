using IntegratedWebServer.Core.RequestProcessors;
using Itamure.Core;
using Itamure.Core.Web;
using Itamure.Core.Web.Security;
using OctoprintMonitor.Entities;
using OctoprintMonitor.Events;

namespace OctoprintMonitor.Api
{
    [RequestProcessorMap($"/{Module.WEB_ROUTE_BASE}/Api/OctoprintMonitorService")]
    public class OctoprintMonitorService : RestServiceBase
    {
        [Api]
        [Authorize(ModulePermissions.ModifySettings)]
        public IEnumerable<PrinterInfo>? GetCurrentInstances()
        {
            if(Module.ObjectStore != null)
                return Module.ObjectStore.Retrieve<PrinterInfo>();

            return null;
        }

        [Api]
        [Authorize(ModulePermissions.ModifySettings)]
        public void Remove(PrinterInfo printerInfo)
        {
            if (Module.ObjectStore != null)
                Module.ObjectStore.Remove(printerInfo);

            if (Module.PrinterConnectionManager != null)
                Module.PrinterConnectionManager.PrinterRemoved(printerInfo);
        }

        [Api]
        [Authorize(ModulePermissions.ModifySettings)]
        public void Update(PrinterInfo printerInfo) //Returns the new printers id
        {
            if (Module.ObjectStore != null)
                Module.ObjectStore.Store(printerInfo);

            if (Module.PrinterConnectionManager != null)
                Module.PrinterConnectionManager.PrinterUpdated(printerInfo);
        }

        [Api]
        [Authorize(ModulePermissions.ModifySettings)]
        public long Add(PrinterInfo printerInfo) //Returns the new printers id
        {
            if (Module.ObjectStore != null)
                Module.ObjectStore.Store(printerInfo);

            if(Module.PrinterConnectionManager != null)
                Module.PrinterConnectionManager.PrinterAdded(printerInfo);

            return printerInfo.Id;
        }

        [Api]
        [Authorize(OctoprintMonitorPermissions.CanViewWidgetProcess)]
        public ResultFileStream? GetCurrentGCode(long printerId)
        {
            if (Module.PrinterConnectionManager != null)
            {
                var connection = Module.PrinterConnectionManager.GetConnection(printerId);
                var stream = connection!.GetGCodeFile().Result;
                if(stream != null)
                {
                    return stream.ToResultFileStream("text/x-gcode", "Current.gcode");
                }
            }
            return null;
        }
    }
}
