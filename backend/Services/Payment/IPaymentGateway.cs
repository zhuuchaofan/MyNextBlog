// ============================================================================
// Services/Payment/IPaymentGateway.cs - 支付网关接口
// ============================================================================
// 使用策略模式 (Strategy Pattern) 设计支付网关，便于未来扩展。
//
// **当前实现**: MockPaymentGateway (模拟支付)
// **未来扩展**: StripePaymentGateway, AlipayPaymentGateway 等

using MyNextBlog.Models;

namespace MyNextBlog.Services.Payment;

/// <summary>
/// 支付结果 DTO
/// </summary>
/// <param name="Success">是否成功</param>
/// <param name="TransactionId">交易号（支付平台返回）</param>
/// <param name="ErrorMessage">失败时的错误信息</param>
public record PaymentResult(bool Success, string? TransactionId = null, string? ErrorMessage = null);

/// <summary>
/// 支付网关接口。
/// 
/// **设计思想**: 策略模式
/// - 定义统一接口，不同支付方式实现该接口
/// - 通过 DI 切换实现，无需修改业务逻辑
/// </summary>
public interface IPaymentGateway
{
    /// <summary>
    /// 处理订单支付
    /// </summary>
    /// <param name="order">要支付的订单</param>
    /// <returns>支付结果</returns>
    Task<PaymentResult> ProcessPaymentAsync(Order order);
    
    /// <summary>
    /// 获取支付网关名称（用于日志和调试）
    /// </summary>
    string GatewayName { get; }
}
