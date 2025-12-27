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
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  sameSite: 'lax' as const,
};
