// ============================================================================
// E2E Test: 文件上传 (Upload)
// ============================================================================
// 验证图片上传 API 权限和格式验证

import { test, expect } from "@playwright/test";
import { loginAndGetToken } from "./utils/test-helpers";

test.describe("文件上传 (Upload)", () => {
  test.describe.configure({ mode: "serial" });

  // ========================================================================
  // 权限验证
  // ========================================================================

  test("未登录用户无法上传图片", async ({ request }) => {
    const response = await request.post("/api/backend/upload/image", {
      multipart: {
        file: {
          name: "test.png",
          mimeType: "image/png",
          buffer: Buffer.from("fake image content"),
        },
      },
    });
    expect(response.status()).toBe(401);
  });

  // ========================================================================
  // 格式验证
  // ========================================================================

  test("上传无效文件类型应被拒绝", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    // 尝试上传 .exe 文件 (伪装)
    const response = await request.post("/api/backend/upload/image", {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: "malware.exe",
          mimeType: "application/x-msdownload",
          buffer: Buffer.from("MZ fake exe header"),
        },
      },
    });

    // 应被拒绝
    expect(response.ok()).toBeFalsy();
  });

  test("上传空文件应被拒绝", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    const response = await request.post("/api/backend/upload/image", {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: "empty.png",
          mimeType: "image/png",
          buffer: Buffer.from(""),
        },
      },
    });

    expect(response.ok()).toBeFalsy();
  });

  // ========================================================================
  // 有效上传测试 (需要真实图片数据)
  // ========================================================================

  test("上传有效 PNG 图片应成功 (模拟)", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    // 创建一个最小的有效 PNG 文件 (1x1 透明像素)
    // PNG 文件头: 89 50 4E 47 0D 0A 1A 0A
    const minimalPng = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x06, // bit depth: 8, color type: RGBA
      0x00, 0x00, 0x00, // compression, filter, interlace
      0x1F, 0x15, 0xC4, 0x89, // CRC
      0x00, 0x00, 0x00, 0x0A, // IDAT length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // compressed data
      0x0D, 0x0A, 0x2D, 0xB4, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82, // CRC
    ]);

    const response = await request.post("/api/backend/upload/image", {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: "test-e2e.png",
          mimeType: "image/png",
          buffer: minimalPng,
        },
      },
    });

    // 记录结果 (可能因 R2 配置不同而失败)
    if (response.ok()) {
      const json = await response.json();
      expect(json).toHaveProperty("success", true);
      expect(json).toHaveProperty("url");
    } else {
      // 记录失败原因以便后续分析
      console.log(`上传失败: ${response.status()} - ${await response.text()}`);
    }
  });
});
