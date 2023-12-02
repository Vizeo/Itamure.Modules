using MediaServer;
using MediaServer.Entities;

namespace PumphreyMediaServer.Api.MovieGroupings
{
    internal class NewestMovieGrouping : IMovieGrouping
    {
        public IEnumerable<VideoFileMediaItem> GetMovies(int count, string options)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            return Module.ObjectStore!.Retrieve<MediaItem, VideoFileMediaItem>()
                .Where(i => i.MediaItemType == MediaItemType.MovieFile)
                .ToList()
                .Cast<VideoFileMediaItem>()
                .OrderByDescending(a => a.AddedDate)
                .ThenBy(a => a.Name)
                .Take(count)
                .ToList();
        }
    }
}
