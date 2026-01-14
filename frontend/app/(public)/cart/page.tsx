// 购物车页面
// --------------------------------------------------------------------------------
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, Minus, Plus, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { CartItem } from "@/lib/api";
import { PageContainer, EmptyState } from "@/components/common";

// 购物车本地存储 Key
const CART_STORAGE_KEY = "shopping_cart";

// 获取购物车
function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// 保存购物车
function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  // 触发自定义事件，通知其他组件购物车已更新
  window.dispatchEvent(new Event("cart-updated"));
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // 客户端加载购物车
  useEffect(() => {
    const loadCart = () => {
      setCart(getCart());
      setMounted(true);
    };
    loadCart();

    // 监听购物车更新事件（从其他组件触发）
    const handleCartUpdate = () => {
      setCart(getCart());
    };
    
    // 监听 storage 事件（从其他标签页触发）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) {
        setCart(getCart());
      }
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // 更新数量
  const updateQuantity = (productId: number, delta: number) => {
    const newCart = cart.map((item) => {
      if (item.productId === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        // 检查库存限制 (stock === -1 表示无限库存)
        if (item.stock !== -1 && newQuantity > item.stock) {
          return item; // 不更新，保持原数量
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setCart(newCart);
    saveCart(newCart);
  };

  // 删除商品
  const removeItem = (productId: number) => {
    const newCart = cart.filter((item) => item.productId !== productId);
    setCart(newCart);
    saveCart(newCart);
  };

  // 清空购物车
  const clearCart = () => {
    setCart([]);
    saveCart([]);
  };

  // 计算总价
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 去结算
  const goToCheckout = () => {
    router.push("/checkout");
  };

  // 避免 SSR/CSR 不一致
  if (!mounted) {
    return (
      <PageContainer variant="public" maxWidth="4xl">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-8" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="public" maxWidth="4xl">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <ShoppingCart className="w-7 h-7" />
          购物车
        </h1>
        {cart.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart}>
            <Trash2 className="w-4 h-4 mr-1" />
            清空
          </Button>
        )}
      </div>

      {cart.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title="购物车是空的"
          description="去商店挑选商品吧"
          action={
            <Button asChild>
              <Link href="/shop">去逛逛</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 商品列表 */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <Card key={item.productId}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* 商品图片 */}
                    <div className="relative w-20 h-20 bg-muted rounded-md overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* 商品信息 */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/shop/${item.productId}`}
                        className="font-medium line-clamp-2 hover:text-primary transition-colors"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-primary font-bold mt-1">
                        ¥{item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* 数量控制 */}
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, 1)}
                          disabled={item.stock !== -1 && item.quantity >= item.stock}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 结算卡片 */}
          <Card className="h-fit sticky top-4">
            <CardHeader>
              <CardTitle>订单摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  商品数量
                </span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} 件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">商品种类</span>
                <span>{cart.length} 种</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-bold">
                <span>合计</span>
                <span className="text-primary">¥{totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={goToCheckout}>
                去结算
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
