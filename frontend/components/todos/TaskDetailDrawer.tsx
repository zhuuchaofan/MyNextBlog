'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Bell,
  BellOff,
  Layers,
  BookOpen,
  ListTodo,
  ChevronRight,
  Check,
} from 'lucide-react';
import { TodoTask, deleteTodo, updateTodo, countChildren } from '@/lib/api-todo';
import { TaskDialog } from './TaskDialog';

interface TaskDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TodoTask | null;
  onRefresh: () => void;
}

/**
 * 任务类型配置
 */
const TASK_TYPE_CONFIG = {
  epic: { icon: Layers, color: 'text-purple-500', label: '史诗' },
  story: { icon: BookOpen, color: 'text-blue-500', label: '故事' },
  task: { icon: ListTodo, color: 'text-green-500', label: '任务' },
};

/**
 * 优先级配置
 */
const PRIORITY_CONFIG = {
  high: { label: '高', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  medium: { label: '中', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  low: { label: '低', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

/**
 * 阶段配置
 */
const STAGE_CONFIG = {
  todo: { label: '待办', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  done: { label: '已完成', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

/**
 * 任务详情侧边栏
 */
export function TaskDetailDrawer({
  open,
  onOpenChange,
  task,
  onRefresh,
}: TaskDetailDrawerProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addSubtaskDialogOpen, setAddSubtaskDialogOpen] = useState(false);
  const [addSubtaskParentId, setAddSubtaskParentId] = useState<number | null>(null);

  if (!task) return null;

  const typeConfig = TASK_TYPE_CONFIG[task.taskType] || TASK_TYPE_CONFIG.task;
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const stageConfig = STAGE_CONFIG[task.stage] || STAGE_CONFIG.todo;
  const TypeIcon = typeConfig.icon;

  // 计算任务深度
  const getDepth = (t: TodoTask): number => {
    // 根任务始终为 depth 1，子任务通过 parentId 判断
    return t.parentId ? 2 : 1;  // 简化处理，实际深度由后端控制
  };

  // 是否可以添加子任务（最多3层）
  const canAddSubtask = getDepth(task) < 3;

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'yyyy年M月d日', { locale: zhCN });
    } catch {
      return '-';
    }
  };

  // 删除任务
  const handleDelete = async () => {
    try {
      await deleteTodo(task.id);
      toast.success('任务已删除');
      onOpenChange(false);
      onRefresh();
    } catch {
      toast.error('删除失败');
    }
  };

  // 快速完成
  const handleQuickComplete = async () => {
    try {
      await updateTodo(task.id, { stage: 'done' });
      toast.success('任务已完成');
      onRefresh();
    } catch {
      toast.error('操作失败');
    }
  };

  // 添加子任务
  const handleAddSubtask = (parentId: number) => {
    setAddSubtaskParentId(parentId);
    setAddSubtaskDialogOpen(true);
  };

  // 子任务创建成功
  const handleSubtaskSuccess = () => {
    setAddSubtaskDialogOpen(false);
    setAddSubtaskParentId(null);
    onRefresh();
  };

  // 编辑成功
  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    onRefresh();
  };

  // 递归渲染子任务列表
  const renderSubtaskList = (subtasks: TodoTask[] | null | undefined, depth: number = 1) => {
    if (!subtasks?.length) return null;

    return (
      <div className={`space-y-1.5 sm:space-y-2 ${depth > 1 ? 'ml-2 sm:ml-4 border-l pl-2 sm:pl-3' : ''}`}>
        {subtasks.map(subtask => {
          const subTypeConfig = TASK_TYPE_CONFIG[subtask.taskType] || TASK_TYPE_CONFIG.task;
          const SubTypeIcon = subTypeConfig.icon;
          const subStageConfig = STAGE_CONFIG[subtask.stage] || STAGE_CONFIG.todo;
          const canAddChildSubtask = depth < 2;  // 最多3层

          return (
            <div key={subtask.id} className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <SubTypeIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${subTypeConfig.color}`} />
                  <span className={`text-xs sm:text-sm truncate ${subtask.stage === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                    {subtask.title}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  <Badge variant="secondary" className={`text-[10px] sm:text-xs px-1.5 py-0 sm:px-2 ${subStageConfig.color}`}>
                    {subStageConfig.label}
                  </Badge>
                  {canAddChildSubtask && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 sm:h-6 sm:w-6"
                      onClick={() => handleAddSubtask(subtask.id)}
                      title="添加子任务"
                    >
                      <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </Button>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                </div>
              </div>
              {/* 递归渲染子任务的子任务 */}
              {renderSubtaskList(subtask.children, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto px-4 sm:px-6">
          <SheetHeader className="space-y-1.5 pb-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TypeIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${typeConfig.color}`} />
              <Badge variant="outline" className="text-xs">
                {typeConfig.label}
              </Badge>
            </div>
            <SheetTitle className="text-left text-base sm:text-lg break-words">
              {task.title}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-3 sm:space-y-4">
            {/* 阶段和优先级 */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Badge variant="secondary" className={`text-xs ${stageConfig.color}`}>
                {stageConfig.label}
              </Badge>
              <Badge variant="secondary" className={`text-xs ${priorityConfig.color}`}>
                优先级: {priorityConfig.label}
              </Badge>
            </div>

            {/* 描述 */}
            {task.description && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">描述</p>
                <p className="text-sm">{task.description}</p>
              </div>
            )}

            {/* 日期信息 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
              <div className="flex items-center justify-between sm:block sm:space-y-1">
                <p className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  开始日期
                </p>
                <p className="font-medium">{formatDate(task.startDate)}</p>
              </div>
              <div className="flex items-center justify-between sm:block sm:space-y-1">
                <p className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  截止日期
                </p>
                <p className="font-medium">{formatDate(task.dueDate)}</p>
              </div>
            </div>

            {/* 提醒状态 */}
            <div className="flex items-center gap-2 text-sm">
              {task.reminderEnabled ? (
                <>
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>提醒已开启 ({task.reminderDays})</span>
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">提醒未开启</span>
                </>
              )}
            </div>

            <Separator />

            {/* 子任务区域 */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-medium">子任务 ({countChildren(task)})</h3>
                {canAddSubtask && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSubtask(task.id)}
                    className="h-8 text-xs sm:text-sm flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span className="hidden sm:inline">添加</span>子任务
                  </Button>
                )}
              </div>

              {task.children?.length ? (
                renderSubtaskList(task.children)
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 sm:py-4">
                  暂无子任务
                </p>
              )}
            </div>

            <Separator />

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-2">
              {task.stage !== 'done' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickComplete}
                  className="flex-1 h-9"
                >
                  <Check className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">标记</span>完成
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="flex-1 h-9"
              >
                <Edit className="w-4 h-4 mr-1" />
                编辑
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="h-9 px-3">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除？</AlertDialogTitle>
                    <AlertDialogDescription>
                      确定要删除任务「{task.title}」吗？
                      {countChildren(task) > 0 && (
                        <span className="block mt-2 text-destructive font-medium">
                          ⚠️ 此任务包含 {countChildren(task)} 个子任务，将一并删除！
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <AlertDialogCancel className="w-full sm:w-auto">取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto">
                      删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 编辑弹窗 */}
      <TaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={task}
        onSuccess={handleEditSuccess}
      />

      {/* 添加子任务弹窗 */}
      <TaskDialog
        open={addSubtaskDialogOpen}
        onOpenChange={setAddSubtaskDialogOpen}
        parentId={addSubtaskParentId ?? undefined}
        onSuccess={handleSubtaskSuccess}
      />
    </>
  );
}
