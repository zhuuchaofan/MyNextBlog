"use client";

// =============================================================================
// AdminPageHeader - 统一的后台管理页面头部组件
// =============================================================================
// 提供一致的响应式布局：
// - 桌面端：返回按钮显示"< 返回"，标题旁显示统计信息
// - 移动端：返回按钮仅显示图标，统计信息移至第二行

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export interface AdminPageHeaderProps {
  /** 页面标题 */
  title: string;

  /** 标题前的图标 (可选) */
  icon?: React.ReactNode;

  /** 标题下方的描述文本 (用于 Presence 设置页等) */
  description?: React.ReactNode;

  /**
   * 统计信息/徽章区域
   * 接受 ReactNode 以支持单个或多个 Badge
   */
  stats?: React.ReactNode;

  /** 右侧操作按钮区 */
  actions?: React.ReactNode;

  /**
   * 是否正在加载
   * true 时隐藏 stats
   */
  loading?: boolean;
}

/**
 * 统一的后台管理页面头部组件
 *
 * @example
 * ```tsx
 * <AdminPageHeader
 *   title="友链管理"
 *   stats={
 *     <Badge className="bg-blue-100 text-blue-700">
 *       <LinkIcon className="w-3.5 h-3.5 mr-1" />
 *       共 {count} 个
 *     </Badge>
 *   }
 *   actions={
 *     <>
 *       <Button variant="outline" size="sm">刷新</Button>
 *       <Button>添加</Button>
 *     </>
 *   }
 * />
 * ```
 */
export function AdminPageHeader({
  title,
  icon,
  description,
  stats,
  actions,
  loading = false,
}: AdminPageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
      {/* Row 1: 返回按钮 + 标题 + (桌面端) 统计信息 */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* 返回按钮: 移动端仅图标，桌面端显示文字 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="h-8 w-8 p-0 sm:w-auto sm:px-3 text-gray-500 dark:text-gray-400 flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">返回</span>
        </Button>

        {/* 标题区域 */}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            {icon}
            <span className="truncate">{title}</span>
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              {description}
            </p>
          )}
        </div>

        {/* 桌面端统计信息: 移动端隐藏 */}
        {!loading && stats && (
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            {stats}
          </div>
        )}
      </div>

      {/* Row 2: (移动端) 统计信息 + 操作按钮 */}
      {(stats || actions) && (
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* 移动端统计信息: 桌面端隐藏 */}
          {!loading && stats && (
            <div className="sm:hidden flex items-center gap-2">{stats}</div>
          )}

          {/* 操作按钮 */}
          {actions && (
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
