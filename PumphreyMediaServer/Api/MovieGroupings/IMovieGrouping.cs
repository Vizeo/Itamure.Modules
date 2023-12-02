using MediaServer;
using MediaServer.Entities;

namespace PumphreyMediaServer.Api.MovieGroupings
{
    internal interface IMovieGrouping
    {
        IEnumerable<VideoFileMediaItem> GetMovies(int count, string options);
    }
}
