using System;
using System.Collections.Generic;
using System.Text;

namespace MediaServer.Omdb
{
    internal class EpisodesItem
    {
        public string? Title { get; set; }
        public string? Released { get; set; }
        public string? Episode { get; set; }
        public string? ImdbRating { get; set; }
        public string? ImdbID { get; set; }
    }
}
