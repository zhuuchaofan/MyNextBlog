# E2E 测试规范

> **最后更新**: 2026-01-11 (新增登录状态复用架构)

## 1. 快速开始 (Quick Start)

### 运行环境要求

- **Backend**: Docker 容器需运行中 (`docker compose up -d`) 或本地启动 API。
- **Frontend**: 测试会自动连接 `http://localhost:3000` (默认) 或 `E2E_BASE_URL`。

### 常用命令

| 命令                                     | 说明                           |
| :--------------------------------------- | :----------------------------- |
| `npm run test:e2e`                       | 运行所有测试 (Headless 模式)   |
| `npm run test:e2e:ui`                    | 打开交互式测试 UI (推荐调试用) |
| `npm run test:e2e:headed`                | 开启浏览器窗口运行             |
| `npx playwright test --update-snapshots` | 更新视觉回归测试的基准截图     |

## 2. 项目结构 (Project Structure)

```
frontend/
├── playwright.config.ts          # 测试配置 (含 setup 项目)
├── tests/
│   ├── .auth/
│   │   └── admin.json            # 登录状态缓存 (自动生成)
│   ├── utils/
│   │   └── test-helpers.ts       # 共享辅助函数
│   ├── auth.setup.ts             # 全局登录 Setup ⭐
│   ├── visual-regression.spec.ts-snapshots/  # 视觉回归基准截图
│   ├── auth.spec.ts              # 认证测试
│   ├── admin-posts.spec.ts       # 文章管理测试
│   ├── admin-orders.spec.ts      # 订单管理测试
│   └── ...
└── test-results/                 # 测试输出 (失败截图、trace)
```

**命名规范**:

- `*.spec.ts` - 常规测试文件
- `*.setup.ts` - Setup 项目文件 (仅执行一次)

---

## 3. 登录状态复用架构 ⭐ (2026-01 新增)

> [!IMPORTANT]
> 这是本项目最重要的测试架构优化。解决了"每个测试都重复登录导致频率限制"的问题。

### 3.1 架构原理

```
┌─────────────────────────────────────────────────────────────┐
│                    playwright.config.ts                      │
├─────────────────────────────────────────────────────────────┤
│  projects:                                                   │
│    ┌──────────┐                                             │
│    │  setup   │ ← 执行一次，保存 storageState               │
│    └────┬─────┘                                             │
│         │ dependencies                                       │
│    ┌────▼─────┐  ┌──────────┐                               │
│    │ chromium │  │  mobile  │ ← 复用 storageState           │
│    └──────────┘  └──────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 配置方法

**Step 1: 创建 `auth.setup.ts`**

```typescript
// tests/auth.setup.ts
import { test as setup } from "@playwright/test";
import { loginAsAdmin } from "./utils/test-helpers";

const authFile = "tests/.auth/admin.json";

setup("管理员登录", async ({ context }) => {
  const loggedIn = await loginAsAdmin(context);
  if (!loggedIn) {
    throw new Error("管理员登录失败");
  }
  await context.storageState({ path: authFile });
});
```

**Step 2: 配置 `playwright.config.ts`**

```typescript
projects: [
  // 1. Setup 项目 (仅执行一次)
  {
    name: "setup",
    testMatch: /auth\.setup\.ts/,
  },
  // 2. 主测试项目 (依赖 setup)
  {
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      storageState: "tests/.auth/admin.json",
    },
    dependencies: ["setup"],
  },
  // 3. 移动端测试 (同样依赖)
  {
    name: "mobile",
    use: {
      ...devices["iPhone 13"],
      storageState: "tests/.auth/admin.json",
    },
    dependencies: ["setup"],
  },
],
```

### 3.3 使用效果

```
Running 15 tests using 5 workers

  ✓   1 管理员登录 (160ms)        ← 只登录一次
  ✓   5 管理员仪表盘视觉回归      ← 直接复用登录状态
  ✓   8 文章管理页面视觉回归
  ... (15 passed)
```

> [!WARNING] > **常见错误**：使用 `test.describe.configure({ mode: "serial" })` 无法共享登录状态！
> 串行模式只保证顺序执行，每个测试仍有独立 context。必须使用 storageState。

---

## 4. 核心工具

### `tests/utils/test-helpers.ts`

| 工具                            | 用途                                          |
| :------------------------------ | :-------------------------------------------- |
| `loginAsAdmin(context)`         | 通过 BFF 登录，自动检测已登录状态避免重复登录 |
| `loginAndGetToken(request)`     | 通过后端 API 登录，返回 token                 |
| `PageValidator`                 | 页面验证器（详见下方）                        |
| `expectApiSuccess(json)`        | 验证 `{ success: true }`                      |
| `expectPaginatedResponse(json)` | 验证 `{ success, data, meta }`                |
| `E2E_PREFIX`                    | 测试数据前缀 `[E2E_AUTO]`                     |
| `generateTestName(name)`        | 生成带时间戳的测试数据名称                    |
| `getCommonMasks(page)`          | 获取视觉测试常用遮罩定位器                    |
| `VIEWPORTS`                     | 常用视口尺寸 (mobile/tablet/desktop)          |

### PageValidator 使用

```typescript
const validator = new PageValidator(page);
await validator.goto("/admin/comments");

