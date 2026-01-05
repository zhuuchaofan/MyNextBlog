import { useSyncExternalStore, useCallback } from 'react';

/**
 * useCartCount Hook
 * --------------------------------------------------------------------------------
 * 用于在客户端获取购物车商品数量，并监听购物车变化。
 * 
 * **实现原理**：
 * 使用 React 18 的 `useSyncExternalStore` API，订阅 localStorage 变化和自定义事件。
 * - `subscribe`: 订阅 'cart-updated' 和 'storage' 事件
 * - `getSnapshot`: 从 localStorage 读取购物车数量
 * - `getServerSnapshot`: SSR 时返回 0
 * 
 * 这种方式完全避免了 useEffect + setState 的模式，消除 ESLint 警告。
 */

// 购物车本地存储 Key (与 cart/page.tsx 保持一致)
const CART_STORAGE_KEY = "shopping_cart";

// 从 localStorage 计算购物车数量
function getCartCount(): number {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  if (!stored) return 0;
  try {
    const cart = JSON.parse(stored);
    return cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
  } catch {
    return 0;
  }
}

// 服务端快照：SSR 时返回 0
const getServerSnapshot = () => 0;

export function useCartCount(): number {
  // 订阅函数：监听购物车变化事件
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('cart-updated', callback);
    window.addEventListener('storage', callback);
    return () => {
      window.removeEventListener('cart-updated', callback);
      window.removeEventListener('storage', callback);
    };
  }, []);

  return useSyncExternalStore(subscribe, getCartCount, getServerSnapshot);
}
