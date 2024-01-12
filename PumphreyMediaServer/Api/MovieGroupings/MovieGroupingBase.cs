using MediaServer;
using MediaServer.Entities;
using System;

namespace MediaServer.Api.MovieGroupings
{
    internal abstract class MovieGroupingBase
    {
        public abstract IEnumerable<UserMediaItem> GetMovies(Guid userUniqueId, Dictionary<Guid, UserMediaItem> userMediaItems, int count, string? options, bool all);

        protected List<UserMediaItem> RandomizeList(List<UserMediaItem> userMediaItems)
        {
			var rnd = new Random();
			return userMediaItems
			 .Select(x => (x, rnd.Next()))
			 .OrderBy(tuple => tuple.Item2)
			 .Select(tuple => tuple.Item1)
			 .ToList();
		}
    }
}
