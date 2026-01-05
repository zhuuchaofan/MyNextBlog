import { useSyncExternalStore } from 'react';

/**
 * useMediaQuery Hook
 * --------------------------------------------------------------------------------
 * 响应式媒体查询 Hook，用于检测当前视口是否匹配指定的媒体查询。
 * 
 * **使用示例**:
 * ```tsx
 * const isDesktop = useMediaQuery("(min-width: 768px)");
 * const isDark = useMediaQuery("(prefers-color-scheme: dark)");
 * ```
 * 
 * **实现原理**:
 * 使用 React 18 的 `useSyncExternalStore` API，订阅浏览器的 matchMedia 变化。
 * - SSR 时默认返回 false（移动端优先）
 * - 客户端挂载后返回实际匹配结果
 */

export function useMediaQuery(query: string): boolean {
  // 订阅函数：监听媒体查询变化
  const subscribe = (callback: () => void) => {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener('change', callback);
    return () => mediaQuery.removeEventListener('change', callback);
  };

  // 客户端快照：返回当前匹配结果
  const getSnapshot = () => {
    return window.matchMedia(query).matches;
  };

  // 服务端快照：SSR 时假设为移动端（false）
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
