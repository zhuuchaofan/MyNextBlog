# 📧 邮件发送系统架构 (Email Delivery System)

## 1. 系统概览

邮件发送系统是 MyNextBlog 的核心基础设施之一，负责处理系统产生的各类通知，包括评论通知、反垃圾提醒、纪念日提醒等。该系统采用了**模板化内容生成**与**异步发送**相结合的设计，确保高性能与可维护性。

## 2. 关键组件

### 2.1 服务层 (Services)

| 服务名称                       | 接口                          | 职责                                                                                                                 |
| :----------------------------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **SmtpEmailService**           | `IEmailService`               | 底层发送器。封装 SMTP 协议，处理与外部邮件服务器 (e.g., Gmail) 的通信。包含重试机制。                                |
| **EmailTemplateService**       | `IEmailTemplateService`       | 模板引擎。负责加载数据库中的模板，并执行占位符替换 (Render)。                                                        |
| **CommentNotificationService** | `ICommentNotificationService` | ✨ **新增 (2026-01 重构)**。负责评论相关的所有邮件通知（新评论、回复、审核）。从 CommentService 分离而来，遵循 SRP。 |
| **CommentService**             | `ICommentService`             | 评论管理。在评论创建流程中通过 Fire-and-Forget 模式调用 CommentNotificationService。                                 |
| **AnniversaryReminderService** | `IAnniversaryReminderService` | 触发器。定时检查纪念日并发送提醒。                                                                                   |

### 2.2 配置 (Configuration)

配置位于 `appsettings.json` 的 `SmtpSettings` 节点：

```json
"SmtpSettings": {
  "Host": "smtp.gmail.com",       // SMTP 服务器地址
  "Port": 587,                    // 端口 (通常 587 TLS)
  "SenderEmail": "...",           // 发件人邮箱
  "SenderPassword": "...",        // 应用专用密码 (App Password)
  "EnableSsl": true,              // 是否启用 SSL
  "AdminEmail": "..."             // 站长接收通知的邮箱
}
```

## 3. 发送流程 (Workflows)

### 3.1 评论通知流程 (Comment Notifications)

此流程为 **"Fire-and-Forget" (即发即忘)** 模式，不在此请求的主路径中同步等待邮件发送，以免阻塞用户发表评论的响应速度。

1.  **用户提交评论**: `CommentService.CreateCommentAsync` 被调用。
2.  **数据持久化**: 评论写入数据库。
3.  **触发后台任务**: 使用 `Task.Run` 启动异步任务。
4.  **作用域创建**: 创建新的 `IServiceScope` 以解析 `ICommentNotificationService` (保证 Scoped 服务的正确生命周期)。 ✨ **重构后**
5.  **调用通知服务**: `CommentNotificationService.SendNotificationsAsync(commentId)` 负责所有通知逻辑。 ✨ **重构后**
6.  **数据加载**: 内部使用 `Include` 一次性加载关联数据 (Post, User, ParentComment)。
7.  **逻辑判断**:
    - **垃圾评论 (My Spam)**: 如果被拦截且配置了 `AdminEmail`，发送 `spam_comment` 模板给站长。
    - **新评论 (New Comment)**: 正常评论，发送 `new_comment` 模板给站长 (除非站长自己评论)。
    - **回复通知 (Reply)**: 如果是回复某人，发送 `reply_notification` 模板给被回复者。
8.  **发送**: 调用 `IEmailService.SendEmailAsync`。

### 3.2 纪念日提醒流程 (Anniversary Reminders)

此流程通常由 **定时任务 (Background Job)** 触发（当前实现为 API 触发或应用启动时检查，视具体宿主而定，后续建议集成 Quartz.NET 或 Hangfire）。

1.  **任务触发**: `CheckAndSendRemindersAsync` 被调用。
2.  **查询**: 获取所有 `IsActive` 且开启提醒的纪念日。
3.  **计算**: 根据 `RepeatType` (Yearly, Monthly, Once) 计算下一个纪念日日期。
4.  **匹配**: 检查 `ReminderDays` (如 "7,1,0") 是否命中今天。
5.  **防重**: 查询 `AnniversaryNotifications` 表，确认当天、该规则是否已发送过。
6.  **渲染**: 使用 `anniversary_reminder` 模板渲染内容（计算天数、总天数）。
7.  **发送**: 调用 `IEmailService.SendEmailAsync`。
8.  **记录**: 写入发送记录到数据库 (无论成功失败)。

## 4. 可靠性设计 (Resilience)

### 4.1 Polly 重试策略

`SmtpEmailService` 集成了 **Polly** 弹性框架，配置了自动重试机制：

- **最大重试次数**: 3 次
- **退避策略**: 指数退避 (Exponential Backoff)，初始延迟 2 秒。
- **异常捕获**: 捕获所有发送异常，记录 Warning 日志后重试。

### 4.2 错误处理

- **非阻塞**: 评论通知的发送失败仅记录 Error 日志，**不会** 导致评论提交失败或回滚事务。
- **防重发**: 纪念日提醒通过数据库记录状态，确保不因服务重启或重复调用而轰炸用户。

## 5. 模板参数对照表

| 模板 Key               | 必需参数                                                                | 说明                       |
| :--------------------- | :---------------------------------------------------------------------- | :------------------------- |
| `new_comment`          | PostTitle, Content, GuestName, PostId, CommentId, AppUrl                | 通知站长有新评论           |
| `spam_comment`         | PostTitle, Content, GuestName, AppUrl                                   | 通知站长有被拦截的垃圾评论 |
| `reply_notification`   | RecipientName, PostTitle, Content, GuestName, PostId, CommentId, AppUrl | 通知用户收到回复           |
| `anniversary_reminder` | Title, Emoji, TargetDate, StartDate, DaysBefore, DaysTotal              | 纪念日提醒                 |

## 6. 安全性

- **凭证保护**: SMTP 密码不应直接写在代码中，应通过环境变量或 Secret Manager 注入。
- **日志脱敏**: 日志中不记录邮件正文等敏感信息。
- **HTML 转义**: 用户输入的评论内容在存入数据库前经过 `HtmlSanitizer` 清洗，防止 XSS 在邮件客户端执行。
