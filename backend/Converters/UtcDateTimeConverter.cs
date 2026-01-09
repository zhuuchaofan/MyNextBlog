// ============================================================================
// Converters/UtcDateTimeConverter.cs - UTC DateTime JSON 转换器
// ============================================================================
// 确保 DateTime 序列化时始终使用 ISO 8601 格式并带 Z 后缀
// 修复前端 JavaScript new Date() 解析时区问题

using System.Text.Json;
using System.Text.Json.Serialization;

namespace MyNextBlog.Converters;

/// <summary>
/// UTC DateTime JSON 转换器
/// 序列化时强制添加 Z 后缀，确保前端正确识别为 UTC 时间
/// </summary>
public class UtcDateTimeConverter : JsonConverter<DateTime>
{
    /// <summary>
    /// 反序列化：将 JSON 字符串转换为 DateTime (UTC)
    /// </summary>
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var dateStr = reader.GetString();
        if (string.IsNullOrEmpty(dateStr))
        {
            return DateTime.MinValue;
        }
        
        // 解析时间并转换为 UTC
        if (DateTime.TryParse(dateStr, null, System.Globalization.DateTimeStyles.RoundtripKind, out var dt))
        {
            return dt.Kind == DateTimeKind.Utc ? dt : dt.ToUniversalTime();
        }
        
        return DateTime.Parse(dateStr).ToUniversalTime();
    }

    /// <summary>
    /// 序列化：将 DateTime 转换为 ISO 8601 格式字符串 (带 Z 后缀)
    /// </summary>
    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        // 确保时间是 UTC，然后使用 O 格式输出 (ISO 8601)
        var utcTime = value.Kind == DateTimeKind.Utc 
            ? value 
            : value.ToUniversalTime();
        
        // 使用 "O" 格式 = "2026-01-09T15:13:21.0000000Z"
        writer.WriteStringValue(utcTime.ToString("O"));
    }
}

/// <summary>
/// 可空 UTC DateTime 转换器
/// </summary>
public class NullableUtcDateTimeConverter : JsonConverter<DateTime?>
{
    private readonly UtcDateTimeConverter _innerConverter = new();

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }
        return _innerConverter.Read(ref reader, typeof(DateTime), options);
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
        {
            _innerConverter.Write(writer, value.Value, options);
        }
        else
        {
            writer.WriteNullValue();
        }
    }
}
