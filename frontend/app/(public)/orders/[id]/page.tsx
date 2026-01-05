// 订单详情页面 - 需要登录
// --------------------------------------------------------------------------------
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Loader2,
  Package,
  Download,
  Key,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchOrderById, payOrder, confirmReceipt, cancelMyOrder, type Order } from "@/lib/api";

// 订单状态配置
const statusConfig: Record<
  Order["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; color: string }
> = {
  Pending: { label: "待付款", variant: "outline", icon: <Clock className="w-5 h-5" />, color: "text-amber-500" },
  Paid: { label: "已付款", variant: "default", icon: <CreditCard className="w-5 h-5" />, color: "text-blue-500" },
  Completed: { label: "已完成", variant: "secondary", icon: <CheckCircle2 className="w-5 h-5" />, color: "text-green-500" },
  Cancelled: { label: "已取消", variant: "destructive", icon: <XCircle className="w-5 h-5" />, color: "text-red-500" },
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  // 解析动态路由参数
  useEffect(() => {
    params.then((p) => {
      setOrderId(parseInt(p.id, 10));
    });
  }, [params]);

  // 加载订单详情
  useEffect(() => {
    if (orderId === null) return;

    async function loadOrder() {
      setLoading(true);
      const data = await fetchOrderById(orderId!);
      setOrder(data);
      setLoading(false);
    }
    loadOrder();
  }, [orderId]);

  // 模拟付款
  const handlePay = async () => {
    if (!order) return;

    setPaying(true);
    try {
      const result = await payOrder(order.id);
      if (result.success) {
        setOrder(result.data);
        toast.success("付款成功！商品信息已发送到您的邮箱");
      } else {
        throw new Error(result.message || "付款失败");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "付款失败，请稍后重试");
    } finally {
      setPaying(false);
    }
  };

  // 确认收货
  const handleConfirm = async () => {
    if (!order) return;

    setConfirming(true);
    try {
      const result = await confirmReceipt(order.id);
      if (result.success) {
        setOrder({ ...order, status: "Completed", completedAt: new Date().toISOString() });
        toast.success("已确认收货，感谢您的购买！");
      } else {
        throw new Error(result.message || "操作失败");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败，请稍后重试");
    } finally {
      setConfirming(false);
    }
  };

  // 取消订单
  const handleCancel = async () => {
    if (!order) return;
    if (!confirm("确定要取消这个订单吗？")) return;

    setCancelling(true);
    try {
      const result = await cancelMyOrder(order.id);
      if (result.success) {
        setOrder({ ...order, status: "Cancelled" });
        toast.success("订单已取消");
      } else {
        throw new Error(result.message || "取消失败");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "取消失败，请稍后重试");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-bold mb-2">订单不存在</h1>
        <p className="text-muted-foreground mb-6">该订单可能已被删除或不属于您</p>
        <Button asChild>
          <Link href="/orders">查看我的订单</Link>
        </Button>
      </div>
    );
  }

  const status = statusConfig[order.status];
  const isPaid = order.status === "Paid" || order.status === "Completed";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
      {/* 返回按钮 */}
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/orders">
          <ChevronLeft className="w-4 h-4 mr-1" />
          返回订单列表
        </Link>
      </Button>

      {/* 订单状态卡片 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* 状态图标和信息 */}
            <div className="flex items-start sm:items-center gap-4 flex-1">
              <div className={`p-3 rounded-full bg-muted ${status.color} flex-shrink-0`}>
                {status.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold">{status.label}</h2>
                <p className="text-sm text-muted-foreground mt-1 font-mono break-all">
                  {order.orderNo}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  下单时间：{new Date(order.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
            {/* 操作按钮 */}
            {order.status === "Pending" && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={handlePay} disabled={paying || cancelling} className="w-full sm:w-auto">
                  {paying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      模拟付款
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel} 
                  disabled={cancelling || paying}
                  className="w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      取消中...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      取消订单
                    </>
                  )}
                </Button>
              </div>
            )}
            {order.status === "Paid" && (
              <Button variant="outline" onClick={handleConfirm} disabled={confirming} className="w-full sm:w-auto">
                {confirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    确认中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    确认收货
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 商品列表 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>商品信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b last:border-0 last:pb-0"
            >
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-muted-foreground">
                  ¥{item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <div className="text-right font-medium">
                ¥{(item.price * item.quantity).toFixed(2)}
              </div>

              {/* 付款后显示下载链接和兑换码 */}
              {isPaid && (item.downloadUrl || item.redeemCode) && (
                <div className="w-full sm:w-auto flex flex-col gap-2 mt-2 sm:mt-0 sm:ml-4 p-3 bg-muted rounded-lg">
                  {item.downloadUrl && (
                    <a
                      href={item.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      点击下载
                    </a>
                  )}
                  {item.redeemCode && (
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-500" />
                      <code className="bg-background px-2 py-1 rounded text-sm">
                        {item.redeemCode}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 订单金额 */}
      <Card>
        <CardHeader>
          <CardTitle>支付信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">商品金额</span>
            <span>¥{order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">运费</span>
            <span className="text-green-600">免运费</span>
          </div>
          <hr />
          <div className="flex justify-between text-lg font-bold">
            <span>实付金额</span>
            <span className="text-primary">¥{order.totalAmount.toFixed(2)}</span>
          </div>
          {order.paidAt && (
            <p className="text-sm text-muted-foreground text-right">
              付款时间：{new Date(order.paidAt).toLocaleString("zh-CN")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
