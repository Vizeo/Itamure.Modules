using MediaServer;
using MediaServer.Entities;
using TagLib;

namespace MediaServer.Api.MovieGroupings
{
	internal class RangeMovieGrouping : MovieGroupingBase
	{
		public override IEnumerable<UserMediaItem> GetMovies(Dictionary<Guid, UserMediaItem> userMediaItems, int count, string options)
		{
			var optionValues = System.Text.Json.JsonSerializer.Deserialize<Options>(options, new System.Text.Json.JsonSerializerOptions() { PropertyNameCaseInsensitive = true });

			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			var list = userMediaItems.Values
				.Where(i => i.MediaItemType == MediaItemType.MovieFile &&
					i.Year.HasValue && 
					i.Year.Value >= optionValues!.Start && 
					i.Year.Value <= optionValues!.End)
				.ToList();

			return base.RandomizeList(list)
				.Take(count);
		}

		public class Options
		{
			public int Start { get; set; }
			public int End { get; set; }
		}
	}
}
