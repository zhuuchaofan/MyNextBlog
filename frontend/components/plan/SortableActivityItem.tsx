'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * 可拖拽的活动项包装组件
 * 
 * @description 使用 @dnd-kit/sortable 实现拖拽排序功能。
 * 整个子元素区域都可作为拖拽手柄。
 * 
 * @example
 * <SortableActivityItem id={activity.id}>
 *   <ActivityCard activity={activity} />
 * </SortableActivityItem>
 */
interface SortableActivityItemProps {
  /** 活动的唯一 ID，用于排序识别 */
  id: number;
  /** 子元素 (活动卡片内容) */
  children: React.ReactNode;
}

export function SortableActivityItem({ id, children }: SortableActivityItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        {children}
      </div>
    </div>
  );
}
