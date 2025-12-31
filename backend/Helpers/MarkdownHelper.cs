// `using` 语句用于导入必要的命名空间
using System.Text.RegularExpressions;  // 引入正则表达式类，用于 Markdown 语法解析
using Markdig;                          // 引入 Markdig 库，高性能的 Markdown 解析器

// `namespace` 声明了当前文件中的代码所属的命名空间
namespace MyNextBlog.Helpers;

/// <summary>
/// `MarkdownHelper` 是一个静态工具类，提供 Markdown 处理相关功能。
/// 
/// **主要功能**:
///   - `Parse`: 将 Markdown 转换为 HTML
///   - `GetExcerpt`: 从 Markdown 中提取纯文本摘要
///   - `GetCoverImage`: 提取第一张图片作为封面
/// 
/// **安全特性**:
///   - 所有正则操作都有 1 秒超时限制，防止 ReDoS (正则表达式拒绝服务) 攻击
///   - 超时时会优雅降级，不会抛出异常导致 500 错误
/// </summary>
public static class MarkdownHelper
{
    // 配置 Markdig 管道，启用高级扩展 (表格、任务列表、代码高亮等)
    // 使用 `static readonly` 确保管道只创建一次，提高性能
    private static readonly MarkdownPipeline Pipeline = new MarkdownPipelineBuilder()
        .UseAdvancedExtensions()
        .Build();
    
    /// <summary>
    /// 正则超时时间常量
    /// 
    /// **安全说明**: 
    /// 设置为 1 秒是为了防止 ReDoS 攻击。恶意用户可能构造特殊的 Markdown 语法
    /// (如 1000 个连续 `*`)，导致正则引擎发生指数级回溯，CPU 占用 100%。
    /// </summary>
    private static readonly TimeSpan RegexTimeout = TimeSpan.FromSeconds(1);

    /// <summary>
    /// 将 Markdown 转换为 HTML
    /// </summary>
    /// <param name="markdown">原始 Markdown 文本</param>
    /// <returns>转换后的 HTML 字符串，空输入返回空字符串</returns>
    public static string Parse(string markdown) => 
        string.IsNullOrEmpty(markdown) ? "" : Markdown.ToHtml(markdown, Pipeline);

