namespace PumphreyMediaServer.Api.MovieGroupings
{
    internal class MovieGroupingFactory
    {
        public IMovieGrouping? GetMovieGrouping(MovieGroupingType movieGroupingType)
        {
            switch(movieGroupingType)
            {
                case MovieGroupingType.Newest:
                    return new NewestMovieGrouping();
                case MovieGroupingType.Genres:
					return new GenreMovieGrouping();
                case MovieGroupingType.Folder:
                    return new FolderMovieGrouping();
                case MovieGroupingType.Range:
                    return new RangeMovieGrouping();
                case MovieGroupingType.Rating:
                    return new RatingsMovieGrouping();
			}

            return null;
        }
    }
}
