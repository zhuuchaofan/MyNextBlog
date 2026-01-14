'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchPlans, deletePlan, type PlanListItem } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CalendarDays,
  Plus,
  Plane,
  PartyPopper,
  Gift,
  Trash2,
  Edit,
  Lock,
  Calendar,
  ChevronLeft,
  MoreVertical,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageContainer, EmptyState } from '@/components/common';

// 类型图标映射
const typeIcons: Record<string, typeof Plane> = {
  trip: Plane,
  event: PartyPopper,
  surprise: Gift,
};

// 类型名称映射
const typeLabels: Record<string, string> = {
  trip: '旅行',
  event: '活动',
  surprise: '惊喜',
};

// 状态样式映射
const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-gray-300',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const statusLabels: Record<string, string> = {
  draft: '草稿',
  confirmed: '已确认',
  completed: '已完成',
};

/**
 * 计划管理列表页
 */
export default function PlansPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

  // 权限检查
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'Admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 加载计划列表
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await fetchPlans();
        setPlans(data);
      } catch (error) {
        console.error('Failed to load plans:', error);
        toast.error('加载计划列表失败');
      } finally {
        setIsLoading(false);
      }
    };
    loadPlans();
  }, []);

  // 删除计划
  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      await deletePlan(deleteTarget.id);
      setPlans(plans.filter(p => p.id !== deleteTarget.id));
      toast.success('计划已删除');
    } catch (error) {
      console.error('Failed to delete plan:', error);
      toast.error('删除失败');
    } finally {
      setDeleteTarget(null);
    }
  };

  // 复制公开链接
  const handleCopyPublicLink = (planId: number) => {
    const url = `${window.location.origin}/plan/${planId}`;
    navigator.clipboard.writeText(url);
    toast.success('公开链接已复制', {
      description: '任何人通过此链接均可查看（敏感信息已隐藏）'
    });
  };

  // 计算剩余天数 - 与公开页面保持一致的计算逻辑
  const getDaysRemaining = (startDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    // 使用 differenceInDays 的等效计算：完整天数差
    return Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (authLoading || isLoading) {
    return (
      <PageContainer variant="admin" maxWidth="4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-zinc-800 rounded w-1/4" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="admin" maxWidth="4xl">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">返回</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" /> 计划管理
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
              管理旅行计划、活动安排和预算追踪
            </p>
          </div>
        </div>
        <Link href="/admin/plans/new">
          <Button className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            新建计划
          </Button>
        </Link>
      </div>

      {/* 计划列表 */}
      {plans.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="w-12 h-12" />}
          title="暂无计划"
          description="创建您的第一个旅行或活动计划"
          action={
            <Link href="/admin/plans/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />创建第一个计划
              </Button>
            </Link>
          }
        />
      ) : (
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          {plans.map(plan => {
            const TypeIcon = typeIcons[plan.type] || Calendar;
            const daysRemaining = getDaysRemaining(plan.startDate);
            const showCountdown = plan.status !== 'completed' && daysRemaining >= 0;
            
            return (
              <Card 
                key={plan.id} 
                className="dark:bg-zinc-900 dark:border-zinc-800 hover:shadow-lg transition-all hover:border-orange-200 dark:hover:border-orange-800"
              >
                <CardContent className="p-4 flex flex-col h-full">
                  {/* 头部：图标 + 标题 + 状态 */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20">
                      <TypeIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
                          {plan.title}
                          {plan.isSecret && (
                            <Lock className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          )}
                        </h3>
                        
                        {/* 操作菜单 */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-gray-400 hover:text-gray-600">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/admin/plans/${plan.id}`}>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                编辑详情
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                              onClick={() => setDeleteTarget({ id: plan.id, title: plan.title })}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              删除计划
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className={`${statusStyles[plan.status]} text-[10px] px-1.5 py-0 h-5`}>
                          {statusLabels[plan.status]}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {typeLabels[plan.type]} · {plan.daysCount || 0} 天
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 信息区块 - 固定高度 */}
                  <div className="flex-1 space-y-2">
                    {/* 日期 + 预算 */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{plan.startDate}</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {plan.currency} {plan.budget.toLocaleString()}
                      </span>
                    </div>
                    
                    {/* 倒计时 - 始终保留空间 */}
                    <div className="text-xs h-5">
                      {showCountdown ? (
                        daysRemaining === 0 ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            🎉 今天出发！
                          </span>
                        ) : (
                          <span className="text-orange-600 dark:text-orange-400">
                            ⏰ 还有 <strong>{daysRemaining}</strong> 天
                          </span>
                        )
                      ) : plan.status === 'completed' ? (
                        <span className="text-gray-400 dark:text-gray-500">✓ 已完成</span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </div>

                    {/* 关联纪念日 - 始终保留空间 */}
                    <div className="text-xs h-5 truncate">
                      {plan.anniversaryTitle ? (
                        <span className="text-gray-500 dark:text-gray-400">
                          💕 关联: {plan.anniversaryTitle}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 - 固定在底部 */}
                  <div className="flex gap-2 pt-3 mt-3 border-t dark:border-zinc-700/50">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-9 text-gray-600 dark:text-gray-300"
                      onClick={() => handleCopyPublicLink(plan.id)}
                    >
                      <Share2 className="w-4 h-4 mr-1.5" />
                      分享
                    </Button>
                    <Link href={`/admin/plans/${plan.id}`} className="flex-1">
                      <Button size="sm" className="w-full h-9 bg-orange-500 hover:bg-orange-600 text-white">
                        <Edit className="w-4 h-4 mr-1.5" />
                        编辑
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定删除？</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除计划「{deleteTarget?.title}」吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
