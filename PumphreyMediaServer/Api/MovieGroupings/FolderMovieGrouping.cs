using MediaServer;
using MediaServer.Entities;
using TagLib;

namespace PumphreyMediaServer.Api.MovieGroupings
{
	internal class FolderMovieGrouping : IMovieGrouping
	{
		public IEnumerable<VideoFileMediaItem> GetMovies(int count, string options)
		{
			var optionValues = System.Text.Json.JsonSerializer.Deserialize<Options>(options, new System.Text.Json.JsonSerializerOptions() { PropertyNameCaseInsensitive = true });
			var folderPaths = optionValues!.Path!.Split("/");

			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

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
				return Module.ObjectStore!.Retrieve<MediaItem, VideoFileMediaItem>()
					.Where(i => i.MediaItemType == MediaItemType.MovieFile)
					.ToList()
					.Where(i => i.FolderId == foundFolder.Id)
					.Cast<VideoFileMediaItem>()
					.OrderByDescending(a => a.AddedDate)
					.ThenBy(a => a.Name)
					.Take(count)
					.ToList();
			}
			else 
			{
				return new VideoFileMediaItem[0];
			}
		}

		public class Options
		{
			public string? Path { get; set; }
		}
	}
}
