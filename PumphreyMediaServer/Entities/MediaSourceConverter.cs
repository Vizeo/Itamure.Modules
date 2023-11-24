using System.Text.Json;
using System.Text.Json.Serialization;

namespace MediaServer.Entities
{
    public class MediaSourceConverter : JsonConverter<MediaSource>
    {
        public override MediaSource? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (JsonDocument.TryParseValue(ref reader, out var doc))
            {
                var displayItemType = (MediaSourceType)doc.RootElement.GetProperty("MediaSourceType").GetInt16();
                switch (displayItemType)
                {
                    case MediaSourceType.Directory:
                        return JsonSerializer.Deserialize<DirectoryMediaSource>(doc.RootElement.ToString(), options);
                }

            }
            throw new Exception("Unknown Media Source");
        }

        public override void Write(Utf8JsonWriter writer, MediaSource value, JsonSerializerOptions options)
        {
            switch (value)
            {
                case DirectoryMediaSource:
                    JsonSerializer.Serialize(writer, (DirectoryMediaSource)value, options);
                    break;            
                default:
                    throw new Exception("Unknown Media Source");
            }
        }
    }
}
