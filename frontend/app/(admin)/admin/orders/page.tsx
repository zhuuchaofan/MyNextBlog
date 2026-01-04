// 管理员订单管理页面
// --------------------------------------------------------------------------------
"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            订单管理
          </CardTitle>
          <CardDescription>
            共 {totalCount} 个订单
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无订单
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
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

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
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
                  >
                    下一页
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
