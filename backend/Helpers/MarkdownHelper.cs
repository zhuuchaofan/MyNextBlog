using System.Text.RegularExpressions;
using Markdig;

namespace MyNextBlog.Helpers;

public static class MarkdownHelper
{
    private static readonly MarkdownPipeline Pipeline = new MarkdownPipelineBuilder().UseAdvancedExtensions().Build();

    public static string Parse(string markdown) => string.IsNullOrEmpty(markdown) ? "" : Markdown.ToHtml(markdown, Pipeline);

    // 提取纯文本摘要
    public static string GetExcerpt(string markdown, int length = 200)
    {
        if (string.IsNullOrEmpty(markdown)) return "";

        // 1. 移除 Markdown 图片: ![alt](url "title")
        // 使用 Singleline 模式，防止跨行失效
        var text = Regex.Replace(markdown, @"!\[.*?\]\(.*?\)", "", RegexOptions.Singleline);
        
        // 2. 移除 HTML 图片: <img ... />
        text = Regex.Replace(text, @"<img[^>]*>", "", RegexOptions.Singleline | RegexOptions.IgnoreCase);

        // 3. 移除代码块: ```...``` -> ''
        // 放在前面，防止代码块里的符号干扰后续正则
        text = Regex.Replace(text, @"```[\s\S]*?```", "", RegexOptions.Multiline);

        // 4. 移除 Markdown 链接: [text](url) -> text
        text = Regex.Replace(text, @"\[(.*?)\]\(.*?\)", "$1", RegexOptions.Singleline);

        // 5. 移除 HTML 标签: <div>...</div> -> ...
        text = Regex.Replace(text, @"<[^>]+>", "", RegexOptions.Singleline);

        // 6. 移除标题标记: # Title -> Title
        text = Regex.Replace(text, @"^#+\s+", "", RegexOptions.Multiline);

        // 7. 移除引用: > Text -> Text
        text = Regex.Replace(text, @"^>\s+", "", RegexOptions.Multiline);

        // 8. 移除行内代码: `code` -> code
        text = Regex.Replace(text, @"`([^`]+)`", "$1");

        // 9. 移除粗体/斜体: **text** -> text
        text = Regex.Replace(text, @"(\*\*|__|\*|_)(.*?)\1", "$2");

        // 10. 压缩空白: 多个换行/空格 -> 单个空格
        text = Regex.Replace(text, @"\s+", " ").Trim();

        return text.Length > length ? text.Substring(0, length) + "..." : text;
    }

    // 提取第一张图片作为封面
    public static string? GetCoverImage(string markdown)
    {
        if (string.IsNullOrEmpty(markdown)) return null;
        
        // 1. 尝试匹配 Markdown 图片
        var match = Regex.Match(markdown, @"!\[.*?\]\((.*?)\)");
        if (match.Success)
        {
            // URL 可能包含 title 部分: url "title"，我们需要只取 url
            return match.Groups[1].Value.Split(new[] { ' ', '"' }, StringSplitOptions.RemoveEmptyEntries)[0]; 
        }

        // 2. 尝试匹配 HTML 图片 <img src="..." />
        var htmlMatch = Regex.Match(markdown, @"<img[^>]+src=[""'](.*?)[""']", RegexOptions.IgnoreCase);
        if (htmlMatch.Success)
        {
            return htmlMatch.Groups[1].Value;
        }

        return null;
    }
}