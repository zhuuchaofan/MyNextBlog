// ============================================================================
// Services/OrderService.cs - 订单服务实现
// ============================================================================
// 订单的核心业务逻辑，包含：
// - 原子库存扣减（防超卖）
// - 事务一致性
// - 价格后端查询（防篡改）
// - 条件可见性 DTO 映射

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Services.Payment;

namespace MyNextBlog.Services;

/// <summary>
/// 订单服务实现
/// </summary>
public class OrderService : IOrderService
{
    private readonly AppDbContext _context;
    private readonly ILogger<OrderService> _logger;
    private readonly IPaymentGateway _paymentGateway;
    private readonly IServiceScopeFactory _scopeFactory; // 用于后台任务创建独立 Scope
    
    public OrderService(
        AppDbContext context,
        ILogger<OrderService> logger,
        IPaymentGateway paymentGateway,
        IServiceScopeFactory scopeFactory) // 为后台邮件发送提供独立 DI 作用域
    {
        _context = context;
        _logger = logger;
        _paymentGateway = paymentGateway;
        _scopeFactory = scopeFactory;
    }
    
    // --- 用户 API ---
    
    /// <summary>
    /// 创建订单（事务 + 原子库存扣减）
    /// </summary>
    public async Task<OrderDto> CreateOrderAsync(int userId, CreateOrderDto dto)
    {
        if (dto.Items == null || dto.Items.Count == 0)
        {
            throw new ArgumentException("订单项不能为空");
        }
        
        // 开启事务
        await using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            // 1. 生成订单号
            var orderNo = GenerateOrderNo();
            
            // 2. 创建订单
            var order = new Order
            {
                OrderNo = orderNo,
                UserId = userId,
                Status = OrderStatus.Pending,
                Remark = dto.Remark,
                CreatedAt = DateTime.UtcNow
            };
            
            decimal totalAmount = 0;
            var orderItems = new List<OrderItem>();
            
            foreach (var item in dto.Items)
            {
                // 3. 从数据库查询商品（绝不信任前端价格）
                var product = await _context.Products
                    .Where(p => p.Id == item.ProductId && p.IsActive)
                    .Select(p => new { p.Id, p.Name, p.Price, p.Stock })
                    .FirstOrDefaultAsync();
                
                if (product == null)
                {
                    throw new InvalidOperationException($"商品不存在或已下架: {item.ProductId}");
                }
                
                // 4. 检查库存
                if (product.Stock != -1 && product.Stock < item.Quantity)
                {
                    throw new InvalidOperationException($"商品 {product.Name} 库存不足");
                }
                
                // 5. 原子扣减库存（仅限有限库存商品）
                if (product.Stock != -1)
                {
                    var affected = await _context.Products
                        .Where(p => p.Id == item.ProductId && p.Stock >= item.Quantity)
                        .ExecuteUpdateAsync(s => s.SetProperty(
                            p => p.Stock, 
                            p => p.Stock - item.Quantity
                        ));
                    
                    if (affected == 0)
                    {
                        throw new InvalidOperationException($"商品 {product.Name} 库存不足（并发冲突）");
                    }
                }
                
                // 6. 创建订单项（价格快照）
                orderItems.Add(new OrderItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Price = product.Price,
                    Quantity = item.Quantity
                });
                
                totalAmount += product.Price * item.Quantity;
            }
            
            // 7. 设置订单总金额并关联订单项
            order.TotalAmount = totalAmount;
            order.Items = orderItems;
            
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            
            // 8. 提交事务
            await transaction.CommitAsync();
            
            _logger.LogInformation(
                "订单已创建: {OrderNo}, 用户: {UserId}, 金额: {Amount}",
                order.OrderNo, userId, totalAmount
            );
            
            // 9. 发送订单创建通知邮件（异步，不阻塞）
            // 注意: 使用 IServiceScopeFactory 创建新 Scope，避免 DbContext 被释放
            // 未来迁移到 Azure Function 时，只需将此部分替换为队列消息发送
            var createdOrderId = order.Id;
            var createdOrderNo = order.OrderNo;
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var notificationService = scope.ServiceProvider.GetRequiredService<IOrderNotificationService>();
                    
