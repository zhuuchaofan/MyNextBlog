// ============================================================================
// 全局认证 Setup
// ============================================================================
// 在所有测试运行前，执行一次登录并保存登录状态到 storageState
// 后续需要管理员权限的测试可以直接使用这个状态，无需重复登录

import { test as setup } from "@playwright/test";
import { loginAsAdmin } from "./utils/test-helpers";
import fs from "fs";
import path from "path";

// 认证状态文件路径
const authFile = "tests/.auth/admin.json";

setup("管理员登录", async ({ context }) => {
  // 检查现有 auth 文件是否有效 (例如 1 小时内)
  if (fs.existsSync(authFile)) {
    const stats = fs.statSync(authFile);
    const now = new Date().getTime();
    if (now - stats.mtimeMs < 60 * 60 * 1000) {
      console.log("复用现有认证状态 (1小时内)");
      return;
    }
  }

  const loggedIn = await loginAsAdmin(context);
  
  if (!loggedIn) {
    throw new Error("管理员登录失败 (可能触发频率限制)");
  }

  // 保存登录状态到文件
  await context.storageState({ path: authFile });
});
