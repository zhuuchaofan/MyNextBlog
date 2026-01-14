// =============================================================================
// TableSkeleton - 表格骨架屏组件
// =============================================================================
// 替代 Loader2 旋转图标，提供更好的加载体验

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface TableSkeletonProps {
  /**
   * 显示的行数
   * @default 5
   */
  rows?: number;

  /**
   * 显示的列数
   * @default 4
   */
  columns?: number;

  /**
   * 是否显示表头
   * @default true
   */
  showHeader?: boolean;

  /**
   * 额外的 className
   */
  className?: string;
}

/**
 * 表格骨架屏组件
 *
 * @example
 * ```tsx
 * if (loading) return <TableSkeleton rows={5} columns={4} />;
 * ```
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 overflow-hidden",
        className
      )}
    >
      {/* 表头骨架 */}
      {showHeader && (
        <div className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800 px-4 py-3">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  "h-4",
                  i === 0 ? "w-1/4" : "w-1/6"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* 表格行骨架 */}
      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-4">
            <div className="flex gap-4 items-center">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  className={cn(
                    "h-4",
                    colIndex === 0 ? "w-1/4" : colIndex === 1 ? "w-1/5" : "w-1/6"
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
