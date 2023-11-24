using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Text.Json;

namespace MediaServer.Omdb
{
    internal class OmdbManager
    {
        private const string METADATA_URL = "http://www.omdbapi.com/?apikey={0}{1}";
        private const string IMAGE_URL = "http://img.omdbapi.com/?apikey={0}{1}";
        private readonly HttpClient _httpClient = new HttpClient();
        private static string? _apiKey;
        private static JsonSerializerOptions _serializerOptions = new JsonSerializerOptions() { PropertyNameCaseInsensitive = true };

        private OmdbManager()
        {
        }

        public static OmdbManager? Current { get; private set; }

        public static string? ApiKey
        {
            get
            {
                return _apiKey;
            }
            set
            {
                _apiKey = value;
                Current = new OmdbManager();
            }
        }

        public async Task<SearchResult?> MovieSearchAsync(string name)
        {
            name = HttpUtility.UrlEncode(name);
            var url = string.Format(METADATA_URL, _apiKey, $"&s={name}&type=movie");
            var searchResults = await _httpClient.GetAsync(url);
            if(searchResults.IsSuccessStatusCode)
            {
                var json = await searchResults.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<SearchResult>(json, _serializerOptions);
            }
            return null;
        }

        public async Task<SearchResult?> SeriesSearchAsync(string name)
        {
            name = HttpUtility.UrlEncode(name);
            var url = string.Format(METADATA_URL, _apiKey, $"&s={name}&type=series");
            var searchResults = await _httpClient.GetAsync(url);
            if (searchResults.IsSuccessStatusCode)
            {
                var json = await searchResults.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<SearchResult>(json, _serializerOptions);
            }
            return null;
        }

        public async Task<EpisodeResult?> EpisodeSearchAsync(string series, int season, int episode)
        {
            series = HttpUtility.UrlEncode(series);
            var url = string.Format(METADATA_URL, _apiKey, $"&t={series}&season={season}&episode={episode}");            
            var searchResults = await _httpClient.GetAsync(url);
            if (searchResults.IsSuccessStatusCode)
            {
                var json = await searchResults.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<EpisodeResult>(json, _serializerOptions);
            }
            return null;
        }
        public async Task<SeasonEpisodesResult?> GetSeasonEpisodesAsync(string imdbId, int season)
        {
            var url = string.Format(METADATA_URL, _apiKey, $"&i={imdbId}&season={season}");
            var searchResults = await _httpClient.GetAsync(url);
            if (searchResults.IsSuccessStatusCode)
            {
                var json = await searchResults.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<SeasonEpisodesResult>(json, _serializerOptions);
            }
            return null;
        }

        public async Task<MovieResult?> GetMovieMetadataAsync(string imdbId)
        {
            var url = string.Format(METADATA_URL, _apiKey, $"&i={imdbId}&type=movie");
            var searchResults = await _httpClient.GetAsync(url);
            if (searchResults.IsSuccessStatusCode)
            {
                var json = await searchResults.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<MovieResult>(json, _serializerOptions);
            }
            return null;
        }

        public async Task<SeriesResult?> GetSeriesMetadataAsync(string imdbId)
        {
            var url = string.Format(METADATA_URL, _apiKey, $"&i={imdbId}&type=series");
            var searchResults = await _httpClient.GetAsync(url);
            if (searchResults.IsSuccessStatusCode)
            {
                var json = await searchResults.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<SeriesResult>(json, _serializerOptions);
            }
            return null;
        }

        public async Task<EpisodeResult?> GetEpisodeMetadataAsync(string imdbId)
        {
            var url = string.Format(METADATA_URL, _apiKey, $"&i={imdbId}&type=episode");
            var searchResults = await _httpClient.GetAsync(url);
            if (searchResults.IsSuccessStatusCode)
            {
                var json = await searchResults.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<EpisodeResult>(json, new JsonSerializerOptions()
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            return null;
        }

        public async Task<Poster?> GetPosterAsync(string imdbId)
        {
            var url = string.Format(IMAGE_URL, _apiKey, $"&i={imdbId}");
            var searchResults = await _httpClient.GetAsync(url);
            if (searchResults.IsSuccessStatusCode)
            {
                return new Poster()
                {
                    ContentType = searchResults.Content.Headers.ContentType?.MediaType,
                    Stream = await searchResults.Content.ReadAsStreamAsync()
                };
            }
            return null;
        }

        public async Task<Poster?> GetPosterAsync(ItemResult itemResult)
        {
            var searchResults = await _httpClient.GetAsync(itemResult.Poster);
            if (searchResults.IsSuccessStatusCode)
            {
                return new Poster()
                {
                    ContentType = searchResults.Content.Headers.ContentType?.MediaType,
                    Stream = await searchResults.Content.ReadAsStreamAsync()
                };
            }
            return null;
        }
    }
}
