using System.Text.Json;
using System.Text.Json.Serialization;

public class IntOrStringConverter : JsonConverter<int>
{
    public override int Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        try
        {
            return reader.TokenType switch
            {
                JsonTokenType.Number => reader.GetInt32(),
                JsonTokenType.String => int.TryParse(reader.GetString(), out int value) ? value : 0,
                JsonTokenType.Null => 0,
                _ => 0
            };
        }
        catch
        {
            return 0;
        }
    }

    public override void Write(Utf8JsonWriter writer, int value, JsonSerializerOptions options)
    {
        writer.WriteNumberValue(value);
    }
}
