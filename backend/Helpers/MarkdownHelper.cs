using System.Text.RegularExpressions;
using Markdig;

namespace MyNextBlog.Helpers;

/// <summary>
/// Markdown 处理工具类
/// 提供 Markdown 转 HTML、纯文本摘要提取和封面图提取功能
/// </summary>
public static class MarkdownHelper
{
    // 配置 Markdig 管道，启用高级扩展 (表格、任务列表等)
    private static readonly MarkdownPipeline Pipeline = new MarkdownPipelineBuilder().UseAdvancedExtensions().Build();
    
    // 正则超时时间 (防止 ReDoS 攻击)
    private static readonly TimeSpan RegexTimeout = TimeSpan.FromSeconds(1);

    /// <summary>
    /// 将 Markdown 转换为 HTML
    /// </summary>
    public static string Parse(string markdown) => string.IsNullOrEmpty(markdown) ? "" : Markdown.ToHtml(markdown, Pipeline);

    /// <summary>
    /// 从 Markdown 中提取纯文本摘要
    /// </summary>
    /// <param name="markdown">原始 Markdown 内容</param>
    /// <param name="length">截取长度 (默认200字符)</param>
    public static string GetExcerpt(string markdown, int length = 200)
    {
        if (string.IsNullOrEmpty(markdown)) return "";

        try
        {
            // 1. 移除 Markdown 图片: ![alt](url "title")
            // 使用 Singleline 模式，防止跨行失效
            var text = Regex.Replace(markdown, @"!\[.*?\]\(.*?\)", "", RegexOptions.Singleline, RegexTimeout);
            
            // 2. 移除 HTML 图片: <img ... />
            text = Regex.Replace(text, @"<img[^>]*>", "", RegexOptions.Singleline | RegexOptions.IgnoreCase, RegexTimeout);

            // 3. 移除代码块: ```...``` -> ''
            // 放在前面，防止代码块里的符号干扰后续正则
            text = Regex.Replace(text, @"```[\s\S]*?```", "", RegexOptions.None, RegexTimeout);

            // 4. 移除 Markdown 链接: [text](url) -> text
            text = Regex.Replace(text, @"\[(.*?)\]\(.*?\)", "$1", RegexOptions.Singleline, RegexTimeout);

            // 5. 移除 HTML 标签: <div>...</div> -> ...
            text = Regex.Replace(text, @"<[^>]+>", "", RegexOptions.Singleline, RegexTimeout);

            // 6. 移除标题标记: # Title -> Title
            text = Regex.Replace(text, @"^#+\s+", "", RegexOptions.Multiline, RegexTimeout);

            // 7. 移除引用: > Text -> Text
            text = Regex.Replace(text, @"^>\s+", "", RegexOptions.Multiline, RegexTimeout);

            // 8. 移除行内代码: `code` -> code
            text = Regex.Replace(text, @"`([^`]+)`", "$1", RegexOptions.None, RegexTimeout);

            // 9. 移除粗体/斜体: **text** -> text
            text = Regex.Replace(text, @"(\*\*|__|\*|_)(.*?)\1", "$2", RegexOptions.None, RegexTimeout);

            // 10. 压缩空白: 多个换行/空格 -> 单个空格
            text = Regex.Replace(text, @"\s+", " ", RegexOptions.None, RegexTimeout).Trim();

            // 截取并添加省略号
            return text.Length > length ? text.Substring(0, length) + "..." : text;
        }
        catch (RegexMatchTimeoutException)
        {
            // 正则超时，返回截断的原始文本作为降级方案
            var fallback = Regex.Replace(markdown, @"[#*`>\[\]!]", "", RegexOptions.None, TimeSpan.FromMilliseconds(100));
            return fallback.Length > length ? fallback.Substring(0, length) + "..." : fallback;
        }
    }

    /// <summary>
    /// 提取 Markdown 中的第一张图片作为封面
    /// </summary>
    /// <returns>图片 URL (若无图则返回 null)</returns>
    public static string? GetCoverImage(string markdown)
    {
        if (string.IsNullOrEmpty(markdown)) return null;
        
        try
        {
            // 1. 尝试匹配 Markdown 图片语法
            var match = Regex.Match(markdown, @"!\[.*?\]\((.*?)\)", RegexOptions.None, RegexTimeout);
            if (match.Success)
            {
                // URL 可能包含 title 部分: url "title"，我们需要只取 url
                return match.Groups[1].Value.Split(new[] { ' ', '"' }, StringSplitOptions.RemoveEmptyEntries)[0]; 
            }

            // 2. 尝试匹配 HTML 图片标签 <img src="..." />
            var htmlMatch = Regex.Match(markdown, @"<img[^>]+src=[""'](.*?)[""']", RegexOptions.IgnoreCase, RegexTimeout);
            if (htmlMatch.Success)
            {
                return htmlMatch.Groups[1].Value;
            }
        }
        catch (RegexMatchTimeoutException)
        {
            // 正则超时，返回 null (无封面图)
            return null;
        }

        return null;
    }
}
