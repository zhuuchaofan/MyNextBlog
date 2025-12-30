'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * 可拖拽的活动项包装组件
 * 
 * @description 使用 @dnd-kit/sortable 实现拖拽排序功能。
 * 编辑模式时禁用拖拽功能，避免表单位置异常。
 * 
 * @example
 * <SortableActivityItem id={activity.id} isEditing={false}>
 *   <ActivityCard activity={activity} />
 * </SortableActivityItem>
 */
interface SortableActivityItemProps {
  /** 活动的唯一 ID，用于排序识别 */
  id: number;
  /** 是否正在编辑（编辑时禁用拖拽） */
  isEditing?: boolean;
  /** 子元素 (活动卡片内容) */
  children: React.ReactNode;
}

export function SortableActivityItem({ id, isEditing = false, children }: SortableActivityItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* 编辑模式时不添加拖拽监听器 */}
      {isEditing ? (
        <div>{children}</div>
      ) : (
        <div {...listeners} className="cursor-grab active:cursor-grabbing">
          {children}
        </div>
      )}
    </div>
  );
}
