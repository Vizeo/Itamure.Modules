using Itamure.Core;

namespace MediaServer.Entities
{
    [ApiInclude]
    public class DirectoryMediaSource : MediaSource
    {
        public string? Path { get; set; }
        public bool IncludeSubdirectories { get; set; }
    }
}
