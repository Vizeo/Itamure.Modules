using MediaServer;
using MediaServer.Entities;

namespace MediaServer.Api.MovieGroupings
{
    internal class ContinueWatchingMovieGrouping : MovieGroupingBase
    {
        public override IEnumerable<UserMediaItem> GetMovies(Guid userUniqueId, Dictionary<Guid, UserMediaItem> userMediaItems, int count, string options)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            var recent = Module.ObjectStore.Retrieve<UserMediaReference>()
                .Where(r => r.LastViewed != null &&
                    r.LastPosition > 0)
                .ToList()
                .OrderByDescending(r => r.LastViewed);

            var result = new List<UserMediaItem>();

            foreach(var userRef in recent) 
            { 
                if(userMediaItems.TryGetValue(userRef.UniqueLink, out var userMediaItem))
                {
                    if(userMediaItem.MediaItemType == MediaItemType.MovieFile)
                    {
                        result.Add(userMediaItem);
                    }
                }

                if(result.Count == count)
                {
                    break;
                }
            }

            return result;
        }
    }
}
