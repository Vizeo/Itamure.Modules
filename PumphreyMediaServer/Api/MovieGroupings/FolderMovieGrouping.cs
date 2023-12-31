using MediaServer;
using MediaServer.Entities;
using TagLib;

namespace MediaServer.Api.MovieGroupings
{
	internal class FolderMovieGrouping : MovieGroupingBase
	{
		public override IEnumerable<UserMediaItem> GetMovies(Guid userUniqueId, Dictionary<Guid, UserMediaItem> userMediaItems, int count, string options)
		{
			var optionValues = System.Text.Json.JsonSerializer.Deserialize<Options>(options, new System.Text.Json.JsonSerializerOptions() { PropertyNameCaseInsensitive = true });
			var folderPaths = optionValues!.Path!.Split("/");
			
			var folders = Module.ObjectStore!.Retrieve<Folder>()
				.ToList();
			long parentId = -1;
			Folder? foundFolder = null;
			for(var i = 0; i < folderPaths.Length; i++)
			{
				var parentFolder = folders.FirstOrDefault(f => f.Name!.ToUpper() == folderPaths[i].ToUpper() && 
					f.ParentId == parentId);
				if(parentFolder != null)
				{
					if(i == folderPaths.Length - 1)
					{
						foundFolder = parentFolder;
					}
					else
					{
						parentId = parentFolder.Id;
					}
				}
			}

			if(foundFolder != null)
			{
				var list = userMediaItems.Values
					.Where(i => i.MediaItemType == MediaItemType.MovieFile &&
						i.FolderId == foundFolder.Id)
					.ToList();

				return base.RandomizeList(list)
					.Take(count);
			}
			else 
			{
				return new UserMediaItem[0];
			}
		}

		public class Options
		{
			public string? Path { get; set; }
		}
	}
}
