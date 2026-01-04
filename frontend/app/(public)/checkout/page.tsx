// 确认订单页面 - 需要登录
// --------------------------------------------------------------------------------
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Package, Loader2, ChevronLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createOrder, fetchCurrentUser, type CartItem } from "@/lib/api";

// 购物车本地存储 Key
const CART_STORAGE_KEY = "shopping_cart";

function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new Event("cart-updated"));
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 检查登录状态并加载购物车
  useEffect(() => {
    async function init() {
      setMounted(true);
      setCart(getCart());

      try {
        await fetchCurrentUser();
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
      setLoading(false);
    }
    init();
  }, []);

  // 计算总价
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      toast.error("请先登录您的账户");
      router.push("/login?redirect=/checkout");
      return;
    }

    if (cart.length === 0) {
      toast.error("请先添加商品到购物车");
      return;
    }

    setSubmitting(true);

    try {
      const result = await createOrder({
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        remark: remark || undefined,
      });

      if (result.success) {
        // 清空购物车
        clearCart();

        toast.success(`订单创建成功，订单号：${result.data.orderNo}`);

        // 跳转到订单详情页
        router.push(`/orders/${result.data.id}`);
      } else {
        throw new Error(result.message || "创建订单失败");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建订单失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  // 避免 SSR/CSR 不一致
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 未登录提示
  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">请先登录</h1>
        <p className="text-muted-foreground mb-6">
          下单前需要登录您的账户
        </p>
        <Button asChild>
          <Link href="/login?redirect=/checkout">去登录</Link>
        </Button>
      </div>
    );
  }

  // 空购物车
  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg text-center">
        <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-bold mb-2">购物车是空的</h1>
        <p className="text-muted-foreground mb-6">请先添加商品到购物车</p>
        <Button asChild>
          <Link href="/shop">去商店</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
      {/* 返回按钮 */}
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/cart">
          <ChevronLeft className="w-4 h-4 mr-1" />
          返回购物车
        </Link>
      </Button>

      {/* 页面标题 */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3">
        <ShoppingBag className="w-7 h-7" />
        确认订单
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 订单详情 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 商品列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">商品清单</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      ¥{item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right font-medium">
                    ¥{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 备注 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">订单备注（可选）</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="如有特殊需求请在此填写..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* 虚拟商品提示 */}
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-400">虚拟商品说明</p>
                  <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                    付款成功后，下载链接和兑换码将通过邮件发送到您的注册邮箱。请确保邮箱地址正确。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 结算卡片 */}
        <Card className="h-fit sticky top-4">
          <CardHeader>
            <CardTitle>支付信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">商品金额</span>
              <span>¥{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">运费</span>
              <span className="text-green-600">免运费</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-bold">
              <span>应付金额</span>
              <span className="text-primary">¥{totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  提交中...
                </>
              ) : (
                "提交订单"
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              点击提交订单即表示您同意我们的服务条款
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
