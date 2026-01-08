// ============================================================================
// backend.Tests/Services/OrderServiceTests.cs - OrderService 单元测试
// ============================================================================
// 测试 OrderService 的核心功能：订单创建、库存扣减、支付流程、订单取消。
// 使用 SQLite 内存数据库以支持事务和 ExecuteUpdate。
// **注意**: 每个测试使用独立数据库连接，避免并发和数据污染问题。

using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Services;
using MyNextBlog.Services.Payment;

namespace backend.Tests.Services;

/// <summary>
/// OrderService 单元测试
/// 每个测试使用独立的 SQLite 内存数据库连接
/// </summary>
public class OrderServiceTests
{
    /// <summary>
    /// 创建独立的测试上下文
    /// </summary>
    private static (SqliteConnection Connection, AppDbContext Context, OrderService Service, Mock<IPaymentGateway> PaymentGateway) CreateTestContext()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;
        
        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        
        var mockPaymentGateway = new Mock<IPaymentGateway>();
        var mockNotificationService = new Mock<IOrderNotificationService>();
        var mockLogger = new Mock<ILogger<OrderService>>();
        
        // 创建 ServiceScopeFactory Mock，用于后台任务中的 DI
        var mockServiceScope = new Mock<IServiceScope>();
        var mockServiceProvider = new Mock<IServiceProvider>();
        mockServiceProvider.Setup(p => p.GetService(typeof(AppDbContext))).Returns(context);
        mockServiceProvider.Setup(p => p.GetService(typeof(IOrderNotificationService))).Returns(mockNotificationService.Object);
        mockServiceScope.Setup(s => s.ServiceProvider).Returns(mockServiceProvider.Object);
        
        var mockScopeFactory = new Mock<IServiceScopeFactory>();
        mockScopeFactory.Setup(f => f.CreateScope()).Returns(mockServiceScope.Object);

        // 默认支付网关返回成功
        mockPaymentGateway.Setup(p => p.ProcessPaymentAsync(It.IsAny<Order>()))
            .ReturnsAsync(new PaymentResult(true, "TXN-" + Guid.NewGuid().ToString("N")[..8].ToUpper(), null));
        
        var service = new OrderService(
            context, 
            mockLogger.Object,
            mockPaymentGateway.Object,
            mockScopeFactory.Object);
        
        // 播种测试数据
        SeedTestData(context);
        
