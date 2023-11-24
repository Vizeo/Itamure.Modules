﻿using IntegratedWebServer.Core;
using IntegratedWebServer.Core.RequestProcessors;
using Itamure.Core;
using Itamure.Core.Security;
using Itamure.Core.Web;
using MediaServer;
using MediaServer.Api;
using MediaServer.Entities;
using MediaServer.Events;
using MediaServer.Omdb;
using MediaServer.Tasks;
using System.IO;
using System.Reflection;

namespace MediaServer
{
    [Name("Pumphrey Media Server")]
    public class Module : ItamureModule
    {
        public const string WEB_ROUTE_BASE = "mediaServer";

        private IRequestProcessor? _requestProcessor;
        private IEnumerable<KeyValuePair<string, Type>> _mappedRequestProcessors;
        private Stream? _stream;
        private SyncTask _syncTask;

        //private Notification _notification;

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

            var iconStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("PumphreyMediaServer.Itamure.svg");
            var appIcon = new AppIcon(iconStream, "Image/svg+xml");

            _syncTask = new SyncTask();
            AddScheduledTasks(_syncTask);

            //RegisterWidget<PumphreyMediaServerWidget>("PumphreyMediaServer Widget", PumphreyMediaServerPermissions.WidgetPermissions);

            RegisterApp(new Itamure.Core.App("Pumphrey Media Server", $"/{WEB_ROUTE_BASE}/App", appIcon, MediaServerPermissions.AppPermissions));
            //RegisterEvent<IterationChangedEvent>("Iteration Changed", PumphreyMediaServerPermissions.WidgetPermissions);
            //RegisterEvent<ClickChangedEvent>("Click Changed", PumphreyMediaServerPermissions.WidgetPermissions);

            //Notifications can be subscribed to by users. Here is an example of using one in a module
            //AddNotification(_notification);
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

        public override string AdministrationWebPath => string.Empty;

        public override string WebRouteBase => WEB_ROUTE_BASE;

        //internal Notification Notification { get; } = new Notification("PumphreyMediaServer Notification");

        protected override void Start()
        {
            _stream = GetFileStream("Database.db", false);
            var newFile = _stream.Length == 0;
            ObjectStore = new RizeDb.ObjectStore(_stream, ModuleUniqueId.ToString());

            if (newFile)
            {
                SetupDefaultMediaTypeFiles();
                SetupDefaultMediaRatings();
            }

            var settings = Module.ObjectStore.GetSetting<AppSettings>("AppSettings");
            if (settings == null)
            {
                settings = new AppSettings();
            }
            OmdbManager.ApiKey = settings.OmdbApiKey;

            //ShowWidget(new PumphreyMediaServerWidget());
        }

        public override void Stop()
        {
            ObjectStore?.Dispose();
            _stream!.Close();
        }

        public void RunSync()
        {
            RunScheduledTask(_syncTask);
        }

        private void SetupDefaultMediaTypeFiles()
        {
            if (ObjectStore != null)
            {
                //Video Files
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Video, FileExtension = ".mp4", ContentType = "video/mp4" });
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Video, FileExtension = ".mkv", ContentType = "video/mkv" });
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Video, FileExtension = ".mpg", ContentType = "video/mpeg" });
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Video, FileExtension = ".m4v", ContentType = "video/m4v" });
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Video, FileExtension = ".wmv", ContentType = "video/x-ms-wmv" });
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Video, FileExtension = ".avi", ContentType = "video/x-msvideo" });

                //Audio Files
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Audio, FileExtension = ".mp3", ContentType = "audio/mpeg" });
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Audio, FileExtension = ".wma", ContentType = "audio/x-ms-wma" });
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Audio, FileExtension = ".aac", ContentType = "	audio/aac" });

                //Image Files
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Image, FileExtension = ".tiff", ContentType = "image/tiff" });
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Image, FileExtension = ".tif", ContentType = "image/tiff" });
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Image, FileExtension = ".bmp", ContentType = "image/bmp" });
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Image, FileExtension = ".jpg", ContentType = "image/jpg" });
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Image, FileExtension = ".jpeg", ContentType = "image/jpeg" });
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Image, FileExtension = ".gif", ContentType = "image/gif" });
                ObjectStore.Store<MediaFileType>(new MediaFileType() { MediaType = MediaType.Image, FileExtension = ".png", ContentType = "image/png" });
            }
        }

        private void SetupDefaultMediaRatings()
        {
            if (ObjectStore != null)
            {
                //TV
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Series, Name = "NR" });
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Series, Name = "TV-Y" });
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Series, Name = "TV-Y7" });
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Series, Name = "TV-G" });
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Series, Name = "TV-PG" });
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Series, Name = "TV-14" });
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Series, Name = "TV-MA" });

                //Movies
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Movies, Name = "G" });
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Movies, Name = "PG" });
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Movies, Name = "PG-13" });
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Movies, Name = "R" });
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Movies, Name = "NC-17" });

                //Audio
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Music, Name = "General" });
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Music, Name = "Parental Advisory" });

                //Images
                ObjectStore.Store<Rating>(new Rating() { MediaSubType = MediaSubType.Pictures, Name = "General" });
            }
        }
    }
}
