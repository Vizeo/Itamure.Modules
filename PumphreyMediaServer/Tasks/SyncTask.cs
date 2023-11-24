using Itamure.Core;
using Microsoft.Extensions.Primitives;
using MediaServer.Entities;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using PumphreyMediaServer.Tasks;
using System.Reflection.Metadata.Ecma335;

namespace MediaServer.Tasks
{
    public class SyncTask : IScheduledTask
    {
        private static MediaItemType[] FileMediaItemTypes = new MediaItemType[]
        {
            MediaItemType.UnknownImageFile,
            MediaItemType.UnknownVideoFile,
            MediaItemType.UnknownAudioFile,
            MediaItemType.MusicFile,
            MediaItemType.PictureFile,
            MediaItemType.MovieFile,
            MediaItemType.SeriesFile
        };

        public string Name => "Media Sync";

        public object CanRunManuallyPermission => MediaServerPermissions.SettingsPermissions;

        public object CanChangeEnabledPermission => MediaServerPermissions.SettingsPermissions;

        public object CanModifyPermission => MediaServerPermissions.SettingsPermissions;

        public string? AdministrationWebPath => null;

        private SyncFactory _syncFactory = new SyncFactory();

        public void Run(IScheduledTaskInterface scheduledTaskInterface)
        {
            ImportMedia(scheduledTaskInterface);
            ImportFileMetadata(scheduledTaskInterface);
        }

        private void ImportMedia(IScheduledTaskInterface scheduledTaskInterface)
        {
            var title = "Importing Media";

            try
            {
                DateTimeOffset? started = null;

                if (Module.ObjectStore != null)
                {
                    var sources = Module.ObjectStore.Retrieve<MediaSource>()
                        .Where(a => true)
                        .ToList();

                    while (started == null ||
                        started < sources.Max(s => s.CreatedDate))
                    {
                        var count = 0;
                        scheduledTaskInterface.SendProgress(title, sources.Count, count);
                        if(sources.Count == 0)
                        {
                            break;
                        }
                        started = sources.Max(s => s.CreatedDate);

                        var directorySources = sources.Where(s => s.MediaSourceType == MediaSourceType.Directory)
                            .Cast<DirectoryMediaSource>();
                        
                        ImportFromDirectories(scheduledTaskInterface, directorySources, title, sources.Count, count);

                        //Run any other syncs

                        //Check for changes
                        sources = Module.ObjectStore.Retrieve<MediaSource>()
                            .ToList();
                    };
                }
            }
            finally
            {
                scheduledTaskInterface.EndProgress(title);
            }
        }

        private void ImportFromDirectories(IScheduledTaskInterface scheduledTaskInterface, IEnumerable<DirectoryMediaSource> directoryMediaSources, string title, int maxCount, int count)
        {
            //Load all files into memory
            List<string> files = new List<string>();

            foreach (var directoryMediaSource in directoryMediaSources)
            {
                try
                {
                    ImportFromDirectory(scheduledTaskInterface, directoryMediaSource, files);
                }
                catch
                {
                    //Do nothing for now
                }
                finally
                {
                    count++;
                    scheduledTaskInterface.SendProgress(title, maxCount, count);
                }
            }

            //Get existing files
            var existingFiles = Module.ObjectStore!.Retrieve<MediaItem>()
                .Cast<FileMediaItem>()
                .Where(i => FileMediaItemTypes.Contains(i.MediaItemType))
                .Select(i => new
                {
                    i.Id,
                    i.FilePath
                })
                .ToList();

            //filter out existing
            var finalFiles = files.Distinct().ToHashSet();
            foreach(var exising in existingFiles)
            {
                finalFiles.Remove(exising.FilePath!);
            }

            var mediaFileTypes = Module.ObjectStore!.Retrieve<MediaFileType>()
                .ToDictionary(f => f.FileExtension!.ToLower());

            var subTitle = "Importing Files";
            var subCount = 0;
            scheduledTaskInterface.SendProgress(subTitle, finalFiles.Count, subCount);

            try
            {
                foreach (var file in finalFiles)
                {
                    var extension = Path.GetExtension(file).ToLower();
                    if (mediaFileTypes.TryGetValue(extension, out var mediaFileType))
                    {
                        FileMediaItem fileMediaItem;
                        switch (mediaFileType.MediaType)
                        {
                            case MediaType.Audio:
                                fileMediaItem = new MusicFileMediaItem()
                                {
                                    MediaItemType = MediaItemType.MusicFile
                                };
                                break;
                            case MediaType.Video:
                                fileMediaItem = new VideoFileMediaItem()
                                {
                                    MediaItemType = MediaItemType.UnknownVideoFile
                                };
                                break;
                            case MediaType.Image:
                                fileMediaItem = new PictureFileMediaItem()
                                {
                                    MediaItemType = MediaItemType.PictureFile
                                };
                               break;
                            default:
                                throw new Exception($"Unhandled media type {mediaFileType.MediaType}");
                        }

                        fileMediaItem.MediaType = mediaFileType.MediaType;
                        fileMediaItem.Name = Path.GetFileNameWithoutExtension(file);
                        fileMediaItem.FilePath = file;
                        fileMediaItem.AddedDate = DateTimeOffset.UtcNow;

                        Module.ObjectStore!.Store<MediaItem>(fileMediaItem);
                    }
                    subCount++;
                    scheduledTaskInterface.SendProgress(subTitle, finalFiles.Count, subCount);
                }
            }
            finally
            {
                scheduledTaskInterface.EndProgress(subTitle);
            }

            //TODO: Remove or flag and media files that were not found
        }
      
