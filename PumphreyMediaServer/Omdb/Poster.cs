using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace MediaServer.Omdb
{
    internal class Poster
    {
        public Stream? Stream { get; internal set; }
        public string? ContentType { get; internal set; }
    }
}
