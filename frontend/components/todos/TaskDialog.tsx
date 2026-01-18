'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { TodoTask, createTodo, updateTodo } from '@/lib/api-todo';

// 表单验证 Schema
const formSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100个字符'),
  description: z.string().max(500, '描述不能超过500个字符').optional(),
  stage: z.enum(['todo', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TodoTask | null;
  onSuccess: () => void;
}

/**
 * 任务创建/编辑弹窗
 */
export function TaskDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
}: TaskDialogProps) {
  const isEditing = !!task;
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      stage: 'todo',
      priority: 'medium',
      startDate: '',
      dueDate: '',
      reminderEnabled: false,
      reminderTime: '',
    },
  });

  const reminderEnabled = watch('reminderEnabled');

  // 编辑时填充数据
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        stage: task.stage,
        priority: task.priority,
        startDate: task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        reminderEnabled: task.reminderEnabled,
        reminderTime: task.reminderTime 
          ? format(new Date(task.reminderTime), "yyyy-MM-dd'T'HH:mm")
          : '',
      });
    } else {
      reset({
        title: '',
        description: '',
        stage: 'todo',
        priority: 'medium',
        startDate: '',
        dueDate: '',
        reminderEnabled: false,
        reminderTime: '',
      });
    }
  }, [task, reset]);

  // 提交表单
  const onSubmit = async (data: FormData) => {
    // 日期验证
    if (data.startDate && data.dueDate && data.dueDate < data.startDate) {
      toast.error('截止日期不能早于开始日期');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: data.title,
        description: data.description || undefined,
        stage: data.stage,
        priority: data.priority,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        reminderEnabled: data.reminderEnabled,
        reminderTime: data.reminderTime ? new Date(data.reminderTime).toISOString() : undefined,
      };

      if (isEditing && task) {
        await updateTodo(task.id, payload);
        toast.success('任务已更新');
      } else {
        await createTodo(payload);
        toast.success('任务已创建');
      }

      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑任务' : '新建任务'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              placeholder="输入任务标题"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              placeholder="输入任务描述（可选）"
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* 阶段和优先级 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>阶段</Label>
              <Select
                value={watch('stage')}
                onValueChange={(v) => setValue('stage', v as FormData['stage'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">📋 待办</SelectItem>
                  <SelectItem value="in_progress">🚀 进行中</SelectItem>
                  <SelectItem value="done">✅ 已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>优先级</Label>
              <Select
                value={watch('priority')}
                onValueChange={(v) => setValue('priority', v as FormData['priority'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 高</SelectItem>
                  <SelectItem value="medium">🟡 中</SelectItem>
                  <SelectItem value="low">🟢 低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">开始日期</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">截止日期</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
            </div>
          </div>

          {/* 提醒 */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <Label htmlFor="reminderEnabled">开启提醒</Label>
              <Switch
                id="reminderEnabled"
                checked={reminderEnabled}
                onCheckedChange={(v) => setValue('reminderEnabled', v)}
              />
            </div>
            {reminderEnabled && (
              <div className="space-y-2">
                <Label htmlFor="reminderTime">提醒时间</Label>
                <Input
                  id="reminderTime"
                  type="datetime-local"
                  {...register('reminderTime')}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : isEditing ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
