// =============================================================================
// PageContainer - 统一页面容器组件
// =============================================================================
// 封装响应式 Padding 和 Max-Width 规则，确保页面布局一致性

import { cn } from "@/lib/utils";
import {
  CONTAINER_STYLES,
  MAX_WIDTH_MAP,
  type ContainerVariant,
  type MaxWidthKey,
} from "@/lib/design-tokens";

export interface PageContainerProps {
  /**
   * 容器变体
   * - admin: 后台管理页面 (紧凑 padding)
   * - public: 前台公开页面 (舒适 padding)
   * - public-hero: 营销性页面 (更大 padding)
   */
  variant: ContainerVariant | 'public-hero';

  /**
   * 最大宽度覆盖，默认使用变体对应的宽度
   */
  maxWidth?: MaxWidthKey;

  /**
   * 子元素
   */
  children: React.ReactNode;

  /**
   * 额外的 className
   */
  className?: string;

  /**
   * 是否居中 (添加 mx-auto)
   * @default true
   */
  centered?: boolean;
}

/**
 * 统一页面容器组件
 *
 * @example
 * ```tsx
 * // Admin 页面
 * <PageContainer variant="admin" maxWidth="5xl">
 *   <AdminPageHeader title="订单管理" />
 *   ...
 * </PageContainer>
 *
 * // Public 页面
 * <PageContainer variant="public">
 *   <h1>系列文章</h1>
 *   ...
 * </PageContainer>
 * ```
 */
export function PageContainer({
  variant,
  maxWidth,
  children,
  className,
  centered = true,
}: PageContainerProps) {
  // 处理 'public-hero' -> 'publicHero' 的映射
  const styleKey = variant === 'public-hero' ? 'publicHero' : variant;
  const styles = CONTAINER_STYLES[styleKey];

  // 确定最大宽度
  const widthClass = maxWidth
    ? MAX_WIDTH_MAP[maxWidth]
    : styles.maxWidth;

  return (
    <div
      className={cn(
        "container",
        centered && "mx-auto",
        styles.padding,
        widthClass,
        className
      )}
    >
      {children}
    </div>
  );
}