                    var fullOrder = await db.Orders
                        .Include(o => o.User)
                        .Include(o => o.Items)
                        .FirstAsync(o => o.Id == createdOrderId);
                    await notificationService.SendOrderCreatedEmailAsync(fullOrder);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "发送订单创建邮件失败: {OrderNo}", createdOrderNo);
                }
            });
            
            return MapToDto(order, showSensitiveInfo: false);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    
    public async Task<List<OrderDto>> GetUserOrdersAsync(int userId)
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        
        return orders.Select(o => MapToDto(o, showSensitiveInfo: o.Status >= OrderStatus.Paid)).ToList();
    }
    
    public async Task<OrderDto?> GetOrderByIdAsync(int orderId, int userId)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);
        
        if (order == null) return null;
        
        // 条件可见性：只有付款后才显示下载链接
        return MapToDto(order, showSensitiveInfo: order.Status >= OrderStatus.Paid);
    }
    
    /// <summary>
    /// 处理支付（模拟付款 → 自动发货）
    /// </summary>
    public async Task<OrderDto?> ProcessPaymentAsync(int orderId, int userId)
    {
        var order = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);
        
        if (order == null) return null;
        
        if (order.Status != OrderStatus.Pending)
        {
            throw new InvalidOperationException($"订单状态不允许付款: {order.Status}");
        }
        
        // 1. 调用支付网关
        var paymentResult = await _paymentGateway.ProcessPaymentAsync(order);
        
        if (!paymentResult.Success)
        {
            _logger.LogWarning(
                "支付失败: {OrderNo}, 错误: {Error}",
                order.OrderNo, paymentResult.ErrorMessage
            );
            throw new InvalidOperationException($"支付失败: {paymentResult.ErrorMessage}");
        }
        
        // 2. 更新订单状态为已付款
        order.Status = OrderStatus.Paid;
        order.PaidAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        
        _logger.LogInformation(
            "订单已付款: {OrderNo}, 交易号: {TransactionId}",
            order.OrderNo, paymentResult.TransactionId
        );
        
        // 3. 虚拟商品自动发货（发送邮件）
        // 注意: 使用 IServiceScopeFactory 创建新 Scope，避免 DbContext 被释放
        var completedOrderId = order.Id;
        var completedOrderNo = order.OrderNo;
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<IOrderNotificationService>();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                
                var freshOrder = await db.Orders
                    .Include(o => o.User)
                    .Include(o => o.Items)
                        .ThenInclude(oi => oi.Product)
                    .FirstAsync(o => o.Id == completedOrderId);
                await notificationService.SendOrderCompletedEmailAsync(freshOrder);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "发送发货邮件失败: {OrderNo}", completedOrderNo);
            }
        });
        
        return MapToDto(order, showSensitiveInfo: true);
    }
    
    public async Task<bool> ConfirmReceiptAsync(int orderId, int userId)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);
        
        if (order == null) return false;
        
        if (order.Status != OrderStatus.Paid)
        {
            throw new InvalidOperationException($"订单状态不允许确认收货: {order.Status}");
        }
        
        order.Status = OrderStatus.Completed;
        order.CompletedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("订单已确认收货: {OrderNo}", order.OrderNo);
        
        return true;
    }
    
    /// <summary>
    /// 用户取消自己的订单（仅限 Pending 状态）
    /// </summary>
    public async Task<bool> CancelOrderByUserAsync(int orderId, int userId)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);
            
            if (order == null) return false;
            
            // 用户只能取消待付款状态的订单
            if (order.Status != OrderStatus.Pending)
            {
                throw new InvalidOperationException("只能取消待付款的订单");
            }
            
            // 恢复库存
            foreach (var item in order.Items)
            {
                await _context.Products
                    .Where(p => p.Id == item.ProductId && p.Stock != -1)
                    .ExecuteUpdateAsync(s => s.SetProperty(
                        p => p.Stock,
                        p => p.Stock + item.Quantity
                    ));
            }
            
            order.Status = OrderStatus.Cancelled;
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            _logger.LogInformation("用户取消订单: {OrderNo}, UserId: {UserId}", order.OrderNo, userId);
            
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    
    // --- 管理员 API ---
    
    public async Task<(List<OrderAdminDto> Orders, int TotalCount)> GetAllOrdersAsync(int page, int pageSize)
    {
        var query = _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.Items)
                .ThenInclude(oi => oi.Product)
            .OrderByDescending(o => o.CreatedAt);
        
        var totalCount = await query.CountAsync();
        
        var orders = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        
        var dtos = orders.Select(o => new OrderAdminDto(
            o.Id,
            o.OrderNo,
            o.Status.ToString(),
            o.TotalAmount,
            o.CreatedAt,
            o.PaidAt,
            o.CompletedAt,
            o.UserId,
            o.User.Username,
            o.User.Email,
            o.Items.Select(oi => new OrderItemDto(
                oi.ProductId,
                oi.ProductName,
                oi.Price,
                oi.Quantity,
                oi.Product.DownloadUrl,
                oi.Product.RedeemCode
            )).ToList()
        )).ToList();
        
        return (dtos, totalCount);
    }
    
    public async Task<bool> CancelOrderAsync(int orderId)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderId);
            
            if (order == null) return false;
            
            if (order.Status == OrderStatus.Completed)
            {
                throw new InvalidOperationException("已完成的订单无法取消");
            }
            
            // 恢复库存（如果订单未付款或已付款但需要退款）
            foreach (var item in order.Items)
            {
                await _context.Products
                    .Where(p => p.Id == item.ProductId && p.Stock != -1)
                    .ExecuteUpdateAsync(s => s.SetProperty(
                        p => p.Stock,
                        p => p.Stock + item.Quantity
                    ));
            }
            
            order.Status = OrderStatus.Cancelled;
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            _logger.LogInformation("订单已取消: {OrderNo}", order.OrderNo);
            
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    
    // --- 私有方法 ---
    
    /// <summary>
    /// 生成订单号：ORD + 年月日时分秒 + 6位随机字符
    /// </summary>
    private static string GenerateOrderNo()
    {
        return $"ORD{DateTime.UtcNow:yyyyMMddHHmmss}{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
    }
    
    /// <summary>
    /// 映射订单到 DTO
    /// </summary>
    /// <param name="order">订单实体</param>
    /// <param name="showSensitiveInfo">是否显示敏感信息（下载链接/兑换码）</param>
    private static OrderDto MapToDto(Order order, bool showSensitiveInfo)
    {
        return new OrderDto(
            order.Id,
            order.OrderNo,
            order.Status.ToString(),
            order.TotalAmount,
            order.CreatedAt,
            order.PaidAt,
            order.CompletedAt,
            order.Items.Select(oi => new OrderItemDto(
                oi.ProductId,
                oi.ProductName,
                oi.Price,
                oi.Quantity,
                // 条件可见性：只有 showSensitiveInfo 为 true 时才返回敏感信息
                showSensitiveInfo ? oi.Product?.DownloadUrl : null,
                showSensitiveInfo ? oi.Product?.RedeemCode : null
            )).ToList()
        );
    }
}
