// ============================================================================
// Services/Payment/MockPaymentGateway.cs - 模拟支付网关
// ============================================================================
// 用于开发和测试环境的模拟支付实现。
// 直接返回成功，生成模拟交易号。
//
// **生产环境**: 替换为 StripePaymentGateway 或 AlipayPaymentGateway

using Microsoft.Extensions.Logging;
using MyNextBlog.Models;

namespace MyNextBlog.Services.Payment;

/// <summary>
/// 模拟支付网关实现。
/// 
/// **行为**:
/// - 始终返回成功
/// - 生成模拟交易号
/// - 记录日志便于调试
/// </summary>
public class MockPaymentGateway : IPaymentGateway
{
    private readonly ILogger<MockPaymentGateway> _logger;
    
    public MockPaymentGateway(ILogger<MockPaymentGateway> logger)
    {
        _logger = logger;
    }
    
    public string GatewayName => "MockPayment";
    
    public Task<PaymentResult> ProcessPaymentAsync(Order order)
    {
        // 生成模拟交易号：MOCK + 时间戳 + 随机字符
        var transactionId = $"MOCK{DateTime.UtcNow:yyyyMMddHHmmss}{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        
        _logger.LogInformation(
            "[MockPayment] 模拟支付成功 - 订单号: {OrderNo}, 金额: {Amount}, 交易号: {TransactionId}",
            order.OrderNo,
            order.TotalAmount,
            transactionId
        );
        
        // 模拟支付始终成功
        return Task.FromResult(new PaymentResult(
            Success: true,
            TransactionId: transactionId
        ));
    }
}
