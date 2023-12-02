using IntegratedWebServer.Core.RequestProcessors;
using Itamure.Core;
using Itamure.Core.Web;
using Itamure.Core.Web.Security;
using Microsoft.VisualBasic;
using MediaServer.Entities;
using MediaServer.Events;
using RizeDb.ObjectOriented;
using System.Drawing;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Xml.Linq;
using MediaServer.Omdb;
using PumphreyMediaServer.Api.MovieGroupings;

namespace MediaServer.Api
{
    [RequestProcessorMap($"/{Module.WEB_ROUTE_BASE}/Api/mediaServerService")]
    public class MediaServerService : RestServiceBase
    {
        [Api]
        [Authorize(MediaServerPermissions.SettingsPermissions)]
        public IEnumerable<MediaSource> GetSources()
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            return Module.ObjectStore.Retrieve<MediaSource>();
        }

        [Api]
        [Authorize(MediaServerPermissions.SettingsPermissions)]
        public OmdbApiData? GetOmdbApiKey()
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var settings = Module.ObjectStore.GetSetting<AppSettings>("AppSettings");
            var result = new OmdbApiData()
            {
                Key = settings?.OmdbApiKey
            };
            return result;
        }

        [Api]
        [Authorize(MediaServerPermissions.SettingsPermissions)]
        public void SetOmdbApiKey(OmdbApiData omdbApiData)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var settings = Module.ObjectStore.GetSetting<AppSettings>("AppSettings");
            if(settings == null)
            {
                settings = new AppSettings();
            }
            settings.OmdbApiKey = omdbApiData.Key;
            Module.ObjectStore.SetSetting("AppSettings", settings);
            OmdbManager.ApiKey = omdbApiData.Key;
        }

        [Api]
        [Authorize(MediaServerPermissions.ModifySourcesPermissions)]
        public MediaSource AddMediaSource(MediaSource mediaSource)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            mediaSource.CreatedDate = DateTimeOffset.UtcNow;
            Module.ObjectStore.Store<MediaSource>(mediaSource);
            Module.CurrentModule?.RunSync();
            return mediaSource; //Return the media source with the id
        }

        [Api]
        [Authorize(MediaServerPermissions.ModifySourcesPermissions)]
        public bool ValidateDirectory(string path)
        {
            return System.IO.Directory.Exists(path);
        }

        [Api]
        [Authorize(MediaServerPermissions.ModifySourcesPermissions)]
        public void RemoveSource(MediaSource mediaSource)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            Module.ObjectStore.Remove<MediaSource>(mediaSource);
            Module.CurrentModule?.RunSync();
        }

        [Api]
        public IEnumerable<Rating> GetRatings(MediaSubType mediaSubType)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            return Module.ObjectStore.Retrieve<Rating>()
                .Where(r => r.MediaSubType == mediaSubType);
        }

        [Api]
        public Rating AddRating(string name, MediaSubType mediaSubType)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var existing = Module.ObjectStore.Retrieve<Rating>()
                .FirstOrDefault(r => r.MediaSubType == mediaSubType &&
                    r.Name != null &&
                    r.Name.ToUpper() == name.ToUpper());

            if (existing != null)
            {
                throw new Exception($"Rating {name} for {mediaSubType} already exists");
            }

            var result = new Rating()
            {
                MediaSubType = mediaSubType,
                Name = name
            };

            Module.ObjectStore.Store(result);

            return result;
        }

        [Api]
        public void UpdateRating(Rating rating)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var existing = Module.ObjectStore.Retrieve<Rating>(rating.Id);

            if (existing == null)
            {
                throw new Exception($"Could not find rating. It may have been removed");
            }

            Module.ObjectStore.Update<Rating>(rating.Id, new
            {
                Name = rating.Name
            });
        }

        [Api]
        public void DeleteRating(long ratingId)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            Module.ObjectStore.Remove<Rating>(ratingId);
        }


        [Api]
        public IEnumerable<Tag> GetTags(MediaSubType mediaSubType)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            return Module.ObjectStore.Retrieve<Tag>()
                .Where(r => r.MediaSubType == mediaSubType);
        }

        [Api]
        public Tag AddTag(string name, MediaSubType mediaSubType)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var existing = Module.ObjectStore.Retrieve<Tag>()
                .FirstOrDefault(r => r.MediaSubType == mediaSubType &&
                    r.Name != null &&
                    r.Name.ToUpper() == name.ToUpper());

            if (existing != null)
            {
                throw new Exception($"Tag {name} for {mediaSubType} already exists");
            }

            var result = new Tag()
            {
                MediaSubType = mediaSubType,
                Name = name
            };

            Module.ObjectStore.Store(result);

            return result;
        }

        [Api]
        public void UpdateTag(Tag tag)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var existing = Module.ObjectStore.Retrieve<Tag>(tag.Id);

            if (existing == null)
            {
                throw new Exception($"Could not find Tag. It may have been removed");
            }

            Module.ObjectStore.Update<Tag>(tag.Id, new
            {
                Name = tag.Name
            });
        }

        [Api]
        public void DeleteTag(long tagId)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            Module.ObjectStore.Remove<Tag>(tagId);
        }


        [Api]
        public IEnumerable<MediaFileType> GetMediaFileTypes()
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            return Module.ObjectStore.Retrieve<MediaFileType>();
        }

        [Api]
        public MediaFileType AddMediaFileType(MediaFileType mediaFileType)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var existing = Module.ObjectStore.Retrieve<MediaFileType>()
                .FirstOrDefault(r => r.FileExtension!.ToUpper() == mediaFileType.FileExtension!.ToUpper());

            if (existing != null)
            {
                throw new Exception($"Media file type for extension {mediaFileType.FileExtension} already exists");
            }

            Module.ObjectStore.Store(mediaFileType);

            return mediaFileType;
        }

        [Api]
        public void UpdateMediaFielType(MediaFileType mediaFileType)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var existing = Module.ObjectStore.Retrieve<MediaFileType>(mediaFileType.Id);

            if (existing == null)
            {
                throw new Exception($"Could not find media type. It may have been removed");
            }

            Module.ObjectStore.Update<MediaFileType>(mediaFileType.Id, new
            {
                mediaFileType.FileExtension,
                mediaFileType.ContentType
            });
        }

        [Api]
        public void RemoveMediaFileType(long mediaFileTypeId)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            Module.ObjectStore.Remove<MediaFileType>(mediaFileTypeId);
        }

        [Api]
        public IEnumerable<VideoFileMediaItem> GetVideoMediaItems(MediaItemType mediaItemType, long folderId)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var test = Module.ObjectStore!.Retrieve<MediaItem>().ToList();

            var result = Module.ObjectStore!.Retrieve<MediaItem>()
                .Where(i => i.MediaItemType == mediaItemType &&
                    i.FolderId == folderId)
                .ToList()
                .Cast<VideoFileMediaItem>()
                .OrderBy(f => f.Name)
                .ThenBy(f => f.FilePath);

            return result;
        }

        [Api]
        public VideoFileMediaItem GetVideoMediaItem(long videoMediaItemId)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            return (VideoFileMediaItem)Module.ObjectStore!.Retrieve<MediaItem>(videoMediaItemId);                
        }

        [Api]
        public long AddFolder(Folder folder)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            if (folder.Id == 0)
            {
                Module.ObjectStore!.Store<Folder>(folder);
                return folder.Id;
            }
            else
            {
                throw new Exception("Folder must have id 0");
            }
        }

        [Api]
        public void UpdateFolder(Folder folder)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            if (folder.Id != 0)
            {
                Module.ObjectStore!.Update<Folder>(folder.Id, new
                {
                    folder.Name
                });
            }
            else
            {
                throw new Exception("Could not find folder with id " + folder.Id);
            }
        }

        [Api]
        public IEnumerable<Folder> GetFolders(long parentId)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var result = Module.ObjectStore!.Retrieve<Folder>()
                .Where(f => f.ParentId == parentId)
                .ToList()
                .OrderBy(a => a.Name);

            return result;
        }

        [Api]
        public void DeleteFolder(long folderId)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var folder = Module.ObjectStore!.Retrieve<Folder>(folderId);
            var mediaItems = new List<MediaItem>();
            var folders = new List<Folder>();
            folders.Add(folder);

            RecursiveGetFolderMedia(folderId, mediaItems, folders);

            Module.ObjectStore!.ProcessTransactionGroup(g =>
            {
                foreach (var mediaItem in mediaItems)
                {
                    g.Update<MediaItem>(mediaItem.Id, new
                    {
                        //Update series metadata?
                        FolderId = (long?)-1 //Movies special folder Id
                    });
                }

                foreach (var subFolder in folders)
                {
                    g.Remove<Folder>(subFolder.Id);
                }
            });
        }

        private void RecursiveGetFolderMedia(long folderId, List<MediaItem> mediaItems, List<Folder> folders)
        {
            var subFolders = Module.ObjectStore!.Retrieve<Folder>()
                .Where(f => f.ParentId == folderId);
            var subMediaItems = Module.ObjectStore!.Retrieve<MediaItem>()
                .Where(f => f.FolderId == folderId);

            mediaItems.AddRange(subMediaItems);

            foreach (var subFolder in subFolders)
            {
                folders.Add(subFolder);
                RecursiveGetFolderMedia(subFolder.Id, mediaItems, folders);
            }
        }

        [Api]
        public IEnumerable<VideoFileMediaItem> GetUnassignedVideoMediaItems()
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            return Module.ObjectStore!.Retrieve<MediaItem>()
                .Where(i => i.FolderId == null &&
                    i.MediaItemType == MediaItemType.UnknownVideoFile)
                .ToList()
                .Cast<VideoFileMediaItem>()
                .OrderBy(a => a.Name)
                .ThenBy(a => a.FilePath);
        }

        [Api]
        public void AssignVideoToMovies(IEnumerable<long> videoFileMediaItemIds, long folderId)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            Module.ObjectStore!.ProcessTransactionGroup(g =>
            {
                foreach (long id in videoFileMediaItemIds)
                {
                    var update = new
                    {
                        FolderId = folderId,
                        SeriesId = (short?)null,
                        SeasonId = (short?)null,
                        MediaItemType = MediaItemType.MovieFile
                    };

                    g.Update<MediaItem, VideoFileMediaItem>(id, update);

                    //Update file metadata?
                }
            });
        }

        [Api]
        public IEnumerable<Series> GetSeriesList()
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            return Module.ObjectStore!.Retrieve<Series>()
                .ToList();
        }

        [Api]
        public Series GetSeries(long id)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            return Module.ObjectStore!.Retrieve<Series>(id);
        }

        [Api]
        public AddSeriesResponse AddSeries(Series series)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            string? errorMessage = null;
            if (series.Id != 0)
            {
                errorMessage = "New series cannot have an assigned Id";
            }

            //Make sure there are no series with that name already
            var existing = Module.ObjectStore!.Retrieve<Series>()
                .FirstOrDefault(s => s.Name!.ToUpper() == series.Name!.ToUpper());

            if (existing != null)
            {
                errorMessage = $"A series with the name {series.Name!} all ready exists";
            }

            var result = new AddSeriesResponse();
            if (errorMessage != null)
            {
                result.Success = false;
                result.Message = errorMessage;
            }
            else
            {
                if (series.Seasons == null)
                {
                    series.Seasons = new List<Season>();
                }

                Module.ObjectStore!.Store<Series>(series);

                result.Success = true;
                result.Series = series;
            }

            return result;
        }

        [Api]
        public void SaveSeries(Series series)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            //Make sure there are no series with that name already
            var existing = Module.ObjectStore!.Retrieve<Series>(series.Id);

            if (existing == null)
            {
                throw new Exception($"That series does not exist");
            }

            //Don't do update just replace the whole entry
            Module.ObjectStore!.Store<Series>(series);

            //The sort order of seasons may have changed as well as the name of the series so file metadata needs to be updated
            var videoMediaFileItems = Module.ObjectStore!.Retrieve<MediaItem, VideoFileMediaItem>()
                .Where(i => i.SeriesId == series.Id)
                .ToList()
                .Cast<VideoFileMediaItem>()
                .ToList();

            UpdateVideoMediaItemFilesMetadata(videoMediaFileItems);
        }

        [Api]
        public void AssignVideoToSeason(short seriesId, short seasonId, IEnumerable<long> videoFileMediaItemIds)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var existing = GetSeasonMediaItems(seriesId, seasonId);
            var maxOrder = existing.Count() > 0 ? existing.Max(o => o.Order) : 0;

            foreach (var id in videoFileMediaItemIds)
            {
                var update = new
                {
                    SeriesId = seriesId,
                    SeasonId = seasonId,
                    MediaItemType = MediaItemType.SeriesFile,
                    Order = ++maxOrder
                };

                Module.ObjectStore!.Update<MediaItem, VideoFileMediaItem>(id, update);
            }

            UpdateVideoMediaItemFilesMetadata(videoFileMediaItemIds);
        }

        [Api]
        public IEnumerable<VideoFileMediaItem> GetSeasonMediaItems(long seriesId, long seasonId)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            return Module.ObjectStore!.Retrieve<MediaItem, VideoFileMediaItem>()
                .Where(i => i.SeriesId == seriesId
                    && i.SeasonId == seasonId)
                .ToList()
                .Cast<VideoFileMediaItem>()
                .OrderBy(a => a.Order)
                .ThenBy(a => a.Name)
                .ThenBy(a => a.FilePath)
                .ToList();
        }

        [Api]
        public void SetSeasonMediaItemSort(IEnumerable<long> videoFileMediaItemIds)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var order = 0;
            Module.ObjectStore!.ProcessTransactionGroup(g =>
            {
                foreach (var id in videoFileMediaItemIds)
                {
                    var update = new
                    {
                        Order = ++order
                    };

                    g!.Update<MediaItem, VideoFileMediaItem>(id, update);
                }
            });

            UpdateVideoMediaItemFilesMetadata(videoFileMediaItemIds);
        }

        [Api]
        public void DeleteSeason(long seriesId, long seasonId)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            //All media in the season is moved back to unassigned
            var videoFileMediaItemIds = Module.ObjectStore!.Retrieve<MediaItem, VideoFileMediaItem>()
                .Where(i => i.SeriesId == seriesId
                    && i.SeasonId == seasonId)
                .Select(i => i.Id)
                .ToList();

            var series = Module.ObjectStore!.Retrieve<Series>(seriesId);
            var season = series.Seasons!.FirstOrDefault(s => s.Id == seasonId);
            if (season != null)
            {
                series.Seasons!.Remove(season);
            }

            Module.ObjectStore!.ProcessTransactionGroup(g =>
            {
                UnassignVideoFileMediaItemItems(videoFileMediaItemIds, g);
                g.Store<Series>(series);
            });
        }

        [Api]
        public void DeleteSeries(long seriesId)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            //All media in the season is moved back to unassigned
            var videoFileMediaItemIds = Module.ObjectStore!.Retrieve<MediaItem, VideoFileMediaItem>()
                .Where(i => i.SeriesId == seriesId)
                .Select(i => i.Id)
                .ToList();

            Module.ObjectStore!.ProcessTransactionGroup(g =>
            {
                UnassignVideoFileMediaItemItems(videoFileMediaItemIds, g);
                g.Remove<Series>(seriesId);
            });
        }

        [Api]
        public void UnassignVideoFileMediaItems(IEnumerable<long> videoFileMediaItemIds)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            Module.ObjectStore!.ProcessTransactionGroup(g =>
            {
                UnassignVideoFileMediaItemItems(videoFileMediaItemIds, g);
            });
        }

        private void UnassignVideoFileMediaItemItems(IEnumerable<long> videoFileMediaItemIds, TransactionGroup transactionGroup)
        {
            var update = new
            {
                SeriesId = (short?)null,
                SeasonId = (short?)null,
                MediaItemType = MediaItemType.UnknownVideoFile
            };

            foreach (var id in videoFileMediaItemIds)
            {
                transactionGroup.Update<MediaItem, VideoFileMediaItem>(id, update);
            }
        }

        [Api]
        public void SetVideoFileMediaItemImage(long mediaItemId, string mimeType, byte[] data)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var mediaItem = (VideoFileMediaItem)Module.ObjectStore!.Retrieve<MediaItem>(mediaItemId);

            //Store in database
            var metaDataImage = Module.ObjectStore.Retrieve<MetadataImage>()
                .FirstOrDefault(m => m.MediaItemId == mediaItemId);

            if(metaDataImage == null)
            {
                metaDataImage = new MetadataImage()
                {
                    MediaItemId = mediaItemId,
                };
                metaDataImage.Data = data;
                metaDataImage.MimeType = mimeType;
                Module.ObjectStore.Store(metaDataImage);
            }
            else
            {
                Module.ObjectStore.Update<MetadataImage>(metaDataImage.Id, new
                {
                    Data = data,
                    MimeType = mimeType
                });
            }

            try
            {
                var file = TagLib.File.Create(mediaItem.FilePath);
                var pics = new TagLib.IPicture[1];                
                pics[0] = new TagLib.Picture();
                pics[0].Description = "Image";
                pics[0].MimeType = mimeType;
                pics[0].Data = data;
                file.Tag.Pictures = pics;
                file.Save();
            }
            catch
            {
                //Do nothing
            }
        }

        [Api]
        public Stream? GetVideoFileMediaItemImage(long mediaItemId)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var metaDataImage = Module.ObjectStore.Retrieve<MetadataImage>()
                .FirstOrDefault(m => m.MediaItemId == mediaItemId);
            
            if(metaDataImage != null)
            {
                return new ResultFileStream(new MemoryStream(metaDataImage.Data!), metaDataImage.MimeType);
            }
            return null;
        }

        [Api]
        public void SetVideoFileMediaMetadata(VideoFileMediaItem videoFileMediaItem)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            Module.ObjectStore.Update<MediaItem, VideoFileMediaItem>(videoFileMediaItem.Id, new
            {
                videoFileMediaItem.Description,
                videoFileMediaItem.Name,
                videoFileMediaItem.RatingId,
                videoFileMediaItem.Year,
                videoFileMediaItem.ImdbID,
                videoFileMediaItem.MetadataTags
            });

            UpdateVideoMediaItemFileMetadata(videoFileMediaItem);
        }

        private void UpdateVideoMediaItemFilesMetadata(IEnumerable<long> videoFileMediaItemIds)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var videoMediaFileItems = Module.ObjectStore!.Retrieve<MediaItem, VideoFileMediaItem>()
                .Where(i => videoFileMediaItemIds.Contains(i.Id))
                .ToList()
                .Cast<VideoFileMediaItem>()
                .ToList();

            UpdateVideoMediaItemFilesMetadata(videoMediaFileItems);
        }

        private void UpdateVideoMediaItemFilesMetadata(IEnumerable<VideoFileMediaItem> videoFileMediaItems)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            foreach(var item in videoFileMediaItems)
            {
                UpdateVideoMediaItemFileMetadata(item);
            }
        }

        private string[] GetMetadataFromTags(VideoFileMediaItem videoFileMediaItem, MetadataTagType metadataTagType)
        {
            return videoFileMediaItem.MetadataTags!
                .Where(t => t.MetadataTagType == metadataTagType &&
                    !string.IsNullOrWhiteSpace(t.Value))
                .Select(t => t.Value!)
                .ToArray();
        }

        private void UpdateVideoMediaItemFileMetadata(VideoFileMediaItem videoFileMediaItem)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            try
            {
                //Store in file metadata
                var file = TagLib.File.Create(videoFileMediaItem.FilePath);

                if (videoFileMediaItem.MediaItemType == MediaItemType.MovieFile)
                {
                    file.Tag.Album = null;
                    file.Tag.Disc = 0; 
                    file.Tag.Track = 0;
                    file.Tag.Grouping = "Movie";
                    file.Tag.Genres = GetMetadataFromTags(videoFileMediaItem, MetadataTagType.Genre);
                    file.Tag.Performers = GetMetadataFromTags(videoFileMediaItem, MetadataTagType.Actor);
                    file.Tag.Composers = GetMetadataFromTags(videoFileMediaItem, MetadataTagType.Writer);
                    file.Tag.Conductor = string.Join(",", GetMetadataFromTags(videoFileMediaItem, MetadataTagType.Director));
                }
                else if (videoFileMediaItem.MediaItemType == MediaItemType.SeriesFile &&
                    videoFileMediaItem.SeriesId.HasValue)
                {
                    var series = Module.ObjectStore.Retrieve<Series>(videoFileMediaItem.SeriesId.Value);

                    if (series != null &&
                        series.Seasons != null)
                    {
                        var seasonIndex = 0;

                        for (var i = 0; i < series.Seasons.Count; i++)
                        {
                            var season = series.Seasons[i];
                            if(season.Id == videoFileMediaItem.SeasonId)
                            {
                                seasonIndex = i + 1;
                                break;
                            }
                        }

                        if(seasonIndex != 0)
                        {
                            file.Tag.Album = series.Name;
                            file.Tag.Disc = Convert.ToUInt16(seasonIndex);
                            file.Tag.Track = Convert.ToUInt16(videoFileMediaItem.Order);
                            file.Tag.Grouping = "Episode";
                        }
                        else
                        {
                            //Could not find matching season so just clean up
                            file.Tag.Album = null;
                            file.Tag.Disc = 0;
                            file.Tag.Track = 0;
                            file.Tag.Grouping = null;
                        }
                    }
                }

                file.Tag.Description = videoFileMediaItem.Description;
                file.Tag.Title = videoFileMediaItem.Name;
                file.Tag.AmazonId = videoFileMediaItem.ImdbID;
                if (videoFileMediaItem.Year.HasValue)
                {
                    file.Tag.Year = videoFileMediaItem.Year.Value;
                }
                file.Save();
            }
            catch (Exception ex)
            {
                Module.ObjectStore.Update<MediaItem>(videoFileMediaItem.Id, new
                {
                    Error = ex.Message
                });
            }
        }

        [Api]
        public void SetSeriesImage(long seriesId, string mimeType, byte[] data)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            //Store in database
            var seriesImage = Module.ObjectStore.Retrieve<SeriesImage>()
                .FirstOrDefault(m => m.SeriesId == seriesId);

            if (seriesImage == null)
            {
                seriesImage = new SeriesImage()
                {
                    SeriesId = seriesId,
                };
                seriesImage.Data = data;
                seriesImage.MimeType = mimeType;
                Module.ObjectStore.Store(seriesImage);
            }
            else
            {
                Module.ObjectStore.Update<SeriesImage>(seriesImage.Id, new
                {
                    Data = data,
                    MimeType = mimeType
                });
            }
        }

        [Api]
        public Stream? GetSeriesImage(long seriesId)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var metaDataImage = Module.ObjectStore.Retrieve<SeriesImage>()
                .FirstOrDefault(m => m.SeriesId == seriesId);

            if (metaDataImage != null)
            {
                return new ResultFileStream(new MemoryStream(metaDataImage.Data!), metaDataImage.MimeType);
            }
            return null;
        }

        [Api]
        public IEnumerable<VideoFileMediaItem> GetMovieGrouping(MovieGroupingType movieGroupingType, int count, string options)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }            

            var factory = new MovieGroupingFactory();
            var movieGrouping = factory.GetMovieGrouping(movieGroupingType);
            if (movieGrouping != null)
            {
                return movieGrouping.GetMovies(count, options);
            }
            throw new Exception("Unknown grouping");
        }
    }

    public class AddSeriesResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public Series? Series { get; set; }
    }

    public class OmdbApiData
    {
        public string? Key { get; set; }
    }
}
