'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TodoTask } from '@/lib/api-todo';
import { TodoCard } from './TodoCard';

interface TodoColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: TodoTask[];
  onEdit: (task: TodoTask) => void;
  onRefresh: () => void;
}

/**
 * 看板阶段列组件
 */
export function TodoColumn({
  id,
  title,
  color,
  tasks,
  onEdit,
  onRefresh,
}: TodoColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col min-h-[400px] rounded-xl border-2 transition-colors
        bg-muted/30 dark:bg-zinc-900/50
        ${color}
        ${isOver ? 'bg-muted/60 dark:bg-zinc-800/70' : ''}
      `}
    >
      {/* 列标题 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h3 className="font-semibold text-base">{title}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 p-3 overflow-y-auto">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                暂无任务
              </div>
            ) : (
              tasks.map(task => (
                <TodoCard
                  key={task.id}
                  task={task}
                  onEdit={() => onEdit(task)}
                  onRefresh={onRefresh}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
