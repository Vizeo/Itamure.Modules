using MediaServer;
using MediaServer.Entities;

namespace PumphreyMediaServer.Api.MovieGroupings
{
    internal class RatingsMovieGrouping : IMovieGrouping
    {
        public IEnumerable<VideoFileMediaItem> GetMovies(int count, string options)
        {
			var optionValues = System.Text.Json.JsonSerializer.Deserialize<Options>(options, new System.Text.Json.JsonSerializerOptions() { PropertyNameCaseInsensitive = true });
			var ratings = optionValues!.Ratings!.Select(g => g.ToUpper().Trim());

			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var ratingLists = Module.ObjectStore.Retrieve<Rating>()
				.ToList()
				.Where(r => ratings.Contains(r.Name!.ToUpper().Trim()))
				.Select(r => r.Id)
				.ToList();

			return Module.ObjectStore!.Retrieve<MediaItem, VideoFileMediaItem>()
				.Where(i => i.MediaItemType == MediaItemType.MovieFile)
				.ToList()
				.Where(i => i.RatingId.HasValue &&
					ratingLists.Contains(i.RatingId!.Value))
				.Cast<VideoFileMediaItem>()
				.OrderByDescending(a => a.AddedDate)
				.ThenBy(a => a.Name)
				.Take(count)
				.ToList();
		}

		public class Options {
			public List<string>? Ratings { get; set; } 
		}
    }
}
