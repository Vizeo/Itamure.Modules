using IntegratedWebServer.Core.RequestProcessors;
using Itamure.Core;
using Itamure.Core.Web;
using Itamure.Core.Web.Security;
using MediaServer.Entities;
using MediaServer.Omdb;
using Microsoft.AspNetCore.DataProtection.KeyManagement;

namespace MediaServer.Api
{
    [RequestProcessorMap($"/{Module.WEB_ROUTE_BASE}/Api/metadataService")]
    public class MetadataService : RestServiceBase
    {
        private OmdbManager? _omdbManager;

        public MetadataService()
        {
            _omdbManager = OmdbManager.Current;
        }

        [Api]
        [Authorize]
        public bool ApiKeySet()
        {
            return _omdbManager != null;
        }

        [Api]
        [Authorize]
        public async Task<SearchResult?> MovieSearch(string name)
        {
            if(_omdbManager == null)
            {
                throw new Exception("Api key is not set");
            }

            return await _omdbManager.MovieSearchAsync(name);
        }

        [Api]
        [Authorize]
        public async Task<MovieResult?> GetMovieMetadata(string imdbId)
        {
            if (_omdbManager == null)
            {
                throw new Exception("Api key is not set");
            }

            return await _omdbManager.GetMovieMetadataAsync(imdbId);
        }

        [Api]
        [Authorize]
        public async Task<SearchResult?> SeriesSearch(string name)
        {
            if (_omdbManager == null)
            {
                throw new Exception("Api key is not set");
            }

            return await _omdbManager.SeriesSearchAsync(name);
        }

        [Api]
        [Authorize]
        public async Task<SeriesResult?> GetSeriesMetadata(string imdbId)
        {
            if (_omdbManager == null)
            {
                throw new Exception("Api key is not set");
            }

            return await _omdbManager.GetSeriesMetadataAsync(imdbId);
        }

        [Api]
        [Authorize]
        public async Task<EpisodeResult?> EpisodeSearch(string series, int season, int episode)
        {
            if (_omdbManager == null)
            {
                throw new Exception("Api key is not set");
            }

            return await _omdbManager.EpisodeSearchAsync(series, season, episode);
        }

        [Api]
        [Authorize]
        public async Task<EpisodeResult?> GetEpisodeMetadata(string imdbId)
        {
            if (_omdbManager == null)
            {
                throw new Exception("Api key is not set");
            }

            return await _omdbManager.GetEpisodeMetadataAsync(imdbId);
        }

        //[Api]
        //[Authorize]
        //public async Task<SearchResult?> SeasonSearch(string name)
        //{
        //    if (_omdbManager == null)
        //    {
        //        throw new Exception("Api key is not set");
        //    }

        //    return await _omdbManager.GetSeasonEpisodesAsync(name);
        //}

        //[Api]
        //[Authorize]
        //public async Task<SeriesResult?> GetSeriesMetadata(string imdbId)
        //{
        //    if (_omdbManager == null)
        //    {
        //        throw new Exception("Api key is not set");
        //    }

        //    return await _omdbManager.GetSeriesMetadataAsync(imdbId);
        //}
    }
}
