using MediaServer;
using MediaServer.Entities;

namespace PumphreyMediaServer.Api.MovieGroupings
{
    internal class GenreMovieGrouping : IMovieGrouping
    {
        public IEnumerable<VideoFileMediaItem> GetMovies(int count, string options)
        {
			var optionValues = System.Text.Json.JsonSerializer.Deserialize<Options>(options, new System.Text.Json.JsonSerializerOptions() { PropertyNameCaseInsensitive = true });
			var genres = optionValues!.Genres!.Select(g => g.ToUpper().Trim());

			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			return Module.ObjectStore!.Retrieve<MediaItem, VideoFileMediaItem>()
				.Where(i => i.MediaItemType == MediaItemType.MovieFile)
				.ToList()
				.Where(i => i.MetadataTags!.Any(t => t.MetadataTagType == MetadataTagType.Genre &&
					genres.Contains(t.Value!.ToUpper().Trim())))
				.Cast<VideoFileMediaItem>()
				.OrderByDescending(a => a.AddedDate)
				.ThenBy(a => a.Name)
				.Take(count)
				.ToList();
		}

		public class Options {
			public List<string>? Genres { get; set; } 
		}
    }
}
