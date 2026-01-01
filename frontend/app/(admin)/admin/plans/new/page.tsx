'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createPlan, fetchAllAnniversariesAdmin, type AnniversaryAdmin } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarDays, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * 新建计划表单组件
 */
function NewPlanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anniversaries, setAnniversaries] = useState<AnniversaryAdmin[]>([]);
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'trip',
    startDate: '',
    endDate: '',
    budget: 0,
    currency: 'CNY',
    isSecret: false,
    enableReminder: false,
    reminderEmail: '',
    reminderDays: '7,3,1,0',
    anniversaryId: '',
  });

  // 从 URL 参数初始化 anniversaryId
  useEffect(() => {
    const anniversaryIdParam = searchParams.get('anniversaryId');
    if (anniversaryIdParam) {
      setFormData(prev => ({ ...prev, anniversaryId: anniversaryIdParam }));
    }
  }, [searchParams]);

  // 权限检查
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'Admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 加载纪念日列表（用于关联）
  useEffect(() => {
    const loadAnniversaries = async () => {
      try {
        const data = await fetchAllAnniversariesAdmin();
        setAnniversaries(data);
      } catch (error) {
        console.error('Failed to load anniversaries:', error);
      }
    };
    loadAnniversaries();
  }, []);

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('请输入计划标题');
      return;
    }
    if (!formData.startDate) {
      toast.error('请选择开始日期');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPlan({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        budget: formData.budget,
        currency: formData.currency,
        isSecret: formData.isSecret,
        enableReminder: formData.enableReminder,
        reminderEmail: formData.reminderEmail || undefined,
        reminderDays: formData.reminderDays,
        anniversaryId: formData.anniversaryId ? Number(formData.anniversaryId) : undefined,
      });
      
      toast.success('计划创建成功！');
      router.push('/admin/plans');
    } catch (error) {
      console.error('Failed to create plan:', error);
      toast.error('创建失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-2xl">
      {/* 页面标题 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4 mr-1" /> 返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-500" /> 新建计划
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            创建旅行计划或活动安排
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 标题 */}
            <div className="space-y-2">
              <Label htmlFor="title">计划标题 *</Label>
              <Input
                id="title"
                placeholder="例如：东京5日游"
                maxLength={50}
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="计划描述..."
                maxLength={200}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* 类型 */}
            <div className="space-y-2">
              <Label>计划类型</Label>
              <Select
                value={formData.type}
                onValueChange={value => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trip">🛫 旅行</SelectItem>
                  <SelectItem value="event">🎉 活动</SelectItem>
                  <SelectItem value="surprise">🎁 惊喜</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 日期 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">开始日期 *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">结束日期</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* 预算 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">预算</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  value={formData.budget}
                  onChange={e => setFormData({ ...formData, budget: Math.max(0, Number(e.target.value)) })}
                />
              </div>
              <div className="space-y-2">
                <Label>货币</Label>
                <Select
                  value={formData.currency}
                  onValueChange={value => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CNY">¥ CNY</SelectItem>
                    <SelectItem value="JPY">¥ JPY</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 关联纪念日 */}
            <div className="space-y-2">
              <Label>关联纪念日</Label>
              <Select
                value={formData.anniversaryId || 'none'}
                onValueChange={value => setFormData({ ...formData, anniversaryId: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择关联的纪念日（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不关联</SelectItem>
                  {anniversaries.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.emoji} {a.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 惊喜标记 */}
            <div className="flex items-center justify-between">
              <div>
                <Label>惊喜标记</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  当天会弹窗提醒自己
                </p>
              </div>
              <Switch
                checked={formData.isSecret}
                onCheckedChange={checked => setFormData({ ...formData, isSecret: checked })}
              />
            </div>

            {/* 邮件提醒 */}
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label>邮件提醒</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    提前发送邮件提醒
                  </p>
                </div>
                <Switch
                  checked={formData.enableReminder}
                  onCheckedChange={checked => setFormData({ ...formData, enableReminder: checked })}
                />
              </div>
              
              {formData.enableReminder && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reminderEmail">提醒邮箱</Label>
                    <Input
                      id="reminderEmail"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.reminderEmail}
                      onChange={e => setFormData({ ...formData, reminderEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminderDays">提前天数</Label>
                    <Input
                      id="reminderDays"
                      placeholder="7,3,1,0"
                      value={formData.reminderDays}
                      onChange={e => setFormData({ ...formData, reminderDays: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">逗号分隔，0 表示当天</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex gap-4 mt-6">
          <Button type="button" variant="outline" className="w-full flex-1" onClick={() => router.back()}>
            取消
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-blue-500 hover:bg-blue-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                创建中...
              </>
            ) : (
              '创建计划'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * 新建计划页面 - 用 Suspense 包裹
 */
export default function NewPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <NewPlanForm />
    </Suspense>
  );
}
