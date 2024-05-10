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
using MediaServer.SubServices;
using MediaServer.Api.RemoteControllers;
using IntegratedWebServer.Core;
using System.Collections.Concurrent;
using TagLib.Flac;
using Microsoft.AspNetCore.Connections.Features;
using System.Runtime.CompilerServices;
using System.Diagnostics.Metrics;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Net;

namespace MediaServer.Api
{
	[RequestProcessorMap($"/{Module.WEB_ROUTE_BASE}/Api/mediaServerService")]
	public class MediaServerService : RestServiceBase
	{
		internal static DateTime LastItemChange = DateTime.Now;
		private const string LAST_ITEM_CHANGE = "LastItemChange";
		private static ConcurrentDictionary<long, DateTime> _lastPositionStore = new ConcurrentDictionary<long, DateTime>();
		private static object _locket = new object();
		private static ConcurrentDictionary<long, ActiveItem> _activeItems = new ConcurrentDictionary<long, ActiveItem>();
		private static List<MaskData> _internalSubnetMasks = new List<MaskData>();

		static MediaServerService()
		{
			foreach (NetworkInterface adapter in NetworkInterface.GetAllNetworkInterfaces())
			{
				foreach (UnicastIPAddressInformation unicastIPAddressInformation in adapter.GetIPProperties().UnicastAddresses)
				{
					if (unicastIPAddressInformation.Address.AddressFamily == AddressFamily.InterNetwork)
					{
						_internalSubnetMasks.Add(new MaskData()
						{
							MaskAddress = unicastIPAddressInformation.IPv4Mask,
							IPAddress = unicastIPAddressInformation.Address,
							Length = unicastIPAddressInformation.PrefixLength
						});
					}
				}
			}
		}

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
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public void UpdateMediaItemAccess(long mediaItemId, bool restrict, IEnumerable<Guid> accessUserIds)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var mediaItem = Module.ObjectStore.Retrieve<MediaItem>(mediaItemId);
			mediaItem.Restricted = restrict;
			mediaItem.UserAccess = accessUserIds.ToList();

			Module.ObjectStore.Update<MediaItem>(mediaItemId, new
			{
				Restricted = restrict,
				UserAccess = accessUserIds.ToList()
			});
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public IEnumerable<UserAccess> GetMediaItemAccess(long mediaItemId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var mediaItem = Module.ObjectStore.Retrieve<MediaItem>(mediaItemId);

			var users = Module.CurrentModule!.GetUsers();
			var result = new List<UserAccess>();
			foreach (var user in users)
			{
				var userAccess = new UserAccess()
				{
					UserId = user.Id,
					UserName = user.Name,
					Allowed = mediaItem.UserAccess != null && mediaItem.UserAccess.Contains(user.Id)
				};
				result.Add(userAccess);
			}

			return result;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public MediaSource AddMediaSource(MediaSource mediaSource)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			mediaSource.CreatedDate = DateTimeOffset.UtcNow;
			Module.ObjectStore.Store<MediaSource>(mediaSource);
			Module.CurrentModule?.RunSync();
			LastItemChange = DateTime.Now;
			return mediaSource; //Return the media source with the id
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public IEnumerable<StringValue> GetGenres()
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var videoFileMediaItems = GetUserMediaItems().Values
				.Where(i => i.MediaItemType == MediaItemType.MovieFile)
				.ToList();

			var hashset = new HashSet<string>();

			foreach (var videoFile in videoFileMediaItems)
			{
				foreach (var genre in videoFile.MetadataTags!.Where(t => t.MetadataTagType == MetadataTagType.Genre))
				{
					hashset.Add(genre.Value!);
				}
			}

			return hashset.Select(v => new StringValue() { Value = v });
		}

