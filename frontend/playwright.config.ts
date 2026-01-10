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
    trace: "on-first-retry",

    // 截图策略
    screenshot: "only-on-failure",
  },

  // 仅在 Chromium 上运行 (加快速度)
  // 生产环境可启用多浏览器
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // 移动端测试 (可选)
    // {
    //   name: 'mobile',
    //   use: { ...devices['iPhone 13'] },
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
