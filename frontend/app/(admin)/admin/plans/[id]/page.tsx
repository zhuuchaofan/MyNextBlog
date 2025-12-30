'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
} from '@dnd-kit/sortable';
import {
  fetchPlanById,
  updatePlan,
  addPlanDay,
  updatePlanDay,
  deletePlanDay,
  addPlanActivity,
  updatePlanActivity,
  deletePlanActivity,
  batchUpdateActivitySortOrder,
  type PlanDetail,
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  ChevronLeft,
  Loader2,
  Plus,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import BudgetChart from '@/components/plan/BudgetChart';
import SurpriseReveal from '@/components/plan/SurpriseReveal';
import { PlanDayCard } from '@/components/plan/PlanDayCard';
import { type ActivityFormData } from '@/components/plan/ActivityForm';


// 状态选项
const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿', color: 'bg-gray-500' },
  { value: 'confirmed', label: '已确认', color: 'bg-blue-500' },
  { value: 'completed', label: '已完成', color: 'bg-green-500' },
];

/**
 * 计划编辑页面
 */
export default function PlanEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const planId = Number(resolvedParams.id);
  
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 惊喜弹窗状态
  const [showSurprise, setShowSurprise] = useState(false);
  
  // 删除日程确认弹窗
  const [deleteDayId, setDeleteDayId] = useState<number | null>(null);

  // 拖拽排序完成处理
  const handleDragEnd = async (event: DragEndEvent, dayId: number) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // 找到当前 day
    const day = plan?.days.find(d => d.id === dayId);
    if (!day) return;

    const oldIndex = day.activities.findIndex(a => a.id === active.id);
    const newIndex = day.activities.findIndex(a => a.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // 乐观更新本地状态
    const reorderedActivities = arrayMove(day.activities, oldIndex, newIndex);
    setPlan({
      ...plan!,
      days: plan!.days.map(d => 
        d.id === dayId 
          ? { ...d, activities: reorderedActivities }
          : d
      ),
    });

    // 调用批量 API 更新排序（单次请求，性能优化）
    try {
      await batchUpdateActivitySortOrder(
        reorderedActivities.map((activity, index) => ({
          id: activity.id,
          sortOrder: index,
        }))
      );
      toast.success('排序已保存');
    } catch (error) {
      console.error('Failed to update sort order:', error);
      toast.error('排序保存失败');
      // 失败时回滚（重新加载）
      const data = await fetchPlanById(planId);
      setPlan(data);
    }
  };

  // 权限检查
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'Admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 加载计划数据
  useEffect(() => {
    const loadPlan = async () => {
      try {
        const data = await fetchPlanById(planId);
        setPlan(data);
      } catch (error) {
        console.error('Failed to load plan:', error);
        toast.error('加载计划失败');
        router.push('/admin/plans');
      } finally {
        setIsLoading(false);
      }
    };
    if (planId) loadPlan();
  }, [planId, router]);

  // 检查是否需要显示惊喜弹窗
  useEffect(() => {
    if (plan && plan.isSecret) {
      const viewedKey = `surprise_viewed_${plan.id}`;
      const hasViewed = localStorage.getItem(viewedKey);
      if (!hasViewed) {
        setShowSurprise(true);
        localStorage.setItem(viewedKey, 'true');
      }
    }
  }, [plan]);

  // 更新计划基本信息
  const handleUpdatePlan = async (field: string, value: string | number | boolean) => {
    if (!plan) return;
    
    try {
      await updatePlan(planId, { [field]: value });
      setPlan({ ...plan, [field]: value });
      toast.success('已保存');
    } catch (error) {
      console.error('Failed to update plan:', error);
      toast.error('保存失败');
    }
  };

  // 添加一天
  const handleAddDay = async () => {
    if (!plan) return;
    
    // 使用现有最大 dayNumber + 1，避免删除后编号重复
    const maxDayNumber = plan.days.length > 0 
      ? Math.max(...plan.days.map(d => d.dayNumber)) 
      : 0;
    const nextDayNumber = maxDayNumber + 1;
    
    // 日期计算仍然基于天数位置（第几天）
    const startDate = new Date(plan.startDate);
    startDate.setDate(startDate.getDate() + plan.days.length);  // 基于当前天数
    const dateStr = startDate.toISOString().split('T')[0];
    
    try {
      const day = await addPlanDay(planId, {
        dayNumber: nextDayNumber,
        date: dateStr,
        theme: `Day ${nextDayNumber}`,
      });
      setPlan({
        ...plan,
        days: [...plan.days, { ...day, activities: [] }],
      });
      toast.success('已添加新的一天');
    } catch (error) {
      console.error('Failed to add day:', error);
      toast.error('添加失败');
    }
  };

  // 更新某天主题
  const handleUpdateDayTheme = async (dayId: number, theme: string) => {
    try {
      await updatePlanDay(planId, dayId, { theme });
      setPlan({
        ...plan!,
        days: plan!.days.map(d => d.id === dayId ? { ...d, theme } : d),
      });
      toast.success('已保存');
    } catch (error) {
      console.error('Failed to update day:', error);
      toast.error('保存失败');
    }
  };

  // 删除某天
  const handleDeleteDay = async () => {
    if (!deleteDayId) return;
    
    try {
      await deletePlanDay(planId, deleteDayId);
      setPlan({
        ...plan!,
        days: plan!.days.filter(d => d.id !== deleteDayId),
      });
      toast.success('已删除');
    } catch (error) {
      console.error('Failed to delete day:', error);
      toast.error('删除失败');
    } finally {
      setDeleteDayId(null);
    }
  };

  // 复制公开链接
  const handleCopyPublicLink = () => {
    if (!plan) return;
    const url = `${window.location.origin}/plan/${plan.id}`;
    navigator.clipboard.writeText(url);
    toast.success('公开链接已复制', {
      description: '任何人通过此链接均可查看（敏感信息已隐藏）'
    });
  };

  // 添加活动
  const handleAddActivity = async (dayId: number, data: ActivityFormData) => {
    if (!data.title.trim()) {
      toast.error('请输入活动名称');
      return;
    }
    
    try {
      const activity = await addPlanActivity(dayId, {
        title: data.title,
        time: data.time || undefined,
        location: data.location || undefined,
        estimatedCost: data.estimatedCost,
        sortOrder: plan!.days.find(d => d.id === dayId)?.activities.length || 0,
      });
      
      setPlan({
        ...plan!,
        days: plan!.days.map(d =>
          d.id === dayId ? { ...d, activities: [...d.activities, activity] } : d
        ),
      });
      toast.success('已添加活动');
    } catch (error) {
      console.error('Failed to add activity:', error);
      toast.error('添加失败');
    }
  };

  // 删除活动
  const handleDeleteActivity = async (dayId: number, activityId: number) => {
    try {
      await deletePlanActivity(activityId);
      setPlan({
        ...plan!,
        days: plan!.days.map(d =>
          d.id === dayId
            ? { ...d, activities: d.activities.filter(a => a.id !== activityId) }
            : d
        ),
      });
      toast.success('已删除');
    } catch (error) {
      console.error('Failed to delete activity:', error);
      toast.error('删除失败');
    }
  };

  // 保存活动编辑
  const handleSaveActivity = async (dayId: number, activityId: number, data: ActivityFormData) => {
    try {
      await updatePlanActivity(activityId, {
        title: data.title,
        time: data.time || undefined,
        location: data.location || undefined,
        estimatedCost: data.estimatedCost,
        actualCost: data.actualCost,
        notes: data.notes || undefined,
      });
      
      // 更新本地状态
      setPlan({
        ...plan!,
        days: plan!.days.map(d =>
          d.id === dayId
            ? {
                ...d,
                activities: d.activities.map(a =>
                  a.id === activityId
                    ? { ...a, ...data }
                    : a
                ),
              }
            : d
        ),
      });
      
      toast.success('已保存');
    } catch (error) {
      console.error('Failed to update activity:', error);
      toast.error('保存失败');
    }
  };

  // 计算预算统计
  const budgetStats = plan?.days.reduce(
    (acc, day) => {
      day.activities.forEach(a => {
        acc.estimated += a.estimatedCost;
        acc.actual += a.actualCost;
      });
      return acc;
    },
    { estimated: 0, actual: 0 }
  ) || { estimated: 0, actual: 0 };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="min-h-screen pb-20 bg-gray-50/50 dark:bg-zinc-950">
      {/* 惊喜弹窗 */}
      {showSurprise && plan.isSecret && (
        <SurpriseReveal
          title={plan.title}
          description={plan.description || undefined}
          startDate={plan.startDate}
          type={plan.type as 'trip' | 'event' | 'surprise'}
          onClose={() => setShowSurprise(false)}
        />
      )}

      {/* 顶部导航栏 - Glassmorphic */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between max-w-6xl">
           {/* 左侧：返回 + 标题 + 状态 */}
           <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
             <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-gray-100 dark:hover:bg-zinc-800 flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9">
               <ChevronLeft className="w-5 h-5" />
               <span className="sr-only">返回</span>
             </Button>
             {/* 标题：固定最大宽度 + 截断 */}
             <h1 className="text-sm sm:text-xl font-bold truncate max-w-[140px] sm:max-w-[280px] lg:max-w-md" title={plan.title}>
               {plan.title}
             </h1>
             {/* 下拉菜单：自适应宽度但有上限 */}
             <Select
               value={plan.status}
               onValueChange={value => handleUpdatePlan('status', value)}
             >
               <SelectTrigger className="h-7 sm:h-8 w-auto min-w-[4rem] max-w-[5.5rem] sm:w-28 sm:max-w-none text-xs font-medium border-none bg-gray-100 dark:bg-zinc-800 focus:ring-1 focus:ring-offset-0 flex-shrink-0">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {STATUS_OPTIONS.map(opt => (
                   <SelectItem key={opt.value} value={opt.value}>
                     <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                       {opt.label}
                     </div>
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>

           {/* 右侧：分享按钮 */}
           <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
             <Button variant="outline" size="sm" onClick={handleCopyPublicLink} className="hidden sm:flex">
               <Share2 className="w-4 h-4 mr-2" />
               分享
             </Button>
             <Button size="icon" onClick={handleCopyPublicLink} className="sm:hidden h-8 w-8" variant="ghost">
                <Share2 className="w-4 h-4" />
             </Button>
           </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 左侧：基本信息与统计 (占用 4 列) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* 基本信息编辑 */}
            <Card className="dark:bg-zinc-900 dark:border-zinc-800 shadow-sm border-0 ring-1 ring-gray-200 dark:ring-zinc-800">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-500" /> 
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">计划名称</Label>
                    <Input
                      value={plan.title}
                      onChange={e => handleUpdatePlan('title', e.target.value)}
                      className="bg-white dark:bg-zinc-950"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <Label className="text-xs text-gray-500">类型</Label>
                      <Select
                        value={plan.type}
                        onValueChange={value => handleUpdatePlan('type', value)}
                      >
                        <SelectTrigger className="bg-white dark:bg-zinc-950">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trip">✈️ 旅行</SelectItem>
                          <SelectItem value="event">🎉 活动</SelectItem>
                          <SelectItem value="surprise">🎁 惊喜</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                     <div className="space-y-1.5 min-w-0">
                       <Label className="text-xs text-gray-500">货币</Label>
                       <Select
                         value={plan.currency}
                         onValueChange={value => handleUpdatePlan('currency', value)}
                       >
                         <SelectTrigger className="bg-white dark:bg-zinc-950">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="CNY">CNY ¥</SelectItem>
                           <SelectItem value="USD">USD $</SelectItem>
                           <SelectItem value="JPY">JPY ¥</SelectItem>
                           <SelectItem value="EUR">EUR €</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <Label className="text-xs text-gray-500">开始日期</Label>
                      <Input
                        type="date"
                        value={plan.startDate}
                        onChange={e => handleUpdatePlan('startDate', e.target.value)}
                        className="bg-white dark:bg-zinc-950"
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <Label className="text-xs text-gray-500">结束日期</Label>
                      <Input
                        type="date"
                        value={plan.endDate || ''}
                        onChange={e => handleUpdatePlan('endDate', e.target.value)}
                        className="bg-white dark:bg-zinc-950"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">总预算</Label>
                    <Input
                      type="number"
                      value={plan.budget}
                      onChange={e => handleUpdatePlan('budget', Number(e.target.value))}
                      className="bg-white dark:bg-zinc-950"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 统计图表 */}
             <div className="space-y-4">
               <Card className="dark:bg-zinc-900 dark:border-zinc-800 shadow-sm border-0 ring-1 ring-gray-200 dark:ring-zinc-800">
                 <CardHeader className="pb-2 pt-4 px-4">
                   <CardTitle className="text-sm font-medium">预算概览</CardTitle>
                 </CardHeader>
                 <CardContent className="px-4 pb-4">
                   <BudgetChart
                     budget={plan.budget}
                     estimated={budgetStats.estimated}
                     actual={budgetStats.actual}
                     currency={plan.currency}
                   />
                 </CardContent>
               </Card>
               {/* 可以在这里放日历缩略图，如果需要 */}
             </div>
          </div>

          {/* 右侧：日程详情 (占用 8 列) */}
          <div className="lg:col-span-8 space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">详细日程</h2>
                <span className="text-sm text-gray-500">
                   共 {plan.days.length} 天
                </span>
             </div>

             <div className="space-y-6">
               {plan.days.map(day => (
                 <PlanDayCard
                   key={day.id}
                   day={day}
                   onUpdateTheme={handleUpdateDayTheme}
                   onDeleteDay={(dayId) => setDeleteDayId(dayId)}
                   onAddActivity={handleAddActivity}
                   onUpdateActivity={handleSaveActivity}
                   onDeleteActivity={handleDeleteActivity}
                   onReorder={handleDragEnd}
                 />
               ))}

               {/* 添加新的一天 */}
               <Button
                 variant="outline"
                 className="w-full py-8 border-dashed border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 transition-all rounded-xl"
                 onClick={handleAddDay}
               >
                 <Plus className="w-5 h-5 mr-2" /> 
                 <span className="text-base">添加新的一天 (Day {plan.days.length + 1})</span>
               </Button>
             </div>
          </div>

        </div>
      </div>

      {/* 删除日程确认弹窗 */}
      <AlertDialog open={!!deleteDayId} onOpenChange={(open) => !open && setDeleteDayId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定删除这一天？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除该日期的所有活动，且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDay}
              className="bg-red-500 hover:bg-red-600"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
