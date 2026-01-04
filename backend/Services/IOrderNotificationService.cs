// ============================================================================
// Services/IOrderNotificationService.cs - 订单通知服务接口
// ============================================================================

using MyNextBlog.Models;

namespace MyNextBlog.Services;

/// <summary>
/// 订单邮件通知服务接口
/// </summary>
public interface IOrderNotificationService
{
    /// <summary>
    /// 发送订单创建通知邮件
    /// </summary>
    Task SendOrderCreatedEmailAsync(Order order);
    
    /// <summary>
    /// 发送订单完成通知邮件（含下载链接/兑换码）
    /// </summary>
    Task SendOrderCompletedEmailAsync(Order order);
}
