﻿namespace MediaServer.Api
{
	internal class CastMediaInfo
	{
		public Guid UniqueLink { get; set; }
		public string? UserName { get; set; }
		public string? Title { get; set; }
		public string? MimeType { get; set; }
		public short? Width { get; set; }
		public short? Height { get; set; }
		public decimal? Duration { get; set; }
		public decimal StartPosition { get; set; } //In percentage
	}
}
