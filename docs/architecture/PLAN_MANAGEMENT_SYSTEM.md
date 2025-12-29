# 📅 计划管理系统 (Plan Management System) v1.2

> 用于管理旅行计划、活动安排和惊喜行程的完整解决方案。

## 1. 概述

计划管理系统是 MyNextBlog 的扩展模块，专为管理多日行程、预算追踪和秘密惊喜设计。v1.1 版本重点加强了情侣互动体验（惊喜弹窗、公开预览页）和后台易用性（活动编辑、快捷入口）。

## 2. 核心实体

### 2.1 数据模型

```text
Plan (计划)
├── PlanDay (日程) 1:N
│   └── PlanActivity (活动) 1:N
└── Anniversary (纪念日) N:1 (可选关联)
```

### 2.2 字段说明

| 实体             | 字段                                | 说明       |
| ---------------- | ----------------------------------- | ---------- |
| **Plan**         | Title, Type, StartDate, EndDate     | 基本信息   |
|                  | Budget, ActualCost, Currency        | 预算追踪   |
|                  | Status (draft/confirmed/completed)  | 状态机     |
|                  | IsSecret, ReminderDays              | 惊喜与提醒 |
| **PlanDay**      | DayNumber, Date, Theme              | 日程定义   |
| **PlanActivity** | Title, Location, StartTime, EndTime | 活动详情   |
|                  | EstimatedCost, ActualCost, Notes    | 花费追踪   |

## 3. 功能特性与用户流程

### 3.1 惊喜计划 (Surprise Plan)

专为情侣设计的“秘密旅行”功能。

- **创建流程**：后台创建计划时勾选 `IsSecret`。
- **揭晓流程**：
  1. 用户访问计划详情页（Admin `/admin/plans/[id]` 或 Public `/plan/[id]`）。
  2. 系统检测 `localStorage` 中是否存在 `surprise_viewed_{id}` 标记。
  3. 若未标记，触发全屏 `SurpriseReveal` 组件：
     - 背景模糊 + 礼盒动画。
     - 自动播放彩带特效 (`canvas-confetti`)。
     - 点击关闭后，通过 `localStorage` 记录已查看，后续不再弹出。

### 3.2 纪念日联动 (Anniversary Integration)

- **入口**：在纪念日管理页 (`/admin/settings/anniversaries`)。
- **流程**：
  1. 点击纪念日卡片右下角的 `<CalendarPlus>` 按钮。
  2. 跳转至新建计划页，URL 携带 `?anniversaryId=X` 参数。
  3. 新建表单自动选中对应的纪念日，方便快速创建周年旅行计划。

### 3.3 公开预览页 (Public Preview) v1.2

专为移动端优化的只读行程展示页，同时适配桌面端宽屏体验。

- **路径**：`/plan/[id]`
- **特性**：
  - **沉浸式宽屏布局**：桌面端采用 `max-w-5xl` 宽屏布局，提供更有呼吸感的阅读体验。
  - **横向时间轴设计**：摒弃拥挤的垂直堆叠，采用横向时间胶囊 (`10:30`)，提升阅读流畅性。
  - **严谨对齐**：采用 Grid 布局确保时间、标题、地点严格垂直对齐，即使无时间信息也有优雅的占位符 (`--:--`)。
  - **情侣友好**：自动隐藏预算、实际花费等敏感信息。
  - **视觉体验**：顶部 Hero 大图 + 倒计时徽章 + 动态问候语。

### 3.4 增强型管理后台 (Admin Dashboard) **[NEW]**

- **双栏仪表盘**：
  - **左侧 (Sticky)**：固定展示基础信息、预算概览图表，随时把控全局。
  - **右侧 (Main)**：专注于日程详情编辑，提供宽敞的操作空间。
- **Glassmorphic Header**：顶部吸附式半透明导航栏，集成标题编辑、状态切换与分享功能。

## 4. API 端点

### 4.1 计划管理 (Admin Only)

| 方法   | 路径                    | 说明                        |
| ------ | ----------------------- | --------------------------- |
| GET    | `/api/admin/plans`      | 获取所有计划列表            |
| GET    | `/api/admin/plans/{id}` | 获取计划详情（含日程/活动） |
| POST   | `/api/admin/plans`      | 创建新计划                  |
| PUT    | `/api/admin/plans/{id}` | 更新计划基本信息            |
| DELETE | `/api/admin/plans/{id}` | 删除计划                    |

### 4.2 日程管理

| 方法   | 路径                             | 说明     |
| ------ | -------------------------------- | -------- |
| POST   | `/api/admin/plans/{planId}/days` | 添加日程 |
| PUT    | `/api/admin/plans/days/{dayId}`  | 更新日程 |
| DELETE | `/api/admin/plans/days/{dayId}`  | 删除日程 |

### 4.3 活动管理

| 方法   | 路径                               | 说明                        |
| ------ | ---------------------------------- | --------------------------- |
| POST   | `/api/admin/activities`            | 添加活动                    |
| PUT    | `/api/admin/activities/{id}`       | 更新活动 (含实际花费、备注) |
| DELETE | `/api/admin/activities/{id}`       | 删除活动                    |
| PATCH  | `/api/admin/activities/batch-sort` | **[NEW]** 批量更新活动排序  |

