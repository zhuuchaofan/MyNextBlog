# 邮件系统架构与迁移方针

> **最后更新**: 2026-01-08

---

## 1. 当前架构

### 1.1 组件关系

```
┌──────────────────────┐     ┌───────────────────────┐     ┌─────────────────┐
│   业务服务            │ ──▶ │   通知服务             │ ──▶ │  SmtpEmailService│
│  (OrderService)      │     │ (OrderNotificationSvc) │     │  (IEmailService) │
└──────────────────────┘     └───────────────────────┘     └─────────────────┘
         │                              │
         │ Task.Run()                   │ 模板渲染
         ▼                              ▼
   后台异步执行              EmailTemplateService
```

### 1.2 邮件发送场景

| 模块                           | 邮件类型   | 触发时机             | 模板 Key               |
| ------------------------------ | ---------- | -------------------- | ---------------------- |
| **OrderNotificationService**   | 订单创建   | 下单成功             | `order_created`        |
| **OrderNotificationService**   | 订单完成   | 付款成功             | `order_completed`      |
| **CommentNotificationService** | 新评论通知 | 收到评论             | `new_comment`          |
| **CommentNotificationService** | 敏感词审核 | 触发敏感词           | `spam_comment`         |
| **CommentNotificationService** | 回复通知   | 被回复               | `reply_notification`   |
| **AnniversaryReminderService** | 纪念日提醒 | 定时任务 (00:00 UTC) | `anniversary_reminder` |
| **PlanReminderService**        | 计划提醒   | 定时任务             | `plan_reminder`        |

### 1.3 核心接口

```csharp
// Services/Email/IEmailService.cs
public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody);
}

// Services/IOrderNotificationService.cs
public interface IOrderNotificationService
{
    Task SendOrderCreatedEmailAsync(Order order);
    Task SendOrderCompletedEmailAsync(Order order);
}
```

---

## 2. 已知问题 (已修复)

### 2.1 DbContext 释放问题 ✅

**问题**: `Task.Run` 后台任务中 `DbContext` 被释放
**错误**: `ObjectDisposedException: Cannot access a disposed context instance`
**解决**: 使用 `IServiceScopeFactory` 创建独立 DI Scope

```csharp
// 修复后的代码模式
_ = Task.Run(async () =>
{
    using var scope = _scopeFactory.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var notificationService = scope.ServiceProvider.GetRequiredService<IOrderNotificationService>();
    // ...
});
```

---

## 3. Azure Function 迁移方针

### 3.1 目标架构

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  业务服务     │ ──▶ │  Azure Queue    │ ──▶ │  Azure Function  │
│ (OrderService)│     │ Storage Queue   │     │  (EmailSender)   │
└──────────────┘     └─────────────────┘     └──────────────────┘
                                                      │
                                                      ▼
                                              ┌─────────────────┐
                                              │   SMTP / Azure  │
                                              │ Communication   │
                                              └─────────────────┘
```

### 3.2 迁移阶段

| 阶段        | 内容                           | 预估工时 |
| ----------- | ------------------------------ | -------- |
| **Phase 1** | 创建 `IEmailQueueService` 接口 | 0.5 天   |
| **Phase 2** | 实现 Azure Queue 发送逻辑      | 1 天     |
| **Phase 3** | 创建 Azure Function 项目       | 1 天     |
| **Phase 4** | 替换现有 `Task.Run` 调用       | 0.5 天   |

### 3.3 Phase 1: 接口抽象

```csharp
// Services/IEmailQueueService.cs
public interface IEmailQueueService
{
    Task EnqueueAsync(EmailMessage message);
}

public record EmailMessage(
    string To,
    string Subject,
    string Body,
    string? TemplateKey = null,
    Dictionary<string, string>? Data = null
);
```

### 3.4 Phase 2: Azure Queue 实现

```csharp
// Services/AzureEmailQueueService.cs
public class AzureEmailQueueService : IEmailQueueService
{
    private readonly QueueClient _queueClient;

    public async Task EnqueueAsync(EmailMessage message)
    {
        var json = JsonSerializer.Serialize(message);
        await _queueClient.SendMessageAsync(
            Base64Encode(json)
        );
    }
}
```

### 3.5 Phase 3: Function 处理

```csharp
// AzureFunctions/EmailSenderFunction.cs
public class EmailSenderFunction
{
    [FunctionName("SendEmail")]
    public async Task Run(
        [QueueTrigger("email-queue")] string message,
        ILogger log)
    {
        var email = JsonSerializer.Deserialize<EmailMessage>(message);
        await _smtpService.SendAsync(email.To, email.Subject, email.Body);
    }
}
```

---

## 4. 配置说明

### 4.1 当前 SMTP 配置

```json
// appsettings.json
{
  "SmtpSettings": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Username": "your-email@gmail.com",
    "Password": "app-specific-password",
    "FromEmail": "noreply@yourdomain.com",
    "FromName": "MyNextBlog"
  }
}
```

### 4.2 未来 Azure 配置 (预留)

```json
{
  "AzureQueue": {
    "ConnectionString": "...",
    "QueueName": "email-queue"
  },
  "AzureCommunication": {
    "ConnectionString": "..."
  }
}
```

---

## 5. 测试策略

| 类型         | 说明                               |
| ------------ | ---------------------------------- |
| **单元测试** | Mock `IEmailService`，验证调用参数 |
| **集成测试** | 使用 MailHog 本地 SMTP 服务器      |
| **E2E 测试** | 手动验证邮件内容格式               |
