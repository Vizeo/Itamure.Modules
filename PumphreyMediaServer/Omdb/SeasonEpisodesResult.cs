using System;
using System.Collections.Generic;
using System.Text;

namespace MediaServer.Omdb
{
    internal class SeasonEpisodesResult
    {
        public string? Title { get; set; }
        public string? Season { get; set; }
        public string? TotalSeasons { get; set; }
        public string? Response { get; set; }
        public List<EpisodesItem>? Episodes { get; set; }
    }
}
