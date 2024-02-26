using MediaServer;
using MediaServer.Entities;
using TagLib;

namespace MediaServer.Api.MovieGroupings
{
	internal class FolderMovieGrouping : MovieGroupingBase
	{
		public override IEnumerable<UserMediaItem> GetMovies(Guid userUniqueId, Dictionary<Guid, UserMediaItem> userMediaItems, int count, string? options, bool all)
		{
			var optionValues = System.Text.Json.JsonSerializer.Deserialize<Options>(options, new System.Text.Json.JsonSerializerOptions() { PropertyNameCaseInsensitive = true });
			var folderId = optionValues!.FolderId!;
			
			var folder = Module.ObjectStore!.Retrieve<Folder>(folderId);
			if(folder != null)
			{
				var list = userMediaItems.Values
					.Where(i => i.MediaItemType == MediaItemType.MovieFile &&
						i.FolderId == folder.Id)
					.ToList();

				if (all)
				{
					return list.OrderBy(i => i.Name);
				}
				else
				{
					return base.RandomizeList(list)
						.Take(count);
				}
			}
			else 
			{
				return new UserMediaItem[0];
			}
		}

		public class Options
		{
			public long FolderId { get; set; }
		}
	}
}