		[Api]
		[Authorize]
		public Access GetAccess()
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			return new Access()
			{
				SettingsPermissions = Module.CurrentModule!.UserHasAccess(Session.UniqueId, MediaServerPermissions.SettingsPermissions),
			};
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public bool ValidateDirectory(string path)
		{
			return System.IO.Directory.Exists(path);
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public void RemoveSource(MediaSource mediaSource)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			Module.ObjectStore.Remove<MediaSource>(mediaSource);
			Module.CurrentModule?.RunSync();
			LastItemChange = DateTime.Now;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public void RemoveMediaFileItem(long mediaItemId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			Module.ObjectStore.Remove<MediaItem>(mediaItemId);
			LastItemChange = DateTime.Now;
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
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
			return result;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public void DeleteRating(long ratingId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			Module.ObjectStore.Remove<Rating>(ratingId);
			LastItemChange = DateTime.Now;
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
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
			return result;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public void DeleteTag(long tagId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			Module.ObjectStore.Remove<Tag>(tagId);
			LastItemChange = DateTime.Now;
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
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public void UpdateVideoGroup(VideoGroup videoGroup)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			Module.ObjectStore.Store(videoGroup);
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public void RemoveMediaFileType(long mediaFileTypeId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			Module.ObjectStore.Remove<MediaFileType>(mediaFileTypeId);
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public IEnumerable<VideoFileMediaItem> GetVideoMediaItems(MediaItemType mediaItemType, long folderId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var result = Module.ObjectStore!.Retrieve<MediaItem>()
				.Where(i => i.MediaItemType == mediaItemType &&
					i.FolderId == folderId &&
					!i.UnavailableDate.HasValue)
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

			if (result == null ||
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
							if (!mediaItem.UnavailableDate.HasValue &&
								(!mediaItem.Restricted || (mediaItem.UserAccess != null &&
									mediaItem.UserAccess.Contains(userUniqueId))))
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
								userMediaItem.UserMediaReferenceId = userMediaReference.Id;
								userMediaItem.Position = userMediaReference.LastPosition;
								userMediaItem.LastViewed = userMediaReference.LastViewed;
								userMediaItem.AddedDate = mediaItem.AddedDate;
								userMediaItem.FolderId = mediaItem.FolderId;

								if (mediaItem is FileMediaItem)
								{
									var fileMediaItem = (FileMediaItem)mediaItem;
									var extension = Path.GetExtension(fileMediaItem.FilePath)!.ToLower();
									userMediaItem.MimeType = mediaFileTypes.FirstOrDefault(t => t.FileExtension! == extension && t.MediaType == fileMediaItem.MediaType)?.ContentType;
								}

								result.Add(userMediaItem.UniqueKey, userMediaItem);
							}
						}

						Session[USER_MEDIA_ITEMS] = result;
						Session[LAST_ITEM_CHANGE] = LastItemChange;
					}
				}
			}

			//Update
			foreach (var pair in result)
			{
				if (_activeItems.TryGetValue(pair.Value.UserMediaReferenceId, out var activeItem))
				{
					pair.Value.Position = activeItem.UserMediaReference!.LastPosition;
					pair.Value.LastViewed = activeItem.UserMediaReference!.LastViewed;
				}
			}

			//Do a cleanup of active items
			foreach (var activeItem in _activeItems.ToArray())
			{
				if (activeItem.Value.LastModified < DateTime.Now.AddMinutes(-30))
				{
					_activeItems.TryRemove(activeItem.Key, out _);
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
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
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
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
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
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
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
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
			return result;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public IEnumerable<VideoFileMediaItem> GetSeasonMediaItems(long seriesId, long seasonId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			return Module.ObjectStore!.Retrieve<MediaItem, VideoFileMediaItem>()
				.Where(i => i.SeriesId == seriesId &&
					i.SeasonId == seasonId &&
					!i.UnavailableDate.HasValue)
				.ToList()
				.Cast<VideoFileMediaItem>()
				.OrderBy(a => a.Order)
				.ThenBy(a => a.Name)
				.ThenBy(a => a.FilePath)
				.ToList();
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
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
			LastItemChange = DateTime.Now;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public void SetVideoFileMediaItemImage(long mediaItemId, string mimeType, byte[] data)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var mediaItem = (VideoFileMediaItem)Module.ObjectStore!.Retrieve<MediaItem>(mediaItemId);

			//Store in database
			var start = DateTime.Now;
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
				Module.CurrentModule!.WriteToConsole($"Database insert image {DateTime.Now.Subtract(start).Seconds}s");
			}
			else
			{
				Module.ObjectStore.Update<MetadataImage>(metaDataImage.Id, new
				{
					Data = data,
					MimeType = mimeType
				});
				Module.CurrentModule!.WriteToConsole($"Database update image {DateTime.Now.Subtract(start).Seconds}s");
			}

			Module.ObjectStore.Update<MediaItem>(mediaItem.Id, new
			{
				MetadataDate = DateTimeOffset.UtcNow
			});

			start = DateTime.Now;
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
				Module.CurrentModule!.WriteToConsole($"File metadata update {DateTime.Now.Subtract(start).Seconds}s");
			}
			catch (Exception e)
			{
				//Do nothing
				Module.CurrentModule!.WriteToConsole($"File metadata failed {DateTime.Now.Subtract(start).Seconds}s. {e.Message}");
			}
			LastItemChange = DateTime.Now;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
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
			LastItemChange = DateTime.Now;
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
			LastItemChange = DateTime.Now;
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
					MetadataDate = DateTimeOffset.UtcNow
				});
			}
			catch (Exception ex)
			{
				Module.ObjectStore.Update<MediaItem>(videoFileMediaItem.Id, new
				{
					Error = ex.Message
				});
			}
			LastItemChange = DateTime.Now;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
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
			LastItemChange = DateTime.Now;
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
		public UserMediaItem? GetSeriesMostRecent(long seriesId)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var userMediaItem = GetUserMediaItems().Values
				.Where(u => u.SeriesId == seriesId &&
					u.LastViewed.HasValue &&
					u.Position > 0)
				.OrderByDescending(u => u.LastViewed)
				.FirstOrDefault();

