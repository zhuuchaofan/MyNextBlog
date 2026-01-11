// ============================================================================
// E2E Test: 友链管理功能
// ============================================================================
// 验证友链管理页面的增删改查、自动排序和输入验证

import { test, expect } from "@playwright/test";


test.describe("友链管理功能 (Admin Friend Links)", () => {
    // 使用 fixtures 自动登录
    // test.use({ storageState: 'tests/.auth/admin.json' }); // 继承自 chromium project config

    test("自动递增 DisplayOrder", async ({ page }) => {
        // 1. 进入友链管理页面
        await page.goto("/admin/friends");
        await expect(page.getByRole('heading', { name: '友链管理' })).toBeVisible();

        // 2. 创建第一个友链 (Order 留空/默认)
        const name1 = `[E2E_AUTO] Order Test 1 ${Date.now()}`;
        await page.getByRole('button', { name: '添加友链' }).first().click();
        
        await page.locator('input#name').fill(name1);
        await page.locator('input#url').fill('https://example.com/1');
        // 确保 DisplayOrder 为空或 0
        await page.locator('input#displayOrder').fill('0'); 
        
        await page.getByRole('button', { name: '创建' }).click();
        await expect(page.locator(`.font-bold:has-text("${name1}")`)).toBeVisible();

        // 3. 创建第二个友链 (Order 留空/默认)
        const name2 = `[E2E_AUTO] Order Test 2 ${Date.now()}`;
        // 稍微等待一下，确保第一个请求完成
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: '添加友链' }).first().click();
        
        await page.locator('input#name').fill(name2);
        await page.locator('input#url').fill('https://example.com/2');
        await page.locator('input#displayOrder').fill('0');
        
        await page.getByRole('button', { name: '创建' }).click();
        await expect(page.locator(`.font-bold:has-text("${name2}")`)).toBeVisible();

        // 4. 验证序号 (从页面获取)
        // 获取所有友链卡片
        // 假设卡片里有 displayOrder 的展示，通过 locator 获取
        // 代码里是 <span className="text-xs text-gray-400">#{friend.displayOrder}</span>
        
        // 刷新列表确保数据最新
        await page.getByRole('button', { name: /刷新/ }).click();
        await page.waitForTimeout(500);

        // 获取卡片文本
        const card1 = page.locator(`.relative:has-text("${name1}")`);
        const card2 = page.locator(`.relative:has-text("${name2}")`);

        const orderText1 = await card1.locator('span:has-text("#")').textContent();
        const orderText2 = await card2.locator('span:has-text("#")').textContent();

        const order1 = parseInt(orderText1?.replace('#', '') || '0');
        const order2 = parseInt(orderText2?.replace('#', '') || '0');

        console.log(`Order 1: ${order1}, Order 2: ${order2}`);
        
        // 验证 order2 应该比 order1 大 (或至少不为 0)
        expect(order2).toBeGreaterThan(order1);
        expect(order2).toBe(order1 + 1);

        // 清理数据
        // 使用 API 清理更可靠
        const listRes = await page.request.get('/api/backend/friend-links/admin');
        const listJson = await listRes.json();
        const createdIds = listJson.data
            .filter((f: any) => f.name === name1 || f.name === name2)
            .map((f: any) => f.id);
        
        for (const id of createdIds) {
            await page.request.delete(`/api/backend/admin/friend-links/${id}`);
        }
    });

    test("禁止输入负数 DisplayOrder", async ({ page }) => {
        await page.goto("/admin/friends");
        
        await page.getByRole('button', { name: '添加友链' }).first().click();
        
        await page.locator('input#name').fill(`[E2E_AUTO] Negative Test`);
        await page.locator('input#url').fill('https://example.com');
        
        // 尝试输入负数 (因为 type=number min=0，playwright fill 可能会直接填入字符串)
        await page.locator('input#displayOrder').fill('-5');
        
        // 点击创建
        await page.getByRole('button', { name: '创建' }).click();
        
        // 预期：
        // 1. 浏览器自带的验证可能会阻止提交 (Playwright fill 可能绕过?)
        // 2. 或者后端返回错误，显示 toast

        // 检查是否有错误提示 toast（sonner toast）
        // 或者检查提交按钮是否仍然存在（表示未关闭对话框）
        
        // 如果浏览器阻止了提交，对话框应该依然打开
        await expect(page.locator('div[role="dialog"]')).toBeVisible();

        // 也可以断言浏览器 validationMessage (如果是原生验证)
        // const validationMessage = await page.locator('input#displayOrder').evaluate((el) => (el as HTMLInputElement).validationMessage);
        // expect(validationMessage).not.toBe('');
    });
});
