using CalendarTools;
using CalendarTools.Events;
using CalendarTools.Tasks;
using IntegratedWebServer.Core;
using IntegratedWebServer.Core.RequestProcessors;
using Itamure.Core;
using Itamure.Core.Security;
using Itamure.Core.Web;
using System.IO;
using System.Reflection;
using static System.Net.Mime.MediaTypeNames;

namespace CalendarTools
{
    [Name("Calendar Tools")]
    public class Module : ItamureModule
    {
        public const string WEB_ROUTE_BASE = "calendarTools";

        private IRequestProcessor? _requestProcessor;
        private IEnumerable<KeyValuePair<string, Type>> _mappedRequestProcessors;
        private Stream? _stream;

        internal static Module? CurrentModule { get; private set; }
        internal static RizeDb.ObjectStore? ObjectStore { get; private set; }

        public Module()
        {
            CurrentModule = this;

            string? path = null;
#if DEBUG
            //Folder path for web files durring development
            var exeLocation = System.Reflection.Assembly.GetExecutingAssembly().Location;
            if (exeLocation != null)
                path = new DirectoryInfo(exeLocation).Parent?.Parent?.Parent?.Parent?.FullName + "\\";
#else
            path = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
#endif

            if (path != null)
            {
                var wwwPath = Path.Combine(path, "wwwroot/dist");
                _requestProcessor = new FileProcessor(wwwPath);
            }
            _mappedRequestProcessors = Assembly.GetExecutingAssembly().GetMappedRequestProcessors();

            AddScheduledTasks(new CalendarToolsTask());

            RegisterEvent<CalendarsUpdated>("Calendars Updated", CalendarToolsPermissions.WidgetPermissions);
            RegisterWidget<CalendarToolsWidget>("CalendarTools Widget", CalendarToolsPermissions.WidgetPermissions);
            ShowWidget(new CalendarToolsWidget());
        }

        public override async Task RouteWebRequest(IRequest request, IResponse response, IntegratedWebServer.Core.ISession session)
        {
            //Try to find any mapped request processors such as APIs
            var address = request.Address.ToUpper();
            foreach (var keyValuePair in _mappedRequestProcessors
                .OrderByDescending(r => r.Key.Length))
            {
                if (address.IndexOf(keyValuePair.Key) == 0)
                {
                    var slashesCount = keyValuePair.Key.Count(c => c == '/') - 1;
                    request.ProcessedAddressVariables = slashesCount;
                    var resultProcessor = (IRequestProcessor?)Activator.CreateInstance(keyValuePair.Value);
                    if (resultProcessor != null)
                    {
                        await resultProcessor.ProcessRequest(request, response, session);
                    }
                    return;
                }
            }

            //Try to find any files in the www folder
            if (_requestProcessor != null &&
                !await _requestProcessor.ProcessRequest(request, response, session))
            {
                response.SetResponseHeader("HTTP/1.1 404 File not found");
                response.AddContent(EmptyStream.Default, 0);
            }
        }

        public override string AdministrationWebPath => $"/{WEB_ROUTE_BASE}/Settings";

        public override string WebRouteBase => WEB_ROUTE_BASE;

        protected override void Start()
        {
            _stream = GetFileStream("Database.db", false);
            ObjectStore = new RizeDb.ObjectStore(_stream, Environment.MachineName);
        }

        public override void Stop()
        {
            ObjectStore?.Dispose();
            _stream!.Close();
        }

        public class SystemModuleSettings
        {
            public bool InitSetup { get; set; }
        }
    }
}