### 4.4 公开访问 (Public)

| 方法 | 路径                     | 说明                        | 权限限制 |
| ---- | ------------------------ | --------------------------- | -------- |
| GET  | `/api/plans/{id}/public` | 获取公开详情 (自动隐藏预算) | 无需登录 |

## 5. 前端页面架构

### 5.1 页面路由

| 路由                            | 类型   | 说明                        |
| ------------------------------- | ------ | --------------------------- |
| `/admin/plans`                  | Admin  | 计划列表卡片                |
| `/admin/plans/new`              | Admin  | 新建计划表单 (支持关联参数) |
| `/admin/plans/[id]`             | Admin  | 核心编辑页 (日历/预算/活动) |
| `/admin/settings/anniversaries` | Admin  | 纪念日管理 (含创建计划入口) |
| `/plan/[id]`                    | Public | **[NEW]** 移动端行程预览页  |

### 5.2 关键组件

| 组件               | 路径               | 功能说明                               |
| ------------------ | ------------------ | -------------------------------------- |
| `PlanCalendarView` | `components/plan/` | 日历视图，修复了时区导致的日期高亮 bug |
| `BudgetChart`      | `components/plan/` | 预算 vs 实际花费对比图表               |
| `SurpriseReveal`   | `components/plan/` | 惊喜揭晓全屏弹窗                       |
| `MarkdownEditor`   | `components/`      | 支持图片上传的编辑器 (改为 toast 提示) |
| `AlertDialog`      | `components/ui/`   | 用于所有危险操作的二次确认             |

## 6. 技术实现细节

### 6.1 状态管理

- **Activity Editing**: 使用 `editingActivityId` (number) 和 `editingActivity` (object) state 实现行内编辑。
- **Optimistic UI**: 删除/更新操作先更新本地 state，再等待 API 响应，提升操作流畅度。

### 6.2 UI 交互规范

- **弹窗统一**：废弃原生的 `window.confirm` 和 `window.alert`，全面替换为 Shadcn UI 的 `<AlertDialog>` 和 `sonner` 的 `toast`。
- **移动端适配**：
  - Admin 表格在移动端自动切换为卡片视图。
  - 预览页采用垂直单列布局，适合手机单手操作。

### 6.3 邮件提醒

- **触发时机**：后台 `AnniversaryReminderHostedService` 每天 08:00 检查
- **提醒规则**：根据 `ReminderDays` 字段设置（如 "7,3,1" = 提前 7/3/1 天提醒）
- **去重机制**：通过 `PlanNotification` 表记录已发送提醒
- **邮件模板**：使用独立的 `AnniversaryReminder` 模板，支持动态替换计划名称和天数

### 6.4 安全架构 (Security & Privacy)

- **数据隔离 (DTO Projection)**：
  - 为了彻底防止敏感数据泄露，后端并未直接复用 `PlanDetailDto`。
  - 专门定义了 `PublicPlanDetailDto`，**物理上剔除**了 `EstimatedCost`, `ActualCost`, `Budget` 等字段。
  - 即使前端通过开发者工具查看 API 响应，也绝对无法获取任何金额数据。
- **匿名访问控制**：
  - `PlansPublicController` 显式标记 `[AllowAnonymous]`。
  - 配合 Next.js 的通用代理规则 (`/api/:path*`)，实现了无缝的公开访问体验。

### 6.5 性能优化 (Performance)

- **批量排序 (Batch Sort)**：
  - **问题**：传统拖拽排序对 N 个元素会触发 N 次 HTTP 请求，导致数据库连接池耗尽和 UI 卡顿。
  - **方案**：实现了 `BatchUpdateActivitySortOrderAsync`。
  - **事务性**：使用 `IDbContextTransaction` 确保批量更新的原子性，要么全部成功，要么全部回滚。
  - **效率**：一次 SQL `Update` 也就几毫秒，相比 N 次网络往返提升了 100 倍以上性能。
- **乐观更新 (Optimistic UI)**：
  - 前端拖拽结束 (`onDragEnd`) 时，立即修改本地 React State，用户感觉是"瞬间"完成的。
  - 随后在后台异步发送 API 请求。如果请求失败，自动回滚 State 并提示错误。

### 6.6 前端交互细节

- **拖拽库选型**：使用 `@dnd-kit/core` + `@dnd-kit/sortable`。
  - **交互微调**：配置了 `PointerSensor` 和 `TouchSensor`，并设置了 5px 的移动阈值，防止在移动端滑动页面时误触拖拽。
- **分享机制**：
  - 利用 `navigator.clipboard.writeText` 实现一键复制。
  - 配合 `sonner` 的富文本 Toast，给予用户明确的反馈（"敏感信息已隐藏"）。

## 7. 后续优化规划

- [x] **日程拖拽排序** (`dnd-kit`): 支持通过拖拽调整活动顺序。
- [ ] **费用分摊 (Split Bill)**: 多人旅行时的费用计算器。
- [ ] **地图集成 (Map View)**:在此地图上通过标记点显示每日行程路径。
- [ ] **PDF 导出**: 生成纸质版行程单用于签证或备份。

---

_Last Updated: 2025-12-29 (v1.1)_
