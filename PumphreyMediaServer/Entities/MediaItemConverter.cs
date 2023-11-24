using System.Text.Json;
using System.Text.Json.Serialization;

namespace MediaServer.Entities
{
    public class MediaItemConverter : JsonConverter<MediaItem>
    {
        public override MediaItem? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (JsonDocument.TryParseValue(ref reader, out var doc))
            {
                var mediaITemType = (MediaItemType)doc.RootElement.GetProperty("MediaItemType").GetInt16();
                switch (mediaITemType)
                {
                    case MediaItemType.UnknownVideoFile:                    
                        return JsonSerializer.Deserialize<VideoFileMediaItem>(doc.RootElement.ToString(), options);
                    case MediaItemType.MusicFile:
                        return JsonSerializer.Deserialize<MusicFileMediaItem>(doc.RootElement.ToString(), options);
                    case MediaItemType.PictureFile:
                        return JsonSerializer.Deserialize<PictureFileMediaItem>(doc.RootElement.ToString(), options);
                }
            }
            throw new Exception("Media Item");
        }

        public override void Write(Utf8JsonWriter writer, MediaItem value, JsonSerializerOptions options)
        {
            switch (value)
            {
                case VideoFileMediaItem:
                    JsonSerializer.Serialize(writer, (VideoFileMediaItem)value, options);
                    break;
                case MusicFileMediaItem:
                    JsonSerializer.Serialize(writer, (MusicFileMediaItem)value, options);
                    break;
                case PictureFileMediaItem:
                    JsonSerializer.Serialize(writer, (PictureFileMediaItem)value, options);
                    break;
                default:
                    throw new Exception("Unknown Media Item");
            }
        }
    }
}