			return userMediaItem;
		}

		[Api]
		//Don't require auth
		public UserMediaItem? GetSeriesNextRecent(Guid uniqueKey)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			UserMediaItem? result = null;
			var finished = GetUserMediaItems().Values
				.FirstOrDefault(u => u.UniqueKey == uniqueKey);

			if (finished != null)
			{
				result = GetUserMediaItems().Values
					.Where(u => u.SeriesId == finished.SeriesId &&
						u.SeasonId == finished.SeasonId &&
						u.Order > finished.Order)
					.OrderBy(u => u.Order)
					.FirstOrDefault();

				if (result == null)
				{
					//Look at next season
					var series = Module.ObjectStore!.Retrieve<Series>(finished.SeriesId!.Value);
					if (series != null)
					{
						var seasonIndex = series.Seasons!.FindIndex(s => s.Id == finished.SeasonId);
						if (seasonIndex != -1 && series.Seasons.Count - 1 > seasonIndex)
						{
							var nextSeason = series.Seasons[seasonIndex + 1];
							result = GetUserMediaItems().Values
								.Where(u => u.SeriesId == finished.SeriesId &&
									u.SeasonId == nextSeason.Id)
								.OrderBy(u => u.Order)
								.FirstOrDefault();
						}
					}
				}
			}

