// ============================================================================
// Services/EmailTemplateService.cs - 邮件模板服务实现
// ============================================================================
// 此服务负责邮件模板的 CRUD、缓存和渲染。
//
// **核心功能**:
//   - 模板渲染: 变量替换 {{Key}}
//   - 安全防御: 自动对插值进行 HTML 编码，防止 XSS
//   - 性能优化: 30分钟内存缓存
//
// **占位符**: 支持 Subject (纯文本) 和 Body (HTML)

// `using` 语句用于导入必要的命名空间
using Microsoft.EntityFrameworkCore;         // EF Core
using Microsoft.Extensions.Caching.Memory;    // 内存缓存
using System.Web;                             // HTML 编码
using MyNextBlog.Data;                        // 数据访问层
using MyNextBlog.DTOs;                        // DTO
using MyNextBlog.Models;                      // 领域模型

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// 邮件模板服务实现
/// 提供模板的 CRUD 和渲染功能，带内存缓存
/// </summary>
public class EmailTemplateService(
    AppDbContext context,
    IMemoryCache cache,
    ILogger<EmailTemplateService> logger) : IEmailTemplateService
{
    private const string CacheKeyPrefix = "email_template_";
    private const string AllTemplatesCacheKey = "email_templates_all";  // 列表缓存 Key
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(30);
    
    /// <summary>
    /// 获取所有邮件模板（管理后台用）
    /// 带缓存，减少后台页面刷新时的数据库压力
    /// </summary>
    public async Task<List<EmailTemplateDto>> GetAllAsync()
    {
        // 尝试从缓存获取
        if (cache.TryGetValue<List<EmailTemplateDto>>(AllTemplatesCacheKey, out var cached))
        {
            return cached!;
        }
        
        // 缓存未命中，从数据库查询
        var result = await context.EmailTemplates
            .AsNoTracking()
            .OrderBy(t => t.Id)
            .Select(t => new EmailTemplateDto(
                t.Id,
                t.TemplateKey,
                t.Name,
                t.SubjectTemplate,
                t.BodyTemplate,
                t.AvailablePlaceholders,
                t.Description,
                t.IsEnabled,
                t.UpdatedAt
            ))
            .ToListAsync();
        
        // 存入缓存
        cache.Set(AllTemplatesCacheKey, result, CacheDuration);
        return result;
    }
    
    /// <summary>
    /// 根据 Key 获取单个模板
    /// </summary>
    public async Task<EmailTemplateDto?> GetByKeyAsync(string templateKey)
    {
        var template = await GetTemplateFromCacheOrDb(templateKey);
        if (template == null) return null;
        
        return new EmailTemplateDto(
            template.Id,
            template.TemplateKey,
            template.Name,
            template.SubjectTemplate,
            template.BodyTemplate,
            template.AvailablePlaceholders,
            template.Description,
            template.IsEnabled,
            template.UpdatedAt
        );
    }
    
    /// <summary>
    /// 更新模板内容
    /// </summary>
    public async Task<bool> UpdateAsync(string templateKey, UpdateEmailTemplateDto dto)
    {
        var template = await context.EmailTemplates
            .FirstOrDefaultAsync(t => t.TemplateKey == templateKey);
        
        if (template == null) return false;
        
        template.SubjectTemplate = dto.SubjectTemplate;
        template.BodyTemplate = dto.BodyTemplate;
        
        if (dto.IsEnabled.HasValue)
            template.IsEnabled = dto.IsEnabled.Value;
        
        template.UpdatedAt = DateTime.UtcNow;
        
        await context.SaveChangesAsync();
        
        // 清除缓存：单个模板缓存 + 列表缓存
        cache.Remove(CacheKeyPrefix + templateKey);
        cache.Remove(AllTemplatesCacheKey);
        
        logger.LogInformation("邮件模板已更新: {TemplateKey}", templateKey);
        
        return true;
    }
    
    /// <summary>
    /// 渲染模板（替换占位符）
    /// </summary>
    public async Task<(string Subject, string Body)?> RenderAsync(string templateKey, Dictionary<string, string> data)
    {
        var template = await GetTemplateFromCacheOrDb(templateKey);
        
        if (template == null)
        {
            logger.LogWarning("邮件模板不存在: {TemplateKey}", templateKey);
            return null;
        }
        
        if (!template.IsEnabled)
        {
            logger.LogDebug("邮件模板已禁用: {TemplateKey}", templateKey);
            return null;
        }
        
        // 主题不需要 HTML 编码（纯文本），正文需要 HTML 编码（防止 XSS）
        var subject = RenderPlaceholdersRaw(template.SubjectTemplate, data);
        var body = RenderPlaceholdersHtml(template.BodyTemplate, data);
        
        return (subject, body);
    }
    
    // 允许包含原始 HTML 的占位符（这些是系统生成的，不是用户输入）
    private static readonly HashSet<string> HtmlPlaceholders = new(StringComparer.OrdinalIgnoreCase)
    {
        "Items",           // 订单商品清单
        "DownloadLinks",   // 下载链接列表
        "RedeemCodes",     // 兑换码列表
        "DaysSummary"      // 计划行程概要
    };
    
    /// <summary>
    /// 从缓存或数据库获取模板
    /// </summary>
    private async Task<EmailTemplate?> GetTemplateFromCacheOrDb(string templateKey)
    {
        var cacheKey = CacheKeyPrefix + templateKey;
        
        if (cache.TryGetValue<EmailTemplate>(cacheKey, out var cached))
        {
            return cached;
        }
        
        var template = await context.EmailTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TemplateKey == templateKey);
        
        if (template != null)
        {
            cache.Set(cacheKey, template, CacheDuration);
        }
        
        return template;
    }
    
    /// <summary>
    /// 替换占位符（HTML 编码版本，用于邮件正文）
    /// 对用户输入内容进行 HTML 编码，防止 XSS 攻击
    /// 但对系统生成的 HTML 内容（如商品清单）不编码
    /// </summary>
    private static string RenderPlaceholdersHtml(string template, Dictionary<string, string> data)
    {
        foreach (var (key, value) in data)
        {
            // 系统生成的 HTML 内容不需要编码（如商品清单、下载链接等）
            // 这些内容由服务端生成，不是用户输入，是安全的
            var safeValue = HtmlPlaceholders.Contains(key) 
                ? (value ?? "")  // 直接使用原始 HTML
                : HttpUtility.HtmlEncode(value ?? "");  // 用户输入需要编码
            
            template = template.Replace($"{{{{{key}}}}}", safeValue);
        }
        return template;
    }
    
    /// <summary>
    /// 替换占位符（原始版本，用于邮件主题）
    /// 主题是纯文本，不需要 HTML 编码
    /// </summary>
    private static string RenderPlaceholdersRaw(string template, Dictionary<string, string> data)
    {
        foreach (var (key, value) in data)
        {
            template = template.Replace($"{{{{{key}}}}}", value ?? "");
        }
        return template;
    }
}
