using System;
using System.Collections.Generic;
using System.Text;

namespace MediaServer.Omdb
{
    public abstract class ItemResult
    {
        public string? Poster { get; set; }
        public string? ImdbID { get; set; }
    }
}
