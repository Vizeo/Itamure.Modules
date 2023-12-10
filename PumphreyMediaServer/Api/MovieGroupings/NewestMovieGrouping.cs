﻿using MediaServer;
using MediaServer.Entities;

namespace MediaServer.Api.MovieGroupings
{
    internal class NewestMovieGrouping : MovieGroupingBase
    {
        public override IEnumerable<UserMediaItem> GetMovies(Dictionary<Guid, UserMediaItem> userMediaItems, int count, string options)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }

            return userMediaItems.Values
				.Where(i => i.MediaItemType == MediaItemType.MovieFile)
                .OrderByDescending(a => a.AddedDate)
                .ThenBy(a => a.Name)
                .Take(count)
                .ToList();
        }
    }
}
