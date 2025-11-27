using Markdig;
namespace MyTechBlog.Helpers;
public static class MarkdownHelper
{
    private static readonly MarkdownPipeline Pipeline = new MarkdownPipelineBuilder().UseAdvancedExtensions().Build();
    public static string Parse(string markdown) => string.IsNullOrEmpty(markdown) ? "" : Markdown.ToHtml(markdown, Pipeline);
}