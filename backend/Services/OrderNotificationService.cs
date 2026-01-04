// ============================================================================
// Services/OrderNotificationService.cs - 订单通知服务实现
// ============================================================================
// 订单相关邮件通知，使用邮件模板系统。
//
// **邮件内容设计**:
//   - order_created: 订单创建确认，商品清单
//   - order_completed: 付款成功，包含下载链接/兑换码（HTML 格式）

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyNextBlog.Data;
using MyNextBlog.Models;
using MyNextBlog.Services.Email;
using System.Text;

namespace MyNextBlog.Services;

/// <summary>
/// 订单邮件通知服务实现
/// </summary>
public class OrderNotificationService : IOrderNotificationService
{
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IEmailTemplateService _templateService;
    private readonly ILogger<OrderNotificationService> _logger;
    
    public OrderNotificationService(
        AppDbContext context,
        IEmailService emailService,
        IEmailTemplateService templateService,
        ILogger<OrderNotificationService> logger)
    {
        _context = context;
        _emailService = emailService;
        _templateService = templateService;
        _logger = logger;
    }
    
    /// <summary>
    /// 发送订单创建通知邮件
    /// </summary>
    public async Task SendOrderCreatedEmailAsync(Order order)
    {
        // 获取用户邮箱
        var userEmail = order.User?.Email;
        if (string.IsNullOrEmpty(userEmail))
        {
            _logger.LogWarning("用户没有邮箱，无法发送订单创建通知: {OrderNo}", order.OrderNo);
            return;
        }
        
        // 构建商品清单 HTML
        var itemsHtml = BuildItemsListHtml(order.Items);
        
        // 准备模板数据
        var data = new Dictionary<string, string>
        {
            ["OrderNo"] = order.OrderNo,
            ["TotalAmount"] = order.TotalAmount.ToString("F2"),
            ["Items"] = itemsHtml,
            ["CreateTime"] = order.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
        };
        
        // 渲染模板
        var rendered = await _templateService.RenderAsync("order_created", data);
        if (rendered == null)
        {
            _logger.LogWarning("订单创建邮件模板不存在或被禁用: order_created");
            return;
        }
        
        // 发送邮件
        await _emailService.SendEmailAsync(userEmail, rendered.Value.Subject, rendered.Value.Body);
        
        _logger.LogInformation("订单创建通知已发送: {OrderNo} -> {Email}", order.OrderNo, userEmail);
    }
    
    /// <summary>
    /// 发送订单完成通知邮件（含下载链接/兑换码）
    /// </summary>
    public async Task SendOrderCompletedEmailAsync(Order order)
    {
        // 获取用户邮箱
        var userEmail = order.User?.Email;
        if (string.IsNullOrEmpty(userEmail))
        {
            _logger.LogWarning("用户没有邮箱，无法发送订单完成通知: {OrderNo}", order.OrderNo);
            return;
        }
        
        // 确保加载商品信息（获取下载链接/兑换码）
        if (!order.Items.Any(i => i.Product != null))
        {
            order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.Items)
                    .ThenInclude(oi => oi.Product)
                .FirstAsync(o => o.Id == order.Id);
        }
        
        // 构建下载链接和兑换码 HTML
        var downloadLinksHtml = BuildDownloadLinksHtml(order.Items);
        var redeemCodesHtml = BuildRedeemCodesHtml(order.Items);
        
        // 准备模板数据
        var data = new Dictionary<string, string>
        {
            ["OrderNo"] = order.OrderNo,
            ["TotalAmount"] = order.TotalAmount.ToString("F2"),
            ["DownloadLinks"] = downloadLinksHtml,
            ["RedeemCodes"] = redeemCodesHtml,
            ["PaidTime"] = (order.PaidAt ?? DateTime.UtcNow).ToString("yyyy-MM-dd HH:mm:ss")
        };
        
        // 渲染模板
        var rendered = await _templateService.RenderAsync("order_completed", data);
        if (rendered == null)
        {
            _logger.LogWarning("订单完成邮件模板不存在或被禁用: order_completed");
            return;
        }
        
