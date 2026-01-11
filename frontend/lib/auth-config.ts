/**
 * 认证配置 (Auth Configuration)
 * 
 * 集中管理所有认证相关的常量配置。
 * 此文件兼容 Edge Runtime (Next.js Middleware)。
 */

// Token 有效期 (秒)
export const ACCESS_TOKEN_MAX_AGE = 15 * 60;        // 15 分钟
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 天

// Cookie 通用配置
// 注意：secure: true 会导致 HTTP localhost 上的移动端模拟器无法接收 cookie
// 生产环境通过 HTTPS 提供服务，所以 secure: true 没问题
// 开发/测试环境使用 HTTP，需要 secure: false
export const COOKIE_OPTIONS = {
  httpOnly: true,
  // 如果 NEXT_PUBLIC_BASE_URL 包含 https:// 则启用 secure
  // 否则（包括 localhost 开发环境）禁用
  secure: process.env.NEXT_PUBLIC_BASE_URL?.startsWith('https://') ?? false,
  path: '/',
  sameSite: 'lax' as const,
};
