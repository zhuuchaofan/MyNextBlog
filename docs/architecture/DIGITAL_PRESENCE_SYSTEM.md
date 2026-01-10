# 🚀 Digital Presence (数字分身) 系统架构

## 1. 核心目标 (Core Objective)

打造一个**全自动化的站长状态感知系统**。该系统作为博客后台的“数字管家”，全天候通过第三方 API 监测站长在互联网上的活动（写代码、玩游戏、听歌），并实时在博客前端展示，赋予静态博客以“生命感”。

---

## 2. 功能需求 (Functional Requirements)

### 2.1 自动状态感知 (Auto-Detection)

系统需支持以下数据源的轮询与状态映射：

- **WakaTime**: 监测 IDE 活动（VS Code/Visual Studio）。如果最近 15 分钟有心跳，视为 **Coding**。
- **Steam**: 监测游戏状态。如果 `gameextrainfo` 不为空，视为 **Gaming**。
- **Spotify** (可选/从长计议): 监测音乐播放。如果 `is_playing` 为 true，视为 **Listening**。
- **Offline**: 当上述服务均无活动时，显示离线状态及最后活跃时间。

### 2.2 智能决策引擎 (Priority & Logic)

当多个状态同时存在时（如边听歌边写代码），需执行优先级仲裁：

1. **Manual Override (手动强制)** > **Auto (自动)**
2. **Coding** (最高优) > **Gaming** > **Listening** > **Offline**

### 2.3 自适应轮询 (Adaptive Polling)

- **活跃模式 (Active)**: 状态为在线时，轮询间隔 **30 秒**。
- **待机模式 (Standby)**: 连续离线超过 5 次（2.5 分钟），轮询间隔降级为 **5 分钟**。
- **唤醒机制**: 在待机模式下检测到活动，立即切换回活跃模式。

### 2.4 手动干预 (Manual Override)

- 提供 Admin API 或数据库配置，允许站长强制设定状态（如“闭关中”、“外出摄影”），并设定过期时间。

---

## 3. 技术架构设计 (Technical Architecture)

### 3.1 后端设计 (.NET 10)

利用 ASP.NET Core 的 `BackgroundService` 实现长期运行的后台任务。

- **服务名**: `PresenceService` (Singleton)
- **依赖**:

  - `IHttpClientFactory`: 用于发送 HTTP 请求。
  - `IMemoryCache`: 存储最终计算出的状态（供前端秒开）。
  - `IServiceScopeFactory`: 用于访问数据库（读取 `SiteContents` 表中的 API Keys 和 Override 配置）。

- **数据流**:
  `Third-Party APIs` -> `PresenceService (Fetch & Judge)` -> `IMemoryCache` <- `API Controller` <- `Frontend`

### 3.2 数据库设计 (PostgreSQL)

复用现有的 `SiteContents` 表存储敏感配置 (API Keys) 和手动状态。

| Key                   | Value (Example)                                          | 说明                              |
| --------------------- | -------------------------------------------------------- | --------------------------------- |
| `config_steam_key`    | `123456...`                                              | Steam Web API Key                 |
| `config_steam_id`     | `76561198...`                                            | 你的 Steam ID                     |
| `config_wakatime_key` | `waka_...`                                               | WakaTime API Key (Base64 Encoded) |
| `status_override`     | `{ "status": "busy", "msg": "部署中", "expire": "..." }` | 手动强制状态 (JSON)               |

### 3.3 接口设计 (API)

**Endpoint**: `GET /api/presence`

**Response (JSON)**:

```json
{
  "status": "gaming", // 枚举: coding, gaming, listening, offline, custom
  "icon": "gamepad", // 前端图标标识
  "message": "Playing Black Myth: Wukong", // 展示文本
  "details": "Online for 45 mins", // 辅助信息 (可选)
  "timestamp": "2025-12-18T10:30:00Z" // 最后更新时间
}
```

---

## 4. 实施路线图 (Implementation Roadmap)

### ✅ Phase 1: 基础框架与 Steam

**目标**: 建立后台服务框架，实现 Steam 状态检测和内存缓存。

1. **Model 定义**: 创建 `UserStatusDto` 类。
2. **Service 实现**:
   - 创建 `Services/PresenceService.cs` 继承 `BackgroundService`。
   - 在 `Program.cs` 注册: `builder.Services.AddHostedService<PresenceService>();`
   - 编写 `CheckSteamAsync()` 方法：调用 Steam `GetPlayerSummaries` 接口。
3. **缓存逻辑**: 将结果写入 `_memoryCache`。
4. **API 暴露**: 创建 `Controllers/Api/PresenceController.cs`，读取缓存并返回。

### ✅ Phase 2: 完整感知与自适应

**目标**: 接入 WakaTime，实现优先级逻辑和自适应频率。

1. **WakaTime 接入**:
   - 编写 `CheckWakaTimeAsync()`: 调用 `https://wakatime.com/api/v1/users/current/status_bar/today`。
   - 使用 HTTP Basic Auth 认证 (`Authorization: Basic {base64(api_key:)}`)。
2. **仲裁逻辑**:
   - 优先级: Manual Override > Coding > Gaming > Offline
3. **管理配置**:
   - Admin 后台提供 WakaTime API Key 配置 UI。

### ✅ Phase 3: 前端组件与手动控制

**目标**: 在 Next.js 前端展示酷炫的 UI，并支持手动覆盖。

1. **UI 组件**:
   - **`StatusBadge.tsx`**: 通用状态徽章组件，根据状态渲染图标/颜色/呼吸灯
   - **`UserPresenceWidget.tsx`**: 导航栏状态展示组件
     - 桌面端：始终显示文本，超过 8 字符自动跑马灯滚动
     - 移动端：仅显示图标，点击弹出 Popover 显示完整状态
   - 使用 `framer-motion` 实现动画效果
   - 使用 shadcn/ui `Popover` 组件
2. **手动控制 (后台)**:
   - `/admin/settings/presence` 配置页
   - 实时状态预览 + JSON 调试面板
   - 手动覆盖 UI：状态选择 / 消息输入 / 过期时间
   - 每个 API Key 独立编辑/完成按钮，修改即存
