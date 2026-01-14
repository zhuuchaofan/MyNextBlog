// 管理员订单管理页面
// --------------------------------------------------------------------------------
"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Loader2, XCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Button } from "@/components/ui/button";
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
import { PageContainer, EmptyState, TableSkeleton } from "@/components/common";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  // 取消确认弹窗目标
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);

  // 取消订单
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;

    setCancelling(cancelTarget);
    try {
      const result = await cancelOrder(cancelTarget);
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
      setCancelTarget(null);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return (
      <PageContainer variant="admin" maxWidth="5xl">
        <TableSkeleton rows={5} columns={5} />
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="admin" maxWidth="5xl">
      <AdminPageHeader
        title="订单管理"
        description="查看和管理用户订单"
        icon={<ClipboardList className="w-5 h-5" />}
        stats={
          <Badge variant="secondary">
            共 {totalCount} 个
          </Badge>
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-12 h-12" />}
          title="暂无订单"
          description="还没有收到任何订单"
        />
      ) : (
            <>
              {/* 桌面端表格 */}
              <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 dark:bg-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                      <TableHead className="w-[20%] text-gray-500 dark:text-gray-400">订单号</TableHead>
                      <TableHead className="w-[20%] text-gray-500 dark:text-gray-400">用户</TableHead>
                      <TableHead className="w-[12%] text-gray-500 dark:text-gray-400 text-right">金额</TableHead>
                      <TableHead className="w-[12%] text-gray-500 dark:text-gray-400 text-center">状态</TableHead>
                      <TableHead className="w-[20%] text-gray-500 dark:text-gray-400">下单时间</TableHead>
                      <TableHead className="w-[16%] text-gray-500 dark:text-gray-400 text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const status = statusMap[order.status];
                      return (
                        <TableRow key={order.id} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50">
                          <TableCell className="font-mono text-sm truncate" title={order.orderNo}>
                            {order.orderNo}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm truncate">
                              <p className="text-gray-900 dark:text-gray-100 truncate">{order.username || "未知用户"}</p>
                              <p className="text-gray-500 dark:text-gray-500 text-xs truncate">
                                {order.userEmail || "-"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-orange-600 dark:text-orange-400">
                            ¥{order.totalAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleString("zh-CN")}
                          </TableCell>
                          <TableCell className="text-center">
                            {(order.status === "Pending" || order.status === "Paid") && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40"
                                onClick={() => setCancelTarget(order.id)}
                                disabled={cancelling === order.id}
                              >
                                {cancelling === order.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 mr-1" />
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
                          onClick={() => setCancelTarget(order.id)}
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

      {/* 取消订单确认对话框 */}
      <AlertDialog open={cancelTarget !== null} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认取消订单？</AlertDialogTitle>
            <AlertDialogDescription>
              确定要取消这个订单吗？库存将自动恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-red-500 hover:bg-red-600"
            >
              确认取消
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
