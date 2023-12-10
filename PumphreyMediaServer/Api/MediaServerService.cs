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
using MediaServer.Api.MovieGroupings;
using RizeDb;
using System.Xml;

namespace MediaServer.Api
{
	[RequestProcessorMap($"/{Module.WEB_ROUTE_BASE}/Api/mediaServerService")]
	public class MediaServerService : RestServiceBase
	{
		private const string LAST_ITEM_CHANGE = "LastItemChange";
		internal static DateTime LastItemChange = DateTime.Now;

		private static object _locket = new object();

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
			if (settings == null)
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
		public void RemoveMediaFileItem(long mediaItemId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			Module.ObjectStore.Remove<MediaItem>(mediaItemId);
		}

		[Api]
		[Authorize]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
		public void DeleteRating(long ratingId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			Module.ObjectStore.Remove<Rating>(ratingId);
		}


		[Api]
		[Authorize]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
		public void DeleteTag(long tagId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			Module.ObjectStore.Remove<Tag>(tagId);
		}


		[Api]
		[Authorize]
		public IEnumerable<MediaFileType> GetMediaFileTypes()
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			return Module.ObjectStore.Retrieve<MediaFileType>();
		}

		[Api]
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
		public void RemoveMediaFileType(long mediaFileTypeId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			Module.ObjectStore.Remove<MediaFileType>(mediaFileTypeId);
		}

		[Api]
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
		public IEnumerable<VideoFileMediaItem> GetVideoMediaItems(MediaItemType mediaItemType, long folderId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var result = Module.ObjectStore!.Retrieve<MediaItem>()
				.Where(i => i.MediaItemType == mediaItemType &&
					i.FolderId == folderId)
				.ToList()
				.Cast<VideoFileMediaItem>()
				.OrderBy(f => f.Name)
				.ThenBy(f => f.FilePath);

			return result;
		}

		private Dictionary<Guid, UserMediaItem> GetUserMediaItems()
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			const string USER_MEDIA_ITEMS = "UserMediaItems";
			Dictionary<Guid, UserMediaItem>? result = null;

            result = Session[USER_MEDIA_ITEMS] as Dictionary<Guid, UserMediaItem>;
			var cacheDate = Session[LAST_ITEM_CHANGE] as DateTime?;

			if(result == null || 
				!cacheDate.HasValue || 
				cacheDate.Value < LastItemChange)
			{
				lock (_locket)
				{
					var mediaFileTypes = Module.ObjectStore.Retrieve<MediaFileType>()
						.ToList();
					result = Session[USER_MEDIA_ITEMS] as Dictionary<Guid, UserMediaItem>;
                    cacheDate = Session[LAST_ITEM_CHANGE] as DateTime?;

                    if (result == null ||
						!cacheDate.HasValue ||
						cacheDate.Value < LastItemChange) //Double lock check
					{
						var userUniqueId = Request.UserUniqueId!.Value;
						var userMediaReferences = Module.ObjectStore.Retrieve<UserMediaReference>()
						.Where(u => u.UserUniqueId == userUniqueId)
						.ToDictionary(u => u.MediaItemId);

						var mediaItems = Module.ObjectStore.Retrieve<MediaItem>()
							.ToList();

						result = new Dictionary<Guid, UserMediaItem>();

						foreach (var mediaItem in mediaItems)
						{
							if (!userMediaReferences.TryGetValue(mediaItem.Id, out var userMediaReference))
							{
								userMediaReference = new UserMediaReference()
								{
									MediaItemId = mediaItem.Id,
									UserUniqueId = Request.UserUniqueId!.Value,
									UniqueLink = Guid.NewGuid()
								};

								Module.ObjectStore.Store(userMediaReference);
							}

							var userMediaItem = new UserMediaItem();
							CopyProperties(mediaItem, userMediaItem);
							userMediaItem.UniqueKey = userMediaReference.UniqueLink;
							userMediaItem.MediaItemId = mediaItem.Id;

							if (mediaItem is FileMediaItem)
							{
								var fileMediaItem = (FileMediaItem)mediaItem;
								var extension = Path.GetExtension(fileMediaItem.FilePath)!.ToLower();
								userMediaItem.MimeType = mediaFileTypes.FirstOrDefault(t => t.FileExtension! == extension && t.MediaType == fileMediaItem.MediaType)?.ContentType;
							}

							result.Add(userMediaItem.UniqueKey, userMediaItem);
						}

						Session[USER_MEDIA_ITEMS] = result;
						Session[LAST_ITEM_CHANGE] = LastItemChange;

                    }
				}
			}

