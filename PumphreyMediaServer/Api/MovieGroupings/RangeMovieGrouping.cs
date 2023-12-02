using MediaServer;
using MediaServer.Entities;
using TagLib;

namespace PumphreyMediaServer.Api.MovieGroupings
{
	internal class RangeMovieGrouping : IMovieGrouping
	{
		public IEnumerable<VideoFileMediaItem> GetMovies(int count, string options)
		{
			var optionValues = System.Text.Json.JsonSerializer.Deserialize<Options>(options, new System.Text.Json.JsonSerializerOptions() { PropertyNameCaseInsensitive = true });

			if (Module.ObjectStore == null)
			{
				throw new NullReferenceException("ObjectStore is null");
			}

			return Module.ObjectStore!.Retrieve<MediaItem, VideoFileMediaItem>()
				.Where(i => i.MediaItemType == MediaItemType.MovieFile)
				.ToList()
				.Where(i => i.Year.HasValue && i.Year.Value >= optionValues!.Start && i.Year.Value <= optionValues!.End)
				.Cast<VideoFileMediaItem>()
				.OrderByDescending(a => a.AddedDate)
				.ThenBy(a => a.Name)
				.Take(count)
				.ToList();
		}

		public class Options
		{
			public int Start { get; set; }
			public int End { get; set; }
		}
	}
}