			return result;
		}

		[Api]
		[Authorize]
		public IEnumerable<UserMediaItem> GetVideoGroupMedia(long videoGroupId, bool all)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var videoGroup = Module.ObjectStore.Retrieve<VideoGroup>(videoGroupId);

			if (videoGroup != null)
			{
				var factory = new MovieGroupingFactory();
				var movieGrouping = factory.GetVideoGroupMedia(videoGroup.MovieGroupingType);
				if (movieGrouping != null)
				{
					var userUniqueId = Request.UserUniqueId!.Value;
					return movieGrouping.GetMovies(userUniqueId, GetUserMediaItems(), videoGroup.Count, videoGroup.Options, all);
				}
			}

			throw new Exception("Unknown grouping");
		}

		[Api]
		[Authorize]
		public IEnumerable<VideoGroup> GetVideoGroups()
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			return Module.ObjectStore!.Retrieve<VideoGroup>()
				.ToList();
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public void UpdateVideoGroups(IEnumerable<VideoGroup> videoGroups)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			Module.ObjectStore.ProcessTransactionGroup(t =>
			{
				foreach (var videoGroup in videoGroups)
				{
					if (videoGroup.Id != 0) //Ignore any new ones
					{
						t.Store(videoGroup);
					}
				}
			});
			LastItemChange = DateTime.Now;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public IEnumerable<FolderTree> GetVideoFolders()
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var folders = Module.ObjectStore.Retrieve<Folder>()
				.ToList()
				.OrderBy(f => f.ParentId)
				.ThenBy(s => s.Name);

			var roots = folders.Where(f => f.ParentId == -1);

			var result = new List<FolderTree>();
			foreach (var folder in roots)
			{
				result.Add(RecursiveGetSubFolders(folder, folders));
			}

			return result;
		}

		private FolderTree RecursiveGetSubFolders(Folder folder, IEnumerable<Folder> folders)
		{
			var result = new FolderTree();

			var subFolders = folders.Where(f => f.ParentId == folder.Id);
			result.SubFolders = new List<FolderTree>();
			result.Name = folder.Name;
			result.Id = folder.Id;

			foreach (var subFolder in subFolders)
			{
				result.SubFolders.Add(RecursiveGetSubFolders(subFolder, folders));
			}

			result.SubFolders = result.SubFolders
				.OrderBy(s => s.Name)
				.ToList();
			return result;
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public VideoGroup AddVideoGroup(VideoGroup videoGroup)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			Module.ObjectStore.Store(videoGroup);
			return videoGroup; //This returns the object with the id
		}

		[Api]
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public void DeleteVideoGroup(VideoGroup videoGroup)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			Module.ObjectStore.Remove(videoGroup);
		}

		[Api]
		[Authorize]
		public IEnumerable<UserMediaItemSearchResult> Search(string search, int count)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var test = Module.ObjectStore.Retrieve<MediaItem>()
			.FirstOrDefault(i => i.Name == "Iron Man");

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
		[Authorize(MediaServerPermissions.SettingsPermissions)]
		public UserMediaItem? GetUserMediaItem(Guid uniqueKey)
		{
			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			return GetUserMediaItems()[uniqueKey];
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

		[Api]
		[Authorize()]
		public IEnumerable<MediaReceiver> GetMediaReceivers()
		{
			var result = new List<MediaReceiver>();
			var receiverAdmin = this.HasAccess(MediaServerPermissions.ReceiverAdmin);

			if (UpnpSubService.SsdpServer != null)
			{
				var localNetwork = false;

				if (!receiverAdmin)
				{
					//Add upnp if request is from same network 
					foreach (var subNet in _internalSubnetMasks)
					{
						var network1 = GetNetworkAddress(subNet.IPAddress!, subNet.MaskAddress!);
						var network2 = GetNetworkAddress(Request.RemoteEndPoint.Address, subNet.MaskAddress!);

						if (network1 != null &&
							network1.Equals(network2))
						{
							localNetwork = true;
							break;
						}
					}
				}

				if (localNetwork || receiverAdmin)
				{
					foreach (var device in UpnpSubService.SsdpServer!.Devices)
					{
						if (device.UniformResourceName == UpnpLib.KnownDevices.MediaRenderer1)
						{
							device.Load().Wait();
							var indexOfIdEnd = device.UniqueServiceName.IndexOf("::");

							result.Add(new MediaReceiver()
							{
								Id = device.UniqueServiceName.Substring(5, indexOfIdEnd - 5),
								Name = device.FriendlyName,
								ReceiverType = "Upnp"
							});
						}
					}
				}
			}

			//Only show screens on the same user?
			foreach (var screen in WebScreenController.Screens)
			{
				if (receiverAdmin || screen.User.Id == Request.UserUniqueId!.Value)
				{
					result.Add(new MediaReceiver()
					{
						Id = screen.Id.ToString(),
						Name = screen.Name + " - " + screen.User.Name,
						ReceiverType = "Web"
					});
				}
			}

			return result;
		}

		[Api]
		[Authorize()]
		public MediaCastResult? CastToReceiver(string recieverType, string receiverId, Guid userMediaId, double position)
		{
			MediaCastResult? result = null;

			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var userMediaItem = Module.ObjectStore.Retrieve<UserMediaReference>()
				.FirstOrDefault(u => u.UniqueLink == userMediaId);
			var user = Module.CurrentModule!.GetUsers().FirstOrDefault(c => c.Id == userMediaItem.UserUniqueId);
			var videoMediaItem = (VideoFileMediaItem)Module.ObjectStore.Retrieve<MediaItem>(userMediaItem.MediaItemId);
			if (videoMediaItem != null)
			{
				if (System.IO.File.Exists(videoMediaItem.FilePath!))
				{
					var file = new FileInfo(videoMediaItem.FilePath!);
					var extension = Path.GetExtension(videoMediaItem.FilePath)!.ToLower();
					var remotePlayer = RemoteControllerFactory.GetRemoteController(recieverType);
					var mediaFileTypes = Module.ObjectStore.Retrieve<MediaFileType>()
						.ToList();
					var mediaInfo = new CastMediaInfo()
					{
						UserName = user?.Name,
						Title = videoMediaItem.Name,
						Duration = videoMediaItem.Duration,
						Width = videoMediaItem.Width,
						Height = videoMediaItem.Height,
						StartPosition = position,
						UniqueLink = userMediaId,
						UserMediaReferenceId = userMediaItem.Id,
						MimeType = mediaFileTypes.FirstOrDefault(t => t.FileExtension! == extension && t.MediaType == videoMediaItem.MediaType)?.ContentType
					};
					result = remotePlayer.Cast(Request, file, receiverId, mediaInfo);
				}
				else
				{
					result = new MediaCastResult() { Success = false, Message = "File not found" };
				}
			}
			else
			{
				result = new MediaCastResult() { Success = false, Message = "Video not found" };
			}

			return result;
		}

		[Api]
		[Authorize()]
		public void PauseMediaReceiver(string receiverId, string recieverType)
		{
			var remotePlayer = RemoteControllerFactory.GetRemoteController(recieverType);
			remotePlayer.Pause(receiverId);
		}

		[Api]
		[Authorize()]
		public void PlayMediaReceiver(string receiverId, string recieverType)
		{
			var remotePlayer = RemoteControllerFactory.GetRemoteController(recieverType);
			remotePlayer.Play(receiverId);
		}

		[Api]
		[Authorize()]
		public void StopMediaReceiver(string receiverId, string recieverType)
		{
			var remotePlayer = RemoteControllerFactory.GetRemoteController(recieverType);
			remotePlayer.Stop(receiverId);
		}

		[Api]
		[Authorize()]
		public void SeekMediaReceiver(string receiverId, string recieverType, double second)
		{
			var remotePlayer = RemoteControllerFactory.GetRemoteController(recieverType);
			remotePlayer.Seek(receiverId, second);
		}

		[Authorize()]
		public void WebScreenRemote(WebSocket webSocket, string screen)
		{
			//Validate that a screen was requested
			var webSCreenController = new WebScreenController();
			webSCreenController.AddWebSocket(screen, webSocket);
		}

		[Api]
		[Authorize()]
		public void UpdateMediaPosition(Guid userMediaId, double positionInSeconds)
		{
			if (GetUserMediaItems().TryGetValue(userMediaId, out var userMediaItem))
			{
				var position = Convert.ToInt64(positionInSeconds);
				userMediaItem.Position = position;
				UpdatePosition(userMediaItem.UserMediaReferenceId, position);
			}
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

		internal static void UpdatePosition(long userMediaReferenceId, long positionInSeconds)
		{
			//Limit updates to 1 minute. This will require a cache
			if (positionInSeconds > 0 &&
				(!_lastPositionStore.TryGetValue(userMediaReferenceId, out var lastStore) ||
				lastStore < DateTime.Now.AddMinutes(-1)))
			{
				if (lastStore == default)
				{
					_lastPositionStore.TryAdd(userMediaReferenceId, DateTime.Now.AddMinutes(1));
				}
				else
				{
					_lastPositionStore.TryUpdate(userMediaReferenceId, DateTime.Now.AddMinutes(1), lastStore);
				}

				if (Module.ObjectStore == null)
				{
					throw new NullReferenceException("ObjectStore is null");
				}

				if (!_activeItems.TryGetValue(userMediaReferenceId, out var activeUserMediaItem))
				{
					activeUserMediaItem = new ActiveItem();
					activeUserMediaItem.UserMediaReference = Module.ObjectStore.Retrieve<UserMediaReference>(userMediaReferenceId);

					//Add the active media item to get the duratio                    
				}

				activeUserMediaItem.UserMediaReference!.LastPosition = positionInSeconds;
				activeUserMediaItem.UserMediaReference!.LastViewed = DateTime.UtcNow;
				activeUserMediaItem.LastModified = DateTime.Now;
				Module.ObjectStore.Store(activeUserMediaItem.UserMediaReference);
			}
		}

		public static IPAddress? GetNetworkAddress(IPAddress address, IPAddress subnetMask)
		{
			var ipAdressBytes = address.GetAddressBytes();
			var subnetMaskBytes = subnetMask.GetAddressBytes();

			if (ipAdressBytes.Length != subnetMaskBytes.Length)
			{
				return null;
			}

			byte[] broadcastAddress = new byte[ipAdressBytes.Length];
			for (int i = 0; i < broadcastAddress.Length; i++)
			{
				broadcastAddress[i] = (byte)(ipAdressBytes[i] & (subnetMaskBytes[i]));
			}
			return new IPAddress(broadcastAddress);
		}

		private class ActiveItem
		{
			public UserMediaReference? UserMediaReference { get; set; }
			public DateTime LastModified { get; set; } = DateTime.Now;
		}

		private class MaskData
		{
			public IPAddress? MaskAddress { get; set; }
			public IPAddress? IPAddress { get; set; }
			public int Length { get; set; }
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
		internal long UserMediaReferenceId { get; set; }
		internal long MediaItemId { get; set; }
		internal long? FolderId { get; set; }
		public short? SeriesId { get; set; }
		public short? SeasonId { get; set; }
		public short? Width { get; set; }
		public short? Height { get; set; }
		public uint? Year { get; set; }
		public decimal? Duration { get; set; }
		public int Order { get; set; }
		public string? Description { get; set; }
		internal DateTimeOffset AddedDate { get; set; }
		public DateTimeOffset? LastViewed { get; set; }
		public long Position { get; set; }
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

	public class MediaReceiver
	{
		public string? Id { get; set; }
		public string? Name { get; set; }
		public string? ReceiverType { get; set; }
	}

	public class MediaCastResult
	{
		public bool Success { get; set; }
		public string? Message { get; set; }
	}

	public class Access
	{
		public bool SettingsPermissions { get; set; }
	}

	public class FolderTree : Folder
	{
		public List<FolderTree>? SubFolders { get; set; }
	}

	public class StringValue
	{
		public string? Value { get; set; }
	}

	public class UserAccess
	{
		public Guid UserId { get; set; }
		public string? UserName { get; set; }
		public bool Allowed { get; set; }
	}
}
