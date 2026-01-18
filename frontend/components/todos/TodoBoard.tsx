'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  TodoTask, 
  fetchTodos, 
  batchUpdateTodoSort 
} from '@/lib/api-todo';
import { TodoColumn } from './TodoColumn';
import { TaskDialog } from './TaskDialog';
import { TodoCard } from './TodoCard';

/**
 * 阶段配置
 */
const STAGES = [
  { id: 'todo', title: '📋 待办', color: 'border-yellow-500' },
  { id: 'in_progress', title: '🚀 进行中', color: 'border-blue-500' },
  { id: 'done', title: '✅ 已完成', color: 'border-green-500' },
] as const;

/**
 * Kanban 看板组件
 */
export function TodoBoard() {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<TodoTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null);

  // 拖拽 sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // 加载任务
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTodos();
      setTasks(data);
    } catch {
      toast.error('加载任务失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // 按阶段分组
  const getTasksByStage = (stage: string) => {
    return tasks
      .filter(t => t.stage === stage)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  // 开始拖拽
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  // 拖拽经过
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    // 找到源任务
    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // 判断目标是列还是任务
    const overStage = STAGES.find(s => s.id === overId)?.id;
    const overTask = tasks.find(t => t.id === overId);
    const targetStage = overStage || overTask?.stage;

    if (!targetStage || activeTask.stage === targetStage) return;

    // 更新本地状态（跨列移动）
    setTasks(prev => prev.map(t => 
      t.id === activeId ? { ...t, stage: targetStage as TodoTask['stage'] } : t
    ));
  };

  // 拖拽结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    // 找到源任务
    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // 判断目标
    const overStage = STAGES.find(s => s.id === overId)?.id;
    const overTask = tasks.find(t => t.id === overId);
    const targetStage = overStage || overTask?.stage || activeTask.stage;

    // 获取目标列的任务
    const columnTasks = tasks
      .filter(t => t.stage === targetStage)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // 计算新顺序
    const newTasks = [...tasks];
    
    if (overTask && overTask.stage === targetStage) {
      // 在同一列内排序
      const oldIndex = columnTasks.findIndex(t => t.id === activeId);
      const newIndex = columnTasks.findIndex(t => t.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(columnTasks, oldIndex, newIndex);
        reordered.forEach((t, idx) => {
          const task = newTasks.find(nt => nt.id === t.id);
          if (task) task.sortOrder = idx;
        });
      }
    } else {
      // 跨列移动 - 放到目标列末尾
      const task = newTasks.find(t => t.id === activeId);
      if (task) {
        task.stage = targetStage as TodoTask['stage'];
        task.sortOrder = columnTasks.length;
      }
    }

    setTasks(newTasks);

    // 保存到服务器
    try {
      const items = newTasks.map(t => ({
        id: t.id,
        stage: t.stage,
        sortOrder: t.sortOrder,
      }));
      await batchUpdateTodoSort(items);
    } catch {
      toast.error('保存排序失败');
      loadTasks(); // 回滚
    }
  };

  // 打开编辑弹窗
  const handleEdit = (task: TodoTask) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  // 创建成功后刷新
  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingTask(null);
    loadTasks();
  };

  return (
    <div className="space-y-4">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          共 {tasks.length} 个任务
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTasks}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            新建任务
          </Button>
        </div>
      </div>

      {/* 看板 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STAGES.map(stage => (
            <TodoColumn
              key={stage.id}
              id={stage.id}
              title={stage.title}
              color={stage.color}
              tasks={getTasksByStage(stage.id)}
              onEdit={handleEdit}
              onRefresh={loadTasks}
            />
          ))}
        </div>

        {/* 拖拽覆盖层 */}
        <DragOverlay>
          {activeTask && <TodoCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>

      {/* 任务弹窗 */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => {
          setDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
