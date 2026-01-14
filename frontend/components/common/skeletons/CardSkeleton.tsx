// =============================================================================
// CardSkeleton - 卡片骨架屏组件
// =============================================================================
// 用于卡片列表的加载状态

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface CardSkeletonProps {
  /**
   * 显示的卡片数量
   * @default 3
   */
  count?: number;

  /**
   * 卡片变体
   * - default: 标准卡片 (标题 + 描述)
   * - image: 带图片的卡片
   * - compact: 紧凑卡片
   */
  variant?: 'default' | 'image' | 'compact';

  /**
   * Grid 布局列数配置
   * @default "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
   */
  gridCols?: string;

  /**
   * 额外的 className
   */
  className?: string;
}

/**
 * 卡片骨架屏组件
 *
 * @example
 * ```tsx
 * if (loading) return <CardSkeleton count={6} variant="image" />;
 * ```
 */
export function CardSkeleton({
  count = 3,
  variant = 'default',
  gridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  className,
}: CardSkeletonProps) {
  return (
    <div className={cn("grid gap-4 sm:gap-6", gridCols, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeletonItem key={index} variant={variant} />
      ))}
    </div>
  );
}

function CardSkeletonItem({ variant }: { variant: CardSkeletonProps['variant'] }) {
  if (variant === 'compact') {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'image') {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <Skeleton className="h-48 w-full rounded-none" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  // default
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4 sm:p-6 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}