    /// <summary>
    /// `GetExcerpt` 方法从 Markdown 中提取纯文本摘要。
    /// 
    /// **处理流程**:
    /// 1. 移除图片、链接、代码块等 Markdown 语法
    /// 2. 移除 HTML 标签
    /// 3. 压缩多余空白
    /// 4. 截取指定长度并添加省略号
    /// </summary>
    /// <param name="markdown">原始 Markdown 内容</param>
    /// <param name="length">截取长度 (默认 200 字符)</param>
    /// <returns>纯文本摘要，超时时返回简单处理后的文本</returns>
    public static string GetExcerpt(string markdown, int length = 200)
    {
        if (string.IsNullOrEmpty(markdown)) return "";

        try
        {
            // 1. **移除 Markdown 图片**: `![alt](url "title")` -> 空
            // 使用 `Singleline` 模式使 `.` 匹配换行符，防止跨行图片语法失效
            var text = Regex.Replace(
                markdown, 
                @"!\[.*?\]\(.*?\)", 
                "", 
                RegexOptions.Singleline, 
                RegexTimeout);
            
            // 2. **移除 HTML 图片**: `<img ... />` -> 空
            text = Regex.Replace(
                text, 
                @"<img[^>]*>", 
                "", 
                RegexOptions.Singleline | RegexOptions.IgnoreCase, 
                RegexTimeout);

            // 3. **移除代码块**: ` ```...``` ` -> 空
            // 放在前面处理，防止代码块里的符号干扰后续正则
            text = Regex.Replace(
                text, 
                @"```[\s\S]*?```", 
                "", 
                RegexOptions.None, 
                RegexTimeout);

            // 4. **移除 Markdown 链接**: `[text](url)` -> `text`
            // 保留链接文字，移除 URL
            text = Regex.Replace(
                text, 
                @"\[(.*?)\]\(.*?\)", 
                "$1", 
                RegexOptions.Singleline, 
                RegexTimeout);

            // 5. **移除 HTML 标签**: `<div>...</div>` -> `...`
            text = Regex.Replace(
                text, 
                @"<[^>]+>", 
                "", 
                RegexOptions.Singleline, 
                RegexTimeout);

            // 6. **移除标题标记**: `# Title` -> `Title`
            text = Regex.Replace(
                text, 
                @"^#+\s+", 
                "", 
                RegexOptions.Multiline, 
                RegexTimeout);

            // 7. **移除引用**: `> Text` -> `Text`
            text = Regex.Replace(
                text, 
                @"^>\s+", 
                "", 
                RegexOptions.Multiline, 
                RegexTimeout);

            // 8. **移除行内代码**: `` `code` `` -> `code`
            text = Regex.Replace(
                text, 
                @"`([^`]+)`", 
                "$1", 
                RegexOptions.None, 
                RegexTimeout);

            // 9. **移除粗体/斜体**: `**text**` 或 `_text_` -> `text`
            text = Regex.Replace(
                text, 
                @"(\*\*|__|\*|_)(.*?)\1", 
                "$2", 
                RegexOptions.None, 
                RegexTimeout);

            // 10. **压缩空白**: 多个换行/空格 -> 单个空格
            text = Regex.Replace(
                text, 
                @"\s+", 
                " ", 
                RegexOptions.None, 
                RegexTimeout).Trim();

            // 11. **截取并添加省略号**
            return text.Length > length ? text.Substring(0, length) + "..." : text;
        }
        catch (RegexMatchTimeoutException)
        {
            // **降级处理**: 正则超时时，使用简单的字符替换作为备用方案
            // 只移除常见的 Markdown 符号，保证不会卡死
            var fallback = Regex.Replace(
                markdown, 
                @"[#*`>\[\]!]", 
                "", 
                RegexOptions.None, 
                TimeSpan.FromMilliseconds(100));
            return fallback.Length > length ? fallback.Substring(0, length) + "..." : fallback;
        }
    }

    /// <summary>
    /// `GetCoverImage` 方法提取 Markdown 中的第一张图片作为封面。
    /// 
    /// **匹配优先级**:
    /// 1. Markdown 图片语法: `![alt](url)`
    /// 2. HTML 图片标签: `<img src="url" />`
    /// </summary>
    /// <param name="markdown">原始 Markdown 内容</param>
    /// <returns>图片 URL，若无图或超时则返回 `null`</returns>
    public static string? GetCoverImage(string markdown)
    {
        if (string.IsNullOrEmpty(markdown)) return null;
        
        try
        {
            // 1. **尝试匹配 Markdown 图片语法**: `![alt](url "title")`
            var match = Regex.Match(
                markdown, 
                @"!\[.*?\]\((.*?)\)", 
                RegexOptions.None, 
                RegexTimeout);
                
            if (match.Success)
            {
                // URL 可能包含 title 部分: `url "title"`，只取 url
                // 使用 Split 分离 URL 和 title
                return match.Groups[1].Value
                    .Split(new[] { ' ', '"' }, StringSplitOptions.RemoveEmptyEntries)[0]; 
            }

            // 2. **尝试匹配 HTML 图片标签**: `<img src="url" />`
            var htmlMatch = Regex.Match(
                markdown, 
                @"<img[^>]+src=[""'](.*?)[""']", 
                RegexOptions.IgnoreCase, 
                RegexTimeout);
                
            if (htmlMatch.Success)
            {
                return htmlMatch.Groups[1].Value;
            }
        }
        catch (RegexMatchTimeoutException)
        {
            // **降级处理**: 正则超时，放弃提取封面图，返回 null
            // 前端会使用默认封面或无封面显示
            return null;
        }

        return null;
    }
}
