// 我的订单列表页面 - 需要登录
// --------------------------------------------------------------------------------
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Package, Loader2, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchMyOrders, fetchCurrentUser, type Order } from "@/lib/api";

// 订单状态映射
const statusMap: Record<Order["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  Pending: { label: "待付款", variant: "outline" },
  Paid: { label: "已付款", variant: "default" },
  Completed: { label: "已完成", variant: "secondary" },
  Cancelled: { label: "已取消", variant: "destructive" },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        // 检查登录状态
        await fetchCurrentUser();
        setIsLoggedIn(true);

        // 加载订单
        const data = await fetchMyOrders();
        setOrders(data);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 未登录
  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">请先登录</h1>
        <p className="text-muted-foreground mb-6">查看订单需要登录您的账户</p>
        <Button asChild>
          <Link href="/login?redirect=/orders">去登录</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
      {/* 页面标题 */}
      <div className="flex items-center gap-4 mb-6 sm:mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="h-8 sm:h-9 px-2 sm:px-3 flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">返回</span>
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
          <ShoppingBag className="w-6 h-6" />
          我的订单
        </h1>
      </div>

      {orders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg mb-4">暂无订单</p>
            <Button asChild>
              <Link href="/shop">去逛逛</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusMap[order.status];
            return (
              <Card
                key={order.id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      订单号：{order.orderNo}
                    </CardTitle>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString("zh-CN")}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        共 {order.items.reduce((sum, item) => sum + item.quantity, 0)} 件商品
                      </p>
                      <p className="font-bold text-primary text-lg">
                        ¥{order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
