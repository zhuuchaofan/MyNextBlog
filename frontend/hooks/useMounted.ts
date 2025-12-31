import { useSyncExternalStore } from 'react';

/**
 * useMounted Hook
 * --------------------------------------------------------------------------------
 * 用于检测组件是否已经在客户端挂载。
 * 
 * **实现原理**：
 * 使用 React 18 的 `useSyncExternalStore` API，它专门为此类场景设计。
 * - `subscribe`: 不需要订阅任何外部更新，返回空函数
 * - `getSnapshot`: 客户端始终返回 true（已挂载）
 * - `getServerSnapshot`: SSR 时返回 false（未挂载）
 * 
 * 这种方式完全避免了 useEffect + setState 的模式，消除 ESLint 警告。
 * 
 * **使用场景**：
 * - 避免服务端渲染 (SSR) 与客户端水合 (Hydration) 不匹配
 * - 需要等待客户端 JavaScript 加载完成后再渲染某些交互式组件
 * 
 * @returns 布尔值，组件挂载后返回 true
 */

// 外部存储：不需要真正订阅任何东西
const emptySubscribe = () => () => {};

// 客户端快照：始终返回 true（表示已挂载）
const getClientSnapshot = () => true;

// 服务端快照：SSR 时返回 false（表示未挂载）
const getServerSnapshot = () => false;

export function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}
