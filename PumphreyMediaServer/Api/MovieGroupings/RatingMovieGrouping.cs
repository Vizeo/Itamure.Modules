using MediaServer;
using MediaServer.Entities;

namespace MediaServer.Api.MovieGroupings
{
    internal class RatingsMovieGrouping : MovieGroupingBase
    {
        public override IEnumerable<UserMediaItem> GetMovies(Guid userUniqueId, Dictionary<Guid, UserMediaItem> userMediaItems, int count, string? options, bool all)
        {
			var optionValues = System.Text.Json.JsonSerializer.Deserialize<Options>(options, new System.Text.Json.JsonSerializerOptions() { PropertyNameCaseInsensitive = true });
			var ratingIds = optionValues!.RatingIds!;

			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var list = userMediaItems.Values
				.Where(i => i.MediaItemType == MediaItemType.MovieFile &&
					i.RatingId.HasValue &&
					ratingIds.Contains(i.RatingId!.Value))
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
			public List<long>? RatingIds { get; set; } 
		}
    }
}
