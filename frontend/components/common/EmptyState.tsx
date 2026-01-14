// =============================================================================
// EmptyState - 统一空状态组件
// =============================================================================
// 提供一致的空状态展示，包含图标、标题、描述和可选操作按钮

import { cn } from "@/lib/utils";
import { Package } from "lucide-react";
import {
  EMPTY_STATE_MESSAGES,
  type EmptyStateKey,
} from "@/lib/design-tokens";

export interface EmptyStateProps {
  /**
   * 语义化图标 (可选)
   * @default <Package /> (通用包裹图标)
   */
  icon?: React.ReactNode;

  /**
   * 主标题
   * 可以是自定义字符串或预设 key
   */
  title: string;

  /**
   * 副标题/描述 (可选)
   */
  description?: string;

  /**
   * 操作按钮 (可选)
   * 例如 "添加新项" 按钮
   */
  action?: React.ReactNode;

  /**
   * 样式变体
   * - default: 标准样式，带边框和背景
   * - compact: 紧凑样式，无边框
   * - card: 卡片样式，更圆润的边角
   */
  variant?: 'default' | 'compact' | 'card';

  /**
   * 额外的 className
   */
  className?: string;
}

/**
 * 统一空状态组件
 *
 * @example
 * ```tsx
 * // 基础用法
 * <EmptyState title="暂无订单" description="您还没有任何订单记录" />
 *
 * // 带图标和操作按钮
 * <EmptyState
 *   icon={<ShoppingCart />}
 *   title="暂无订单"
 *   description="开始购物吧"
 *   action={<Button>去逛逛</Button>}
 * />
 *
 * // 使用预设消息
 * const { title, description } = EMPTY_STATE_MESSAGES.orders;
 * <EmptyState title={title} description={description} />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const variantStyles = {
    default: "py-12 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800",
    compact: "py-8",
    card: "py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variantStyles[variant],
        className
      )}
    >
      {/* 图标 */}
      <div className="mb-4 text-gray-400 dark:text-gray-500">
        {icon || <Package className="w-12 h-12" />}
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h3>

      {/* 描述 */}
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
          {description}
        </p>
      )}

      {/* 操作按钮 */}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * 快速创建预设空状态的工厂函数
 */
export function createEmptyState(
  key: EmptyStateKey,
  overrides?: Partial<EmptyStateProps>
) {
  const preset = EMPTY_STATE_MESSAGES[key];
  return {
    title: preset.title,
    description: preset.description,
    ...overrides,
  };
}

// 导出预设消息供外部使用
export { EMPTY_STATE_MESSAGES };
