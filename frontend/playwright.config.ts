// ============================================================================
// Playwright E2E Test Configuration
// ============================================================================
// 本配置用于前后端集成测试，验证关键用户路径。
//
// **运行方式**:
//   - `npm run test:e2e` - 运行所有测试
//   - `npm run test:e2e:ui` - 打开交互式 UI
//
// **前提条件**:
//   - Docker 容器运行中 (`docker compose up -d`)
//   - 或本地 dev server 运行中 (`npm run dev`)

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  // 并行执行测试
  fullyParallel: true,

  // CI 环境下禁止使用 test.only
  forbidOnly: !!process.env.CI,

  // CI 环境下失败重试 2 次
  retries: process.env.CI ? 2 : 0,

  // CI 环境下使用单线程
  workers: process.env.CI ? 1 : undefined,

  // 测试报告格式
  reporter: [["html", { open: "never" }]],

  // 全局配置
  use: {
    // 基础 URL (Docker 或本地)
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",

    // 失败时收集 trace
    // CI: 仅在重试时收集 (节省资源)
    // Local: 失败保留 (方便调试)
    trace: process.env.CI ? "on-first-retry" : "retain-on-failure",

    // 视频录制策略
    // CI: 关闭 (节省资源)
    // Local: 失败保留 (方便回溯)
    video: process.env.CI ? "off" : "retain-on-failure",

    // 截图策略
    screenshot: "only-on-failure",
  },

  // 测试输出目录
  outputDir: "test-results",

  // 视觉回归配置
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01, // 允许 1% 像素差异 (抗锯齿)
    },
  },

  // 多平台测试 (使用 setup 项目统一登录)
  projects: [
    // 1. Setup 项目: 执行一次登录，保存 storageState
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    // 2. Chromium 桌面测试 (依赖 setup)
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // 使用 setup 保存的登录状态
        storageState: "tests/.auth/admin.json",
      },
      dependencies: ["setup"],
    },

    // 3. 移动端测试 (依赖 setup)
    // {
    //   name: "mobile",
    //   use: {
    //     ...devices["iPhone 13"],
    //     storageState: "tests/.auth/admin.json",
    //   },
    //   dependencies: ["setup"],
    // },
  ],

  // 自动启动 dev server (本地开发)
  // 如果使用 Docker，请注释此部分
  // webServer: {
  //   command: "npm run dev",
  //   url: "http://localhost:3000",
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});
