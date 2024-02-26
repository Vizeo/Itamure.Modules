using MediaServer;
using MediaServer.Entities;

namespace MediaServer.Api.MovieGroupings
{
    internal class GenreMovieGrouping : MovieGroupingBase
    {
        public override IEnumerable<UserMediaItem> GetMovies(Guid userUniqueId, Dictionary<Guid, UserMediaItem> userMediaItems, int count, string? options, bool all)
        {
			var optionValues = System.Text.Json.JsonSerializer.Deserialize<Options>(options, new System.Text.Json.JsonSerializerOptions() { PropertyNameCaseInsensitive = true });
			var genres = optionValues!.Genres!.Select(g => g.ToUpper().Trim());

			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var list = userMediaItems.Values
				.Where(i => i.MediaItemType == MediaItemType.MovieFile &&
					i.MetadataTags!.Any(t => t.MetadataTagType == MetadataTagType.Genre &&
					genres.Contains(t.Value!.ToUpper().Trim())))
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

		public class Options {
			public List<string>? Genres { get; set; } 
		}
    }
}