			return result;
		}

		[Api]
		[Authorize]
		public UserMediaItem GetVideoMediaItem(Guid UniqueKey)
		{
			return GetUserMediaItems()[UniqueKey];
		}

		[Api]
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize]
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
		[Authorize]
		public Series GetSeries(long id)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			return Module.ObjectStore!.Retrieve<Series>(id);
		}

		[Api]
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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

			if (metaDataImage == null)
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

			Module.ObjectStore.Update<MediaItem>(mediaItem.Id, new
			{
				MetadataDate = DateTime.UtcNow
			});

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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
		public Stream? GetVideoFileMediaItemImage(long mediaItemId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var metaDataImage = Module.ObjectStore.Retrieve<MetadataImage>()
				.FirstOrDefault(m => m.MediaItemId == mediaItemId);

			if (metaDataImage != null)
			{
				Response.Headers.Add("Expires", DateTime.Now.AddDays(10).ToString("r"));
				return new ResultFileStream(new MemoryStream(metaDataImage.Data!), metaDataImage.MimeType);
			}
			return null;
		}

		[Api]
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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

			foreach (var item in videoFileMediaItems)
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
							if (season.Id == videoFileMediaItem.SeasonId)
							{
								seasonIndex = i + 1;
								break;
							}
						}

						if (seasonIndex != 0)
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

				if (videoFileMediaItem.RatingId.HasValue)
				{
					var rating = Module.ObjectStore.Retrieve<Rating>(videoFileMediaItem.RatingId.Value);
					file.Tag.ISRC = rating.Name;
				}

				file.Tag.Description = videoFileMediaItem.Description;
				file.Tag.Title = videoFileMediaItem.Name;
				file.Tag.AmazonId = videoFileMediaItem.ImdbID;
				if (videoFileMediaItem.Year.HasValue)
				{
					file.Tag.Year = videoFileMediaItem.Year.Value;
				}
				file.Save();

				if (Module.ObjectStore == null)
				{
					throw new NullReferenceException("ObjectStore is null");
				}

				Module.ObjectStore.Update<MediaItem>(videoFileMediaItem.Id, new
				{
					MetadataDate = DateTime.UtcNow
				});
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
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
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
		[Authorize]
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
				Response.Headers.Add("Expires", DateTime.Now.AddDays(10).ToString("r"));
				return new ResultFileStream(new MemoryStream(metaDataImage.Data!), metaDataImage.MimeType);
			}
			return null;
		}

		[Api]
		[Authorize]
		public IEnumerable<UserMediaItem> GetMovieGrouping(MovieGroupingType movieGroupingType, int count, string options)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var factory = new MovieGroupingFactory();
			var movieGrouping = factory.GetMovieGrouping(movieGroupingType);
			if (movieGrouping != null)
			{
				return movieGrouping.GetMovies(GetUserMediaItems(), count, options);
			}
			throw new Exception("Unknown grouping");
		}

		[Api]
		[Authorize]
		public IEnumerable<UserMediaItemSearchResult> Search(string search, int count)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var videoFileMediaItems = GetUserMediaItems().Values
			   .Where(i => i.MediaItemType == MediaItemType.MovieFile ||
					i.MediaItemType == MediaItemType.SeriesFile)
			   .ToList();

			var serieses = Module.ObjectStore!.Retrieve<Series>()
				.ToList();

			var searchwords = search.ToUpper().Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
			var result = new List<UserMediaItemSearchResult>();

			foreach (var videoFileMediaItem in videoFileMediaItems)
			{
				var searchResult = new UserMediaItemSearchResult();
				CopyProperties(videoFileMediaItem, searchResult);

				foreach (var word in searchwords)
				{
					if (word.Length > 3)
					{
						//Check title
						//Title is worth 5 each
						if (searchResult.Name!.ToUpper().Contains(word))
						{
							searchResult.Weight += 5;
						}

						//check genre
						//Genre is worth 3
						if (searchResult.MetadataTags!.Where(t => t.MetadataTagType == MetadataTagType.Genre)
							.Any(g => g.Value!.ToUpper().Contains(word)))
						{
							searchResult.Weight += 3;
						}

						//check actors
						//Actor is worth 2
						if (searchResult.MetadataTags!.Where(t => t.MetadataTagType == MetadataTagType.Actor)
							.Any(g => g.Value!.ToUpper().Contains(word)))
						{
							searchResult.Weight += 2;
						}

						//Check description
						//Description is worth one
						if (!string.IsNullOrEmpty(searchResult.Description) && 
							searchResult.Description!.ToUpper().Contains(word))
						{
							searchResult.Weight += 1;
						}
					}
				}

				if (searchResult.Weight > 0)
				{
					if (searchResult.SeriesId.HasValue)
					{
						var series = serieses.FirstOrDefault(s => s.Id == searchResult.SeriesId.Value);
						if (series != null)
						{
							var season = series.Seasons!.FirstOrDefault(s => s.Id == searchResult.SeasonId!.Value);
							if (season != null)
							{
								searchResult.SeriesName = series.Name;
								searchResult.Season = season.Name;
							}
						}
					}
					result.Add(searchResult);
				}
			}

			return result.OrderByDescending(v => v.Weight)
				.Take(count)
				.ToList(); 
		}

		[Api]
		[Authorize(MediaServerPermissions.ModifySourcesPermissions)]
		public Stream? GetUserMediaItemImage(Guid uniqueKey)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var userMediaItem = GetUserMediaItems()[uniqueKey];
			var metaDataImage = Module.ObjectStore.Retrieve<MetadataImage>()
				.FirstOrDefault(m => m.MediaItemId == userMediaItem.MediaItemId);

			if (metaDataImage != null)
			{
				Response.Headers.Add("Expires", DateTime.Now.AddDays(10).ToString("r"));
				return new ResultFileStream(new MemoryStream(metaDataImage.Data!), metaDataImage.MimeType);
			}
			return null;
		}

		[Api]
		[Authorize()]
		public IEnumerable<UserMediaItem> GetSeasonUserMediaItems(long seriesId, long seasonId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			return GetUserMediaItems().Values
				.Where(i => i.SeriesId == seriesId
					&& i.SeasonId == seasonId)
				.OrderBy(a => a.Order)
				.ThenBy(a => a.Name)
				.ToList();
		}

		private static void CopyProperties(object source, object target, params string[] ignoreProperties)
		{
			var sourceType = source.GetType();

			foreach (var properyInfo in target.GetType().GetProperties()
				.Where(p => !ignoreProperties.Contains(p.Name)))
			{
				var sourcePropertyInfo = sourceType.GetProperty(properyInfo.Name);
				if (sourcePropertyInfo != null)
				{
					if (properyInfo.PropertyType == sourcePropertyInfo.PropertyType)
					{
						if (properyInfo.CanWrite &&
							sourcePropertyInfo.CanRead)
						{
							properyInfo.SetValue(target, sourcePropertyInfo.GetValue(source));
						}
					}
				}
			}
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

	public class UserMediaItem
	{
		public Guid UniqueKey { get; set; }
		internal long MediaItemId { get; set; }
		internal long FolderId { get; set; }
		public short? SeriesId { get; set; }
		public short? SeasonId { get; set; }
		public short? Width { get; set; }
		public short? Height { get; set; }
		public uint? Year { get; set; }
		public decimal? Duration { get; set; }
		public int Order { get; set; }
		public string? Description { get; set; }
		internal DateTimeOffset AddedDate { get; set; }
		public long? RatingId { get; set; }
		public string? Name { get; set; }
		public MediaType MediaType { get; set; }
		public MediaItemType MediaItemType { get; set; }
		public DateTimeOffset? MetadataDate { get; set; }
		public string? MimeType { get; set; }
		internal List<long>? TagIds { get; set; }
		public List<MetadataTag>? MetadataTags { get; set; }
	}

	public class UserMediaItemSearchResult : UserMediaItem
	{
		public int Weight { get; set; }
		public string? SeriesName { get; set; }
		public string? Season { get; set; }
		public int Episode { get; set; }
	}
}
