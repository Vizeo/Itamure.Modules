using MediaServer;
using MediaServer.Entities;

namespace MediaServer.Api.MovieGroupings
{
    internal class RatingsMovieGrouping : MovieGroupingBase
    {
        public override IEnumerable<UserMediaItem> GetMovies(Guid userUniqueId, Dictionary<Guid, UserMediaItem> userMediaItems, int count, string options)
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

			var list = userMediaItems.Values
				.Where(i => i.MediaItemType == MediaItemType.MovieFile &&
					i.RatingId.HasValue &&
					ratingLists.Contains(i.RatingId!.Value))
				.ToList();

			return base.RandomizeList(list)
				.Take(count);
		}

		public class Options {
			public List<string>? Ratings { get; set; } 
		}
    }
}
