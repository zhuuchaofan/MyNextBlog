// i18n/request.ts
// next-intl 配置文件 - 从 Cookie 读取用户语言偏好
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

// 支持的语言列表
export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

// 默认语言
export const defaultLocale: Locale = 'zh';

export default getRequestConfig(async () => {
  // 从 Cookie 读取语言偏好，默认中文
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value as Locale) || defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
