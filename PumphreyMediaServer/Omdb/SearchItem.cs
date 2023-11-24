using System;
using System.Collections.Generic;
using System.Text;

namespace MediaServer.Omdb
{
    public class SearchResult
    {
        public List<SearchItem>? Search { get; set; }
        public string? TotalResults { get; set; }
        public string? Response { get; set; }
    }
}