// 必须调用的断言
await validator.expectNoErrors(); // 无 JS 错误
await validator.expectNotErrorPage(); // 非错误页面
await validator.expectTitleContains("评论"); // 标题正确
```

---

## 5. 测试编写规范

### 5.1 始终检测客户端错误

```typescript
// ❌ 错误: 只检查内容
const content = await page.content();
expect(content).toContain("评论");

// ✅ 正确: 使用 PageValidator
const validator = new PageValidator(page);
await validator.goto("/admin/comments");
await validator.expectNoErrors();
await validator.expectNotErrorPage();
```

### 5.2 API 响应验证

```typescript
// ❌ 错误: 手动检查
expect(json.success).toBe(true);

// ✅ 正确: 使用辅助函数
expectPaginatedResponse(json); // 分页响应
expectApiSuccess(json); // 简单响应
```

### 5.3 需要登录的测试

```typescript
// ✅ 依赖 setup 项目后，storageState 自动注入
// 无需在每个测试中调用 loginAsAdmin

test("管理员仪表盘", async ({ page }) => {
  // storageState 已自动加载，直接访问管理页面
  await page.goto("/admin");
  // ...
});

// ⚠️ 如果需要在测试中验证登录状态
test("管理员页面", async ({ page, context }) => {
  const loggedIn = await loginAsAdmin(context);
  if (!loggedIn) {
    test.skip(true, "无法登录");
    return;
  }
  // ...
});
```

### 5.4 视觉回归测试

```typescript
// 使用遮罩处理变动区域 (时间戳、ID 等)
await expect(page).toHaveScreenshot("admin-dashboard.png", {
  fullPage: true,
  mask: getCommonMasks(page),
});
```

**基准截图管理**:

```bash
# 首次运行或 UI 变更后更新基准
npx playwright test --update-snapshots

# 基准截图目录 (已添加到 .gitignore，不提交)
tests/visual-regression.spec.ts-snapshots/
├── home-page-chromium-darwin.png
├── home-page-mobile-darwin.png
└── ...
```

> [!NOTE]
> 截图文件较大且与操作系统/字体相关，已在 `.gitignore` 中忽略。
> CI 环境需首次运行 `--update-snapshots` 生成本地基准。

### 5.5 响应式布局测试

```typescript
import { VIEWPORTS } from "./utils/test-helpers";

test("移动端布局", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.mobile);
  await page.goto("/admin/comments");
  // ...
});
```

---

## 6. 测试分层策略

| 层级     | 测试类型 | 工具                     | 关注点                     |
| -------- | -------- | ------------------------ | -------------------------- |
| **API**  | 接口测试 | `request`                | 响应格式、状态码、数据结构 |
| **UI**   | 页面渲染 | `page` + `PageValidator` | JS 错误、元素可见性        |
| **视觉** | 截图对比 | `toHaveScreenshot`       | 布局变化、样式回归         |
| **数据** | 一致性   | API + DOM                | 前后端数据同步             |

---

## 7. 经验教训总结 ✨ (2026-01)

### ❌ 错误做法

| 做法                              | 问题                                 |
| :-------------------------------- | :----------------------------------- |
| 每个测试独立调用 `loginAsAdmin()` | 触发频率限制，测试被跳过             |
| 使用 `serial` 模式共享登录        | 无效！串行只保证顺序，不共享 context |
| 不提交视觉回归基准截图            | CI 环境首次运行全部失败              |
| 测试数据不加前缀                  | 难以区分和清理测试数据               |

### ✅ 正确做法

| 做法                                  | 效果                             |
| :------------------------------------ | :------------------------------- |
| 使用 `auth.setup.ts` + `storageState` | 全局登录一次，所有测试复用       |
| 视觉回归基准截图提交到 Git            | CI 可正常对比截图差异            |
| 测试数据使用 `E2E_PREFIX` 前缀        | 便于识别和清理 `[E2E_AUTO]` 数据 |
| 使用 `getCommonMasks()` 遮罩变动区域  | 避免时间戳导致的截图差异         |

---

## 8. 文件清单

| 文件                        | 用途       | 用例数 |
| :-------------------------- | :--------- | :----- |
| `auth.setup.ts`             | 全局登录   | 1      |
| `auth.spec.ts`              | 认证流程   | 10     |
| `admin-posts.spec.ts`       | 文章管理   | 13     |
| `admin-orders.spec.ts`      | 订单管理   | 10     |
| `admin-series.spec.ts`      | 系列管理   | 10     |
| `admin-comments.spec.ts`    | 评论管理   | 6      |
| `visual-regression.spec.ts` | 视觉回归   | 7      |
| `mobile-layout.spec.ts`     | 移动端布局 | 8      |
| `upload.spec.ts`            | 文件上传   | 4      |
| `like.spec.ts`              | 点赞功能   | 6      |
| 其他...                     | -          | ~20    |