        return (connection, context, service, mockPaymentGateway);
    }

    private static void SeedTestData(AppDbContext context)
    {
        // 创建测试用户
        var user = new User
        {
            Id = 1,
            Username = "testuser",
            PasswordHash = "hash",
            Email = "test@test.com"
        };
        context.Users.Add(user);

        // 创建测试商品
        context.Products.AddRange(
            new Product
            {
                Id = 1,
                Name = "电子书 A",
                Description = "描述",
                Price = 29.99m,
                Stock = 10,
                IsActive = true,
                DownloadUrl = "https://example.com/ebook-a.pdf",
                RedeemCode = "EBOOK-A-123"
            },
            new Product
            {
                Id = 2,
                Name = "电子书 B",
                Description = "描述",
                Price = 19.99m,
                Stock = 5,
                IsActive = true
            },
            new Product
            {
                Id = 3,
                Name = "售罄商品",
                Description = "描述",
                Price = 9.99m,
                Stock = 0, // 已售罄
                IsActive = true
            },
            new Product
            {
                Id = 4,
                Name = "无限库存",
                Description = "描述",
                Price = 49.99m,
                Stock = -1, // 无限库存
                IsActive = true
            },
            new Product
            {
                Id = 5,
                Name = "下架商品",
                Description = "描述",
                Price = 99.99m,
                Stock = 100,
                IsActive = false // 已下架
            }
        );

        context.SaveChanges();
    }

    // ========== 创建订单测试 ==========

    [Fact]
    public async Task CreateOrderAsync_ShouldCreateOrder_WithCorrectTotalAmount()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput>
                {
                    new(ProductId: 1, Quantity: 2), // 29.99 * 2 = 59.98
                    new(ProductId: 2, Quantity: 1)  // 19.99 * 1 = 19.99
                },
                Remark: "测试订单"
            );

            var order = await service.CreateOrderAsync(1, dto);
            await Task.Delay(100); // 等待异步邮件任务

            order.Should().NotBeNull();
            order.TotalAmount.Should().Be(79.97m);
            order.Status.Should().Be("Pending");
            order.Items.Should().HaveCount(2);
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task CreateOrderAsync_ShouldDeductStock()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(ProductId: 1, Quantity: 3) },
                Remark: null
            );

            await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);

            // 使用 AsNoTracking 获取最新数据
            var product = await context.Products.AsNoTracking().FirstAsync(p => p.Id == 1);
            product.Stock.Should().Be(7); // 10 - 3 = 7
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task CreateOrderAsync_ShouldNotDeductStock_WhenInfinite()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(ProductId: 4, Quantity: 100) },
                Remark: null
            );

            await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);

            var product = await context.Products.AsNoTracking().FirstAsync(p => p.Id == 4);
            product.Stock.Should().Be(-1);
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task CreateOrderAsync_ShouldThrow_WhenStockInsufficient()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(ProductId: 1, Quantity: 100) },
                Remark: null
            );

            var action = async () => await service.CreateOrderAsync(1, dto);

            await action.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*库存不足*");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task CreateOrderAsync_ShouldThrow_WhenProductSoldOut()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(ProductId: 3, Quantity: 1) },
                Remark: null
            );

            var action = async () => await service.CreateOrderAsync(1, dto);

            await action.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*库存不足*");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task CreateOrderAsync_ShouldThrow_WhenProductNotActive()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(ProductId: 5, Quantity: 1) },
                Remark: null
            );

            var action = async () => await service.CreateOrderAsync(1, dto);

            await action.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*不存在或已下架*");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task CreateOrderAsync_ShouldGenerateUniqueOrderNo()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(1, 1) },
                Remark: null
            );

            var order1 = await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);
            var order2 = await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);

            order1.OrderNo.Should().NotBe(order2.OrderNo);
            order1.OrderNo.Should().StartWith("ORD");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    // ========== 获取订单测试 ==========

    [Fact]
    public async Task GetUserOrdersAsync_ShouldReturnOnlyUserOrders()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(1, 1) },
                Remark: null
            );
            
            await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);
            await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);

            var orders = await service.GetUserOrdersAsync(1);

            orders.Should().HaveCount(2);
            orders.Should().AllSatisfy(o => o.Items.Should().NotBeEmpty());
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task GetOrderByIdAsync_ShouldReturnNull_WhenNotBelongToUser()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(1, 1) },
                Remark: null
            );
            var order = await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);

            var result = await service.GetOrderByIdAsync(order.Id, 2);

            result.Should().BeNull();
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    // ========== 支付流程测试 ==========

    [Fact]
    public async Task ProcessPaymentAsync_ShouldUpdateOrderStatus()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(1, 1) },
                Remark: null
            );
            var order = await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);

            var paidOrder = await service.ProcessPaymentAsync(order.Id, 1);
            await Task.Delay(100);

            paidOrder.Should().NotBeNull();
            paidOrder!.Status.Should().Be("Paid");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task ProcessPaymentAsync_ShouldRevealSensitiveInfo()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(1, 1) },
                Remark: null
            );
            var order = await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);

            var paidOrder = await service.ProcessPaymentAsync(order.Id, 1);
            await Task.Delay(100);

            var item = paidOrder!.Items.First();
            item.DownloadUrl.Should().Be("https://example.com/ebook-a.pdf");
            item.RedeemCode.Should().Be("EBOOK-A-123");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task ProcessPaymentAsync_ShouldThrow_WhenAlreadyPaid()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(1, 1) },
                Remark: null
            );
            var order = await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);
            await service.ProcessPaymentAsync(order.Id, 1);
            await Task.Delay(100);

            var action = async () => await service.ProcessPaymentAsync(order.Id, 1);

            await action.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*订单状态不允许付款*");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    // ========== 确认收货测试 ==========

    [Fact]
    public async Task ConfirmReceiptAsync_ShouldChangeStatus()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(1, 1) },
                Remark: null
            );
            var order = await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);
            await service.ProcessPaymentAsync(order.Id, 1);
            await Task.Delay(100);

            var success = await service.ConfirmReceiptAsync(order.Id, 1);

            success.Should().BeTrue();
            var updatedOrder = await context.Orders.AsNoTracking().FirstAsync(o => o.Id == order.Id);
            updatedOrder.Status.Should().Be(OrderStatus.Completed);
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task ConfirmReceiptAsync_ShouldThrow_WhenNotPaid()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(1, 1) },
                Remark: null
            );
            var order = await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);

            // 未支付就确认收货会抛出异常
            var action = async () => await service.ConfirmReceiptAsync(order.Id, 1);

            await action.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*订单状态不允许确认收货*");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    // ========== 取消订单测试 ==========

    [Fact]
    public async Task CancelOrderAsync_ShouldRestoreStock()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(1, 3) },
                Remark: null
            );
            var order = await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);
            var stockAfterOrder = (await context.Products.AsNoTracking().FirstAsync(p => p.Id == 1)).Stock;

            var success = await service.CancelOrderAsync(order.Id);

            success.Should().BeTrue();
            var product = await context.Products.AsNoTracking().FirstAsync(p => p.Id == 1);
            product.Stock.Should().Be(stockAfterOrder + 3);
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task CancelOrderAsync_ShouldNotRestoreStock_WhenInfinite()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(4, 5) },
                Remark: null
            );
            var order = await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);

            await service.CancelOrderAsync(order.Id);

            var product = await context.Products.AsNoTracking().FirstAsync(p => p.Id == 4);
            product.Stock.Should().Be(-1);
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task CancelOrderAsync_ShouldThrow_WhenCompleted()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(1, 1) },
                Remark: null
            );
            var order = await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);
            await service.ProcessPaymentAsync(order.Id, 1);
            await Task.Delay(100);
            await service.ConfirmReceiptAsync(order.Id, 1);

            // 已完成的订单取消会抛出异常
            var action = async () => await service.CancelOrderAsync(order.Id);

            await action.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*已完成的订单无法取消*");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    // ========== 管理员 API 测试 ==========

    [Fact]
    public async Task GetAllOrdersAsync_ShouldReturnAllOrders()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new CreateOrderDto(
                Items: new List<OrderItemInput> { new(1, 1) },
                Remark: null
            );
            await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);
            await service.CreateOrderAsync(1, dto);
            await Task.Delay(100);

            var (orders, totalCount) = await service.GetAllOrdersAsync(1, 10);

            totalCount.Should().Be(2);
            orders.Should().HaveCount(2);
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }
}
