// =============================================================================
// PageSkeleton - 页面级骨架屏组件
// =============================================================================
// 用于整页加载状态，替代中心 Loader2

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "../PageContainer";
import type { ContainerVariant, MaxWidthKey } from "@/lib/design-tokens";

export interface PageSkeletonProps {
  /**
   * 容器变体
   */
  variant?: ContainerVariant | 'public-hero';

  /**
   * 最大宽度
   */
  maxWidth?: MaxWidthKey;

  /**
   * 骨架内容类型
   * - header: 仅显示头部骨架
   * - list: 头部 + 列表骨架
   * - cards: 头部 + 卡片网格骨架
   * - form: 头部 + 表单骨架
   */
  type?: 'header' | 'list' | 'cards' | 'form';

  /**
   * 额外的 className
   */
  className?: string;
}

/**
 * 页面级骨架屏组件
 *
 * @example
 * ```tsx
 * if (loading) return <PageSkeleton variant="admin" type="list" />;
 * ```
 */
export function PageSkeleton({
  variant = 'admin',
  maxWidth,
  type = 'list',
  className,
}: PageSkeletonProps) {
  return (
    <PageContainer variant={variant} maxWidth={maxWidth} className={className}>
      {/* 头部骨架 */}
      <div className="flex items-center gap-4 mb-6 sm:mb-8">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-24 hidden sm:block" />
      </div>

      {/* 内容骨架 */}
      {type === 'list' && <ListSkeleton />}
      {type === 'cards' && <CardGridSkeleton />}
      {type === 'form' && <FormSkeleton />}
    </PageContainer>
  );
}

function ListSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
      {/* 表头 */}
      <div className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800 px-4 py-3">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
        </div>
      </div>
      {/* 行 */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-4 py-4 border-b border-gray-100 dark:border-zinc-800 last:border-0">
          <div className="flex gap-4 items-center">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-8 w-16 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4 sm:p-6 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4 sm:p-6 space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
