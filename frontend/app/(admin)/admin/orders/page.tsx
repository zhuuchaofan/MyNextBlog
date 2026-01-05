// 管理员订单管理页面
// --------------------------------------------------------------------------------
"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Loader2, XCircle, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchOrdersAdmin, cancelOrder, type OrderAdmin } from "@/lib/api";

// 订单状态映射
const statusMap: Record<
  OrderAdmin["status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  Pending: { label: "待付款", variant: "outline" },
  Paid: { label: "已付款", variant: "default" },
  Completed: { label: "已完成", variant: "secondary" },
  Cancelled: { label: "已取消", variant: "destructive" },
};

export default function OrdersAdminPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const pageSize = 20;

  // 加载订单列表
  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        const { orders: data, totalCount: total } = await fetchOrdersAdmin(page, pageSize);
        setOrders(data);
        setTotalCount(total);
      } catch {
        toast.error("加载失败");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [page]);

  // 取消订单
  const handleCancel = async (id: number) => {
    if (!confirm("确定要取消这个订单吗？库存将自动恢复。")) return;

    setCancelling(id);
    try {
      const result = await cancelOrder(id);
      if (result.success) {
        toast.success("订单已取消");
        // 重新加载
        const { orders: data, totalCount: total } = await fetchOrdersAdmin(page, pageSize);
        setOrders(data);
        setTotalCount(total);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "取消失败");
    } finally {
      setCancelling(null);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
      {/* 头部导航 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 sm:h-9 sm:w-9 text-gray-500">
            <ChevronLeft className="w-4 h-4" />
            <span className="sr-only">返回</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            订单管理
          </h1>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            共 {totalCount} 个
          </Badge>
        </div>
      </div>

      <Card className="dark:bg-zinc-900 dark:border-zinc-800">
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无订单
            </div>
          ) : (
            <>
              {/* 桌面端表格 */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 dark:bg-zinc-800/50">
                      <TableHead>订单号</TableHead>
                      <TableHead>用户</TableHead>
                      <TableHead className="text-right">金额</TableHead>
                      <TableHead className="text-center">状态</TableHead>
                      <TableHead>下单时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const status = statusMap[order.status];
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">
                            {order.orderNo}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{order.username || "未知用户"}</p>
                              <p className="text-muted-foreground text-xs">
                                {order.userEmail || "-"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ¥{order.totalAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString("zh-CN")}
                          </TableCell>
                          <TableCell className="text-right">
                            {(order.status === "Pending" || order.status === "Paid") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleCancel(order.id)}
                                disabled={cancelling === order.id}
                              >
                                {cancelling === order.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4 mr-1" />
                                    取消
                                  </>
                                )}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* 移动端卡片 */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-zinc-800">
                {orders.map((order) => {
                  const status = statusMap[order.status];
                  return (
                    <div key={order.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{order.orderNo}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{order.username || "未知用户"}</p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">¥{order.totalAmount.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                      {(order.status === "Pending" || order.status === "Paid") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-9 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleCancel(order.id)}
                          disabled={cancelling === order.id}
                        >
                          {cancelling === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              取消订单
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

            </>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="w-full sm:w-auto"
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="w-full sm:w-auto"
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
