'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  fetchPlanById,
  updatePlan,
  addPlanDay,
  updatePlanDay,
  deletePlanDay,
  addPlanActivity,
  updatePlanActivity,
  deletePlanActivity,
  type PlanDetail,
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CalendarDays,
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  MapPin,
  Clock,
  DollarSign,
  Edit,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import PlanCalendarView from '@/components/plan/PlanCalendarView';
import BudgetChart from '@/components/plan/BudgetChart';

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
  
  // 编辑状态
  const [editingDayId, setEditingDayId] = useState<number | null>(null);
  const [newDayTheme, setNewDayTheme] = useState('');
  const [newActivityDayId, setNewActivityDayId] = useState<number | null>(null);
  const [newActivity, setNewActivity] = useState({ title: '', time: '', location: '', estimatedCost: 0 });
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);
  const [editingActivity, setEditingActivity] = useState({ title: '', time: '', location: '', estimatedCost: 0, actualCost: 0, notes: '' });

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
    
    const nextDayNumber = plan.days.length + 1;
    const startDate = new Date(plan.startDate);
    startDate.setDate(startDate.getDate() + nextDayNumber - 1);
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
      setEditingDayId(null);
      toast.success('已保存');
    } catch (error) {
      console.error('Failed to update day:', error);
      toast.error('保存失败');
    }
  };

  // 删除某天
  const handleDeleteDay = async (dayId: number) => {
    if (!confirm('确定要删除这一天吗？所有活动也会被删除。')) return;
    
    try {
      await deletePlanDay(planId, dayId);
      setPlan({
        ...plan!,
        days: plan!.days.filter(d => d.id !== dayId),
      });
      toast.success('已删除');
    } catch (error) {
      console.error('Failed to delete day:', error);
      toast.error('删除失败');
    }
  };

  // 添加活动
  const handleAddActivity = async (dayId: number) => {
    if (!newActivity.title.trim()) {
      toast.error('请输入活动名称');
      return;
    }
    
    try {
      const activity = await addPlanActivity(dayId, {
        title: newActivity.title,
        time: newActivity.time || undefined,
        location: newActivity.location || undefined,
        estimatedCost: newActivity.estimatedCost,
        sortOrder: plan!.days.find(d => d.id === dayId)?.activities.length || 0,
      });
      
      setPlan({
        ...plan!,
        days: plan!.days.map(d =>
          d.id === dayId ? { ...d, activities: [...d.activities, activity] } : d
        ),
      });
      setNewActivityDayId(null);
      setNewActivity({ title: '', time: '', location: '', estimatedCost: 0 });
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

  // 开始编辑活动
  const handleStartEditActivity = (activity: { id: number; title: string; time?: string | null; location?: string | null; estimatedCost: number; actualCost: number; notes?: string | null }) => {
    setEditingActivityId(activity.id);
    setEditingActivity({
      title: activity.title,
      time: activity.time || '',
      location: activity.location || '',
      estimatedCost: activity.estimatedCost,
      actualCost: activity.actualCost,
      notes: activity.notes || '',
    });
  };

  // 保存活动编辑
  const handleSaveActivity = async (dayId: number) => {
    if (!editingActivityId) return;
    
    try {
      await updatePlanActivity(editingActivityId, {
        title: editingActivity.title,
        time: editingActivity.time || undefined,
        location: editingActivity.location || undefined,
        estimatedCost: editingActivity.estimatedCost,
        actualCost: editingActivity.actualCost,
        notes: editingActivity.notes || undefined,
      });
      
      // 更新本地状态
      setPlan({
        ...plan!,
        days: plan!.days.map(d =>
          d.id === dayId
            ? {
                ...d,
                activities: d.activities.map(a =>
                  a.id === editingActivityId
                    ? { ...a, ...editingActivity }
                    : a
                ),
              }
            : d
        ),
      });
      
      setEditingActivityId(null);
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/plans">
            <Button variant="ghost">
              <ChevronLeft className="w-4 h-4 mr-1" /> 返回
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-blue-500" />
              {plan.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {plan.startDate} {plan.endDate && `~ ${plan.endDate}`} · {
                plan.endDate 
                  ? Math.ceil((new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                  : 1
              } 天
            </p>
          </div>
        </div>
        
        {/* 状态切换 */}
        <Select
          value={plan.status}
          onValueChange={value => handleUpdatePlan('status', value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 基本信息编辑 */}
      <Card className="dark:bg-zinc-900 dark:border-zinc-800 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>计划名称</Label>
              <Input
                value={plan.title}
                onChange={e => handleUpdatePlan('title', e.target.value)}
                placeholder="输入计划名称"
              />
            </div>
            <div className="space-y-2">
              <Label>计划类型</Label>
              <Select
                value={plan.type}
                onValueChange={value => handleUpdatePlan('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trip">✈️ 旅行</SelectItem>
                  <SelectItem value="event">🎉 活动</SelectItem>
                  <SelectItem value="surprise">🎁 惊喜</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>开始日期</Label>
              <Input
                type="date"
                value={plan.startDate}
                onChange={e => handleUpdatePlan('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>结束日期</Label>
              <Input
                type="date"
                value={plan.endDate || ''}
                onChange={e => handleUpdatePlan('endDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>预算</Label>
              <Input
                type="number"
                value={plan.budget}
                onChange={e => handleUpdatePlan('budget', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>货币</Label>
              <Select
                value={plan.currency}
                onValueChange={value => handleUpdatePlan('currency', value)}
              >
                <SelectTrigger>
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
        </CardContent>
      </Card>

      {/* 日历与预算概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 日历视图 */}
        <Card className="dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">日历视图</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanCalendarView
              startDate={plan.startDate}
              endDate={plan.endDate}
            />
          </CardContent>
        </Card>

        {/* 预算图表 */}
        <Card className="dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">预算概览</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetChart
              budget={plan.budget}
              estimated={budgetStats.estimated}
              actual={budgetStats.actual}
              currency={plan.currency}
            />
          </CardContent>
        </Card>
      </div>

      {/* 日程列表 */}
      <div className="space-y-4">
        {plan.days.map(day => (
          <Card key={day.id} className="dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm">
                    Day {day.dayNumber}
                  </Badge>
                  {editingDayId === day.id ? (
                    <Input
                      value={newDayTheme}
                      onChange={e => setNewDayTheme(e.target.value)}
                      onBlur={() => handleUpdateDayTheme(day.id, newDayTheme)}
                      onKeyDown={e => e.key === 'Enter' && handleUpdateDayTheme(day.id, newDayTheme)}
                      className="w-48"
                      autoFocus
                    />
                  ) : (
                    <CardTitle
                      className="text-lg cursor-pointer hover:text-blue-500"
                      onClick={() => {
                        setEditingDayId(day.id);
                        setNewDayTheme(day.theme || '');
                      }}
                    >
                      {day.theme || '点击添加主题'}
                    </CardTitle>
                  )}
                  <span className="text-sm text-gray-500">{day.date}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => handleDeleteDay(day.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {/* 活动列表 */}
              <div className="space-y-2">
                {day.activities.map(activity => (
                  <div key={activity.id}>
                    {editingActivityId === activity.id ? (
                      /* 编辑模式 */
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="活动名称 *"
                            value={editingActivity.title}
                            onChange={e => setEditingActivity({ ...editingActivity, title: e.target.value })}
                          />
                          <Input
                            placeholder="时间 (如 09:00)"
                            value={editingActivity.time}
                            onChange={e => setEditingActivity({ ...editingActivity, time: e.target.value })}
                          />
                          <Input
                            placeholder="地点"
                            value={editingActivity.location}
                            onChange={e => setEditingActivity({ ...editingActivity, location: e.target.value })}
                          />
                          <Input
                            type="number"
                            placeholder="预估花费"
                            value={editingActivity.estimatedCost || ''}
                            onChange={e => setEditingActivity({ ...editingActivity, estimatedCost: Number(e.target.value) })}
                          />
                          <Input
                            type="number"
                            placeholder="实际花费"
                            value={editingActivity.actualCost || ''}
                            onChange={e => setEditingActivity({ ...editingActivity, actualCost: Number(e.target.value) })}
                          />
                          <Input
                            placeholder="备注"
                            value={editingActivity.notes}
                            onChange={e => setEditingActivity({ ...editingActivity, notes: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveActivity(day.id)}>
                            <Check className="w-4 h-4 mr-1" /> 保存
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingActivityId(null)}>
                            <X className="w-4 h-4 mr-1" /> 取消
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* 显示模式 */
                      <div
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg group cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-colors"
                        onClick={() => handleStartEditActivity(activity)}
                      >
                        <div className="flex items-center gap-4">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {activity.title}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              {activity.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {activity.time}
                                </span>
                              )}
                              {activity.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {activity.location}
                                </span>
                              )}
                              {activity.estimatedCost > 0 && (
                                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                  <DollarSign className="w-3 h-3" /> 预估 {activity.estimatedCost}
                                </span>
                              )}
                              {activity.actualCost > 0 && (
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <DollarSign className="w-3 h-3" /> 实际 {activity.actualCost}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 text-blue-500"
                            onClick={(e) => { e.stopPropagation(); handleStartEditActivity(activity); }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 text-red-500"
                            onClick={(e) => { e.stopPropagation(); handleDeleteActivity(day.id, activity.id); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 添加活动表单 */}
              {newActivityDayId === day.id ? (
                <div className="mt-3 p-3 border border-dashed rounded-lg dark:border-zinc-700 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="活动名称 *"
                      value={newActivity.title}
                      onChange={e => setNewActivity({ ...newActivity, title: e.target.value })}
                    />
                    <Input
                      placeholder="时间 (如 09:00)"
                      value={newActivity.time}
                      onChange={e => setNewActivity({ ...newActivity, time: e.target.value })}
                    />
                    <Input
                      placeholder="地点"
                      value={newActivity.location}
                      onChange={e => setNewActivity({ ...newActivity, location: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="预估花费"
                      value={newActivity.estimatedCost || ''}
                      onChange={e => setNewActivity({ ...newActivity, estimatedCost: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAddActivity(day.id)}>
                      添加
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setNewActivityDayId(null)}>
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full text-gray-500"
                  onClick={() => setNewActivityDayId(day.id)}
                >
                  <Plus className="w-4 h-4 mr-1" /> 添加活动
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {/* 添加新的一天 */}
        <Button
          variant="outline"
          className="w-full py-6 border-dashed"
          onClick={handleAddDay}
        >
          <Plus className="w-4 h-4 mr-2" /> 添加新的一天
        </Button>
      </div>
    </div>
  );
}
