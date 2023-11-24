namespace PumphreyMediaServer.Api.MovieGroupings
{
    internal class MovieGroupingFactory
    {
        public IMovieGrouping GetMovieGrouping(MovieGroupingType movieGroupingType)
        {
            switch(movieGroupingType)
            {
                case MovieGroupingType.Newest:
                    return new NewestMovieGrouping();
            }

            return null;
        }
    }
}
