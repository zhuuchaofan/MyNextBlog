import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('导航与外部链接测试', () => {
  test('首页导航及社交媒体链接跳转', async ({ page }) => {
    // 定义截图保存路径和辅助函数
    const screenshotDir = 'test-results/screenshots/navigation-flow';
    let stepIndex = 1;
    const takeScreenshot = async (name: string, targetPage = page) => {
      const filename = `${String(stepIndex).padStart(2, '0')}-${name}.png`;
      await targetPage.screenshot({ path: path.join(screenshotDir, filename), fullPage: true });
      stepIndex++;
    };

    // 1. 必须添加访问首页的步骤
    await page.goto('/');
    await takeScreenshot('home-initial');

    // 2. 验证导航栏交互
    await page.getByRole('button', { name: '关于' }).click();
    await expect(page).toHaveURL(/.*\/about/);
    await takeScreenshot('nav-to-about');

    await page.getByRole('button', { name: '首页' }).click();
    await expect(page.getByRole('button', { name: '开始阅读' })).toBeVisible();
    await takeScreenshot('back-to-home');

    // 3. 验证 "认识博主" 按钮
    await page.getByRole('button', { name: '认识博主' }).click();
    // 假设这里会跳转或滚动，简单验证后返回
    await page.getByRole('button', { name: '首页' }).click();
    
    // 验证首页关键元素
    await expect(page.getByRole('button', { name: '认识博主' })).toBeVisible();
    // 如果 'chaofan' 是 Logo 或用户名，保留此检查
    await expect(page.getByRole('button', { name: 'chaofan' })).toBeVisible();
    await takeScreenshot('check-home-elements');

    // 4. 测试外部链接 (Github/Twitter)
    await page.getByRole('button', { name: '关于' }).click();
    await expect(page).toHaveURL(/.*\/about/);
    await takeScreenshot('about-page-links');
    
    const githubLink = page.getByRole('link', { name: 'Github' });
    const twitterLink = page.getByRole('link', { name: 'Twitter' });
    
    await expect(githubLink).toBeVisible();
    await expect(twitterLink).toBeVisible();
    await expect(page.getByRole('link', { name: 'Email' })).toBeVisible();

    // 验证 Github 跳转 (检查 URL 而不是页面内部元素，更稳定)
    const [githubPage] = await Promise.all([
      page.waitForEvent('popup'),
      githubLink.click(),
    ]);
    await githubPage.waitForLoadState();
    expect(githubPage.url()).toContain('github.com');
    await takeScreenshot('github-popup', githubPage);
    await githubPage.close(); // 测试完关闭新标签页

    // 验证 Twitter 跳转 (避免使用 .css-xxxx 这种动态类名)
    const [twitterPage] = await Promise.all([
      page.waitForEvent('popup'),
      twitterLink.click(),
    ]);
    // Twitter 加载可能较慢，且 URL 可能是 twitter.com 或 x.com
    await twitterPage.waitForLoadState();
    expect(twitterPage.url()).toMatch(/twitter\.com|x\.com/);
    await takeScreenshot('twitter-popup', twitterPage);
    await twitterPage.close();

    // 5. 返回首页并验证欢迎语
    await page.getByRole('button', { name: '首页' }).click();
    // 使用部分文本匹配，避免因文案微调导致测试失败
    await expect(page.getByText('探索 • 记录 • 分享')).toBeVisible();
    await takeScreenshot('final-home-state');
  });
});