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
import { 
  ClipboardList, 
  Rocket, 
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Circle,
  Layers,
  BookOpen,
  ListTodo,
} from 'lucide-react';
import { 
  TodoTask, 
  TaskType, 
  TaskStage, 
  TaskPriority,
  createTodo, 
  updateTodo,
} from '@/lib/api-todo';

// 表单验证 Schema
const formSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100个字符'),
  description: z.string().max(500, '描述不能超过500个字符').optional(),
  taskType: z.enum(['epic', 'story', 'task']),
  stage: z.enum(['todo', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  reminderEnabled: z.boolean(),
  reminderDays: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TodoTask | null;
  parentId?: number;  // 创建子任务时传入
  onSuccess: () => void;
}

/**
 * 任务创建/编辑弹窗
 */
export function TaskDialog({
  open,
  onOpenChange,
  task,
  parentId,
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
      taskType: parentId ? 'task' : 'epic',  // 子任务默认是 task
      stage: 'todo',
      priority: 'medium',
      startDate: '',
      dueDate: '',
      reminderEnabled: false,
      reminderDays: '7,3,1,0',
    },
  });

  const reminderEnabled = watch('reminderEnabled');
  const taskType = watch('taskType');

  // 编辑时填充数据
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        taskType: task.taskType as TaskType,
        stage: task.stage,
        priority: task.priority,
        startDate: task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        reminderEnabled: task.reminderEnabled,
        reminderDays: task.reminderDays || '7,3,1,0',
      });
    } else {
      reset({
        title: '',
        description: '',
        taskType: parentId ? 'task' : 'epic',
        stage: 'todo',
        priority: 'medium',
        startDate: '',
        dueDate: '',
        reminderEnabled: false,
        reminderDays: '7,3,1,0',
      });
    }
  }, [task, parentId, reset]);

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
        taskType: data.taskType,
        stage: data.stage as TaskStage,
        priority: data.priority as TaskPriority,
        parentId: parentId,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        reminderEnabled: data.reminderEnabled,
        reminderDays: data.reminderDays || '7,3,1,0',
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

  // 获取对话框标题
  const getDialogTitle = () => {
    if (isEditing) return '编辑任务';
    if (parentId) return '添加子任务';
    return '新建任务';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
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
              rows={2}
              {...register('description')}
            />
          </div>

          {/* 任务类型（仅顶级任务可选） */}
          {!parentId && (
            <div className="space-y-2">
              <Label>任务类型</Label>
              <Select
                value={taskType}
                onValueChange={(v) => setValue('taskType', v as TaskType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="epic">
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-500" />
                      史诗 (Epic)
                    </span>
                  </SelectItem>
                  <SelectItem value="story">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      故事 (Story)
                    </span>
                  </SelectItem>
                  <SelectItem value="task">
                    <span className="flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-green-500" />
                      任务 (Task)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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
                  <SelectItem value="todo">
                    <span className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      待办
                    </span>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <span className="flex items-center gap-2">
                      <Rocket className="w-4 h-4" />
                      进行中
                    </span>
                  </SelectItem>
                  <SelectItem value="done">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      已完成
                    </span>
                  </SelectItem>
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
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      高
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      中
                    </span>
                  </SelectItem>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <Circle className="w-4 h-4 text-green-500" />
                      低
                    </span>
                  </SelectItem>
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
                <Label htmlFor="reminderDays">提醒天数（截止前 N 天，逗号分隔）</Label>
                <Input
                  id="reminderDays"
                  placeholder="7,3,1,0"
                  {...register('reminderDays')}
                />
                <p className="text-xs text-muted-foreground">
                  例如：7,3,1,0 表示截止前 7、3、1、0 天各发一次提醒
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
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