        private void ImportFromDirectory(IScheduledTaskInterface scheduledTaskInterface, DirectoryMediaSource directoryMediaSource, List<string> files)
        {
            try
            {
                RecursiveGetFiles(directoryMediaSource.Path!, files, directoryMediaSource.IncludeSubdirectories);
            }
            catch (Exception ex)
            {

            }
        }

        private void RecursiveGetFiles(string directory, List<string> files, bool includeSubDirectories)
        {
            foreach (var file in Directory.GetFiles(directory))
            {
                var fil = new FileInfo(file);
                if (!fil.Attributes.HasFlag(FileAttributes.Hidden) &&
                    !fil.Attributes.HasFlag(FileAttributes.System))
                {
                    files.Add(file);
                }
            }

            if (includeSubDirectories)
            {
                foreach (var subDirectory in Directory.GetDirectories(directory))
                {
                    var dir = new DirectoryInfo(subDirectory);
                    if (!dir.Attributes.HasFlag(FileAttributes.Hidden) &&
                        !dir.Attributes.HasFlag(FileAttributes.System))
                    {
                        try
                        {
                            RecursiveGetFiles(subDirectory, files, includeSubDirectories);
                        }
                        catch
                        {
                            //Do nothing
                        }
                    }
                }
            }
        }

        private string Deliniate(IEnumerable<string> values)
        {
            var firstSet = false;
            var stringBuilder = new StringBuilder();

            foreach(var value in values)
            {
                if(firstSet)
                {
                    stringBuilder.Append(";" + value);
                }
                else
                {
                    stringBuilder.Append(value);
                    firstSet = true;
                }
            }

            return stringBuilder.ToString();
        }

        private void ImportFileMetadata(IScheduledTaskInterface scheduledTaskInterface)
        {
            var fileMediaItems = Module.ObjectStore!.Retrieve<MediaItem>()
                .Where(i => FileMediaItemTypes.Contains(i.MediaItemType) &&
                    i.MetadataDate == null)
                .ToList();

            var serieses = Module.ObjectStore!.Retrieve<Series>()
                .ToList();

            var title = "Getting metadata from files";
            var count = 0;
            scheduledTaskInterface.SendProgress(title, fileMediaItems.Count, count);

            try
            {
                foreach (FileMediaItem fileMediaItem in fileMediaItems)
                {
                    try
                    {
                        var mfile = TagLib.File.Create(fileMediaItem.FilePath);

                        if (!string.IsNullOrWhiteSpace(mfile.Tag.Title))
                        {
                            fileMediaItem.Name = mfile.Tag.Title;
                        }

                        var sync = _syncFactory.GetSync(fileMediaItem);
                        if (sync.TryImportMetadata(fileMediaItem, mfile))
                        {
                            fileMediaItem.MetadataDate = DateTimeOffset.UtcNow;
                            fileMediaItem.Error = null;

                            //Update full record because a lot may have changed
                            Module.ObjectStore!.Store<MediaItem>(fileMediaItem);
                        }

                        sync.TryImportImage(fileMediaItem, mfile);
                    }
                    catch (Exception e)
                    {
                        Module.ObjectStore!.Update<MediaItem, FileMediaItem>(fileMediaItem.Id, new
                        {
                            Error = e.Message
                        });
                    }

                    count++;
                    scheduledTaskInterface.SendProgress(title, fileMediaItems.Count, count);
                }
            }
            finally
            {
                scheduledTaskInterface.EndProgress(title);
            }
        }
    }
}
