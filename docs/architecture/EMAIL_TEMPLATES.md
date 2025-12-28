# 📧 邮件模板管理系统

> 本文档记录邮件模板管理系统的技术实现细节。

---

## 1. 系统概述

邮件模板管理系统允许管理员通过后台 UI 编辑系统发送的邮件内容，无需修改代码即可自定义邮件样式。

### 核心特性

- **数据库存储**：模板存储在 PostgreSQL 的 `EmailTemplates` 表中
- **实时预览**：编辑时通过 sandboxed iframe 实时预览邮件效果
- **占位符系统**：支持 `{{PlaceholderName}}` 动态内容替换
- **缓存优化**：30 分钟内存缓存，减少数据库访问

---

## 2. 架构设计

### 2.1 数据流

```
用户编辑模板 → 前端提交 → EmailTemplatesController
    → EmailTemplateService.UpdateAsync() → 清除缓存 → 保存到数据库

发送邮件时：
CommentService/AnniversaryReminderService
    → EmailTemplateService.RenderAsync()
    → 从缓存或数据库获取模板 → 替换占位符 → 返回渲染后的邮件内容
```

### 2.2 文件结构

````
backend/
├── Models/
│   └── EmailTemplate.cs          # 实体模型
├── DTOs/
│   └── EmailTemplateDtos.cs      # DTO 定义
├── Services/
│   ├── IEmailTemplateService.cs  # 服务接口
│   └── EmailTemplateService.cs   # 服务实现（含缓存）
├── Controllers/Admin/
│   └── EmailTemplatesController.cs  # Admin API &lt;-- 已移动
└── Extensions/
    └── DataSeeder.cs             # 默认模板播种

---

## 4. 默认模板

| TemplateKey            | 名称           | 触发场景       | 占位符                                                                  |
| :--------------------- | :------------- | :------------- | :---------------------------------------------------------------------- |
| `new_comment`          | 新评论通知     | 文章收到新评论 | PostTitle, Content, GuestName, PostId, CommentId, AppUrl                |
| `spam_comment`         | 敏感词审核通知 | 评论触发敏感词 | PostTitle, Content, GuestName, AppUrl                                   |
| `reply_notification`   | 回复通知       | 评论被回复     | RecipientName, PostTitle, Content, GuestName, PostId, CommentId, AppUrl |
| `anniversary_reminder` | 纪念日提醒     | 纪念日临近     | Title, Emoji, TargetDate, StartDate, DaysBefore, DaysTotal              |

---

## 5. API 端点

### GET /api/admin/email-templates

获取所有模板列表（Admin Only）

**响应示例**：

```json
[
  {
    "id": 1,
    "templateKey": "new_comment",
    "name": "新评论通知",
    "subjectTemplate": "💬 [新评论] {{PostTitle}}",
    "bodyTemplate": "<div>...</div>",
    "availablePlaceholders": "{\"PostTitle\":\"文章标题\"}",
    "description": "当文章收到新评论时，发送邮件通知站长",
    "isEnabled": true,
    "updatedAt": "2025-12-28T10:00:00Z"
  }
]
````

### PUT /api/admin/email-templates/{key}

更新模板内容（Admin Only）

---

## 6. 前端实现

### 6.1 预览机制

使用 sandboxed iframe 渲染 HTML 预览，确保安全：

```tsx
<iframe
  srcDoc={renderedHtml}
  sandbox="allow-same-origin"
  className="w-full h-80 bg-white"
/>
```

---

## 7. 安全考量

| 风险       | 缓解措施                                     |
| :--------- | :------------------------------------------- |
| XSS 攻击   | iframe 使用 `sandbox="allow-same-origin"`    |
| 未授权访问 | 所有 API 添加 `[Authorize(Roles = "Admin")]` |
| SQL 注入   | EF Core 参数化查询（默认行为）               |
| 缓存污染   | 更新后立即清除对应缓存 Key                   |

---

## 8. 升级指南

### 从硬编码模板迁移

1. 运行数据库迁移：`dotnet ef database update`
2. 启动后端，`DataSeeder` 会自动播种默认模板
3. **安全播种策略 (Upsert)**:
   - 如果模板不存在 -> **插入**
   - 如果模板已存在 -> **仅更新** `Description` 和 `AvailablePlaceholders` (元数据)
   - **绝不覆盖** 用户自定义的 `Subject` 和 `Body`

### 添加新模板类型

1. 在 `DataSeeder.SeedEmailTemplates()` 中添加新模板
2. 在对应的 Service 中调用 `EmailTemplateService.RenderAsync()`
3. 定义 Mock 数据用于前端预览

---

_最后更新：2025-12-28_
