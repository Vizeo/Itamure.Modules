using IntegratedWebServer.Core;
using IntegratedWebServer.Core.RequestProcessors;
using Itamure.Core;
using Itamure.Core.Security;
using Itamure.Core.Web;
using ScreenControl;
using ScreenControl.Tasks;
using System.IO;
using System.Reflection;
using static System.Net.Mime.MediaTypeNames;

namespace ScreenControl
{
    [Name("Screen Control")]
    public class Module : ItamureModule
    {
        internal static Module? CurrentModule { get; private set; }

        public Module()
        {
            AddScheduledTasks(new ScreenOffTask());
            AddScheduledTasks(new ScreenOnTask());
        }

        public override string? AdministrationWebPath => null;

        public override string? WebRouteBase => null;

        protected override void Start()
        {           
        }

        public override void Stop()
        {
        }
    }
}