        // 发送邮件
        await _emailService.SendEmailAsync(userEmail, rendered.Value.Subject, rendered.Value.Body);
        
        _logger.LogInformation("订单完成通知已发送: {OrderNo} -> {Email}", order.OrderNo, userEmail);
    }
    
    // --- 私有方法 ---
    
    /// <summary>
    /// 构建商品清单 HTML
    /// </summary>
    private static string BuildItemsListHtml(ICollection<OrderItem> items)
    {
        if (items == null || items.Count == 0)
            return "<p>（无商品）</p>";
        
        var sb = new StringBuilder();
        sb.AppendLine("<table style=\"border-collapse: collapse; width: 100%;\">");
        sb.AppendLine("<tr style=\"background-color: #f5f5f5;\">");
        sb.AppendLine("<th style=\"padding: 8px; text-align: left; border: 1px solid #ddd;\">商品</th>");
        sb.AppendLine("<th style=\"padding: 8px; text-align: right; border: 1px solid #ddd;\">单价</th>");
        sb.AppendLine("<th style=\"padding: 8px; text-align: center; border: 1px solid #ddd;\">数量</th>");
        sb.AppendLine("<th style=\"padding: 8px; text-align: right; border: 1px solid #ddd;\">小计</th>");
        sb.AppendLine("</tr>");
        
        foreach (var item in items)
        {
            var subtotal = item.Price * item.Quantity;
            sb.AppendLine("<tr>");
            sb.AppendLine($"<td style=\"padding: 8px; border: 1px solid #ddd;\">{item.ProductName}</td>");
            sb.AppendLine($"<td style=\"padding: 8px; text-align: right; border: 1px solid #ddd;\">¥{item.Price:F2}</td>");
            sb.AppendLine($"<td style=\"padding: 8px; text-align: center; border: 1px solid #ddd;\">{item.Quantity}</td>");
            sb.AppendLine($"<td style=\"padding: 8px; text-align: right; border: 1px solid #ddd;\">¥{subtotal:F2}</td>");
            sb.AppendLine("</tr>");
        }
        
        sb.AppendLine("</table>");
        return sb.ToString();
    }
    
    /// <summary>
    /// 构建下载链接 HTML（审计建议：使用友好的链接格式）
    /// </summary>
    private static string BuildDownloadLinksHtml(ICollection<OrderItem> items)
    {
        var itemsWithDownload = items.Where(i => !string.IsNullOrEmpty(i.Product?.DownloadUrl)).ToList();
        
        if (itemsWithDownload.Count == 0)
            return "<p>（无下载链接）</p>";
        
        var sb = new StringBuilder();
        sb.AppendLine("<ul style=\"list-style-type: none; padding: 0;\">");
        
        foreach (var item in itemsWithDownload)
        {
            sb.AppendLine($"<li style=\"margin: 10px 0;\">");
            sb.AppendLine($"  <strong>{item.ProductName}</strong>: ");
            sb.AppendLine($"  <a href=\"{item.Product!.DownloadUrl}\" style=\"color: #007bff; text-decoration: none;\">📥 点击下载</a>");
            sb.AppendLine("</li>");
        }
        
        sb.AppendLine("</ul>");
        return sb.ToString();
    }
    
    /// <summary>
    /// 构建兑换码 HTML
    /// </summary>
    private static string BuildRedeemCodesHtml(ICollection<OrderItem> items)
    {
        var itemsWithCode = items.Where(i => !string.IsNullOrEmpty(i.Product?.RedeemCode)).ToList();
        
        if (itemsWithCode.Count == 0)
            return "<p>（无兑换码）</p>";
        
        var sb = new StringBuilder();
        sb.AppendLine("<ul style=\"list-style-type: none; padding: 0;\">");
        
        foreach (var item in itemsWithCode)
        {
            sb.AppendLine($"<li style=\"margin: 10px 0;\">");
            sb.AppendLine($"  <strong>{item.ProductName}</strong>: ");
            sb.AppendLine($"  <code style=\"background-color: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-family: monospace;\">{item.Product!.RedeemCode}</code>");
            sb.AppendLine("</li>");
        }
        
        sb.AppendLine("</ul>");
        return sb.ToString();
    }
}
