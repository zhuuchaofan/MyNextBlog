'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  GripVertical, 
  Trash2, 
  Bell,
  BellOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { TodoTask, deleteTodo } from '@/lib/api-todo';

interface TodoCardProps {
  task: TodoTask;
  isDragging?: boolean;
  onEdit?: () => void;
  onRefresh?: () => void;
}

/**
 * 优先级配置
 */
const PRIORITY_CONFIG = {
  high: { label: '高', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  medium: { label: '中', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  low: { label: '低', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

/**
 * 任务卡片组件
 */
export function TodoCard({ task, isDragging, onEdit, onRefresh }: TodoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging || isDragging ? 0.5 : 1,
  };

  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  // 删除任务
  const handleDelete = async () => {
    try {
      await deleteTodo(task.id);
      toast.success('任务已删除');
      onRefresh?.();
    } catch {
      toast.error('删除失败');
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'M月d日', { locale: zhCN });
    } catch {
      return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        group relative p-3 rounded-lg border bg-background shadow-sm 
        hover:shadow-md transition-shadow cursor-pointer
        ${isDragging ? 'shadow-lg ring-2 ring-primary/50' : ''}
      `}
      onClick={onEdit}
    >
      {/* 顶部：拖拽手柄 + 优先级 + 提醒状态 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <Badge variant="secondary" className={`text-xs ${priority.color}`}>
            {priority.label}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {task.reminderEnabled ? (
            <Bell className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <BellOff className="w-3.5 h-3.5 text-muted-foreground/30" />
          )}
        </div>
      </div>

      {/* 标题 */}
      <h4 className="font-medium text-sm leading-tight mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* 描述 */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {task.description}
        </p>
      )}

      {/* 日期信息 */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {task.startDate && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(task.startDate)}</span>
          </div>
        )}
        {task.dueDate && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>

      {/* 删除按钮 */}
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              className="h-6 w-6 rounded-full shadow"
              onClick={e => e.stopPropagation()}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={e => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除？</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除任务「{task.title}」吗？此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
