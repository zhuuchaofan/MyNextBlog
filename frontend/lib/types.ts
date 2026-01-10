// 共享类型定义
// --------------------------------------------------------------------------------
// 此文件包含前端应用中共享的 TypeScript 类型定义。
// 将公共类型集中在这里可以避免在 data.ts 和 api.ts 中重复定义。
//
// **自动生成类型映射** (2026-01 新增)
// 后端 DTO 可通过 `npm run gen-types` 自动生成到 `lib/generated/api-types.ts`。
// 本文件作为"映射层"，将冗长的 `components['schemas']['...']` 包装为简洁的别名。

// ============================================================================
// 从自动生成的 Swagger 类型导入
// ============================================================================
import type { components } from "./generated/api-types";

// 辅助类型：移除 null 和 undefined，使字段成为必填
type RequiredFields<T, K extends keyof T> = T & {
  [P in K]-?: NonNullable<T[P]>;
};

// ============================================================================
// 通用 API 响应类型 (2026-01 新增)
// ============================================================================
// 所有 API 响应遵循 { success, data, meta } 格式
// 这些类型用于约束 API 函数的返回值，确保编译时类型检查

/**
 * 通用 API 成功响应
 * @example { success: true, data: { id: 1, name: "..." } }
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * 分页 API 响应 (带 meta)
 * @example { success: true, data: [...], meta: { totalCount: 100, hasMore: true } }
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    totalCount: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
  };
}

/**
 * 简单操作响应 (无 data，只有 message)
 * @example { success: true, message: "操作成功" }
 */
export interface SimpleResponse {
  success: boolean;
  message?: string;
  count?: number;  // 用于批量操作
}

// ============================================================================
// 管理员评论类型
// ============================================================================
export interface AdminComment {
  id: number;
  content: string;
  createTime: string;
  guestName: string;
  isApproved: boolean;
  postTitle?: string;
  postId: number;
}

/**
 * 用户在线状态数据结构
 * 基于后端 `UserPresenceDto` 自动生成，并对必填字段进行了严格化处理
 *
 * **使用方式**: 直接 `import { UserPresence } from '@/lib/types'`
 * **数据来源**: 由 `npm run gen-types` 从 Swagger 自动生成
 *
 * **注意**: Swagger 生成的类型默认都是可空的，但后端实际上保证了
 * status, icon, message, timestamp 一定有值，因此这里做了类型收窄。
 */
export type UserPresence = RequiredFields<
  components["schemas"]["UserPresenceDto"],
  "status" | "icon" | "message" | "timestamp"
>;

// ============================================================================
// 文章相关类型
// ============================================================================

/**
 * 文章详情数据结构
 * 对应后端 PostDetailDto
 */
export interface PostDetail {
  id: number;
  title: string;
  content: string;
  createTime: string;
  updatedAt?: string;  // 文章最后修改时间 (可空)
  categoryName?: string;
  categoryId: number;
  authorName?: string;
  authorAvatar?: string;
  commentCount: number;
  likeCount: number;
  coverImage?: string;
  tags?: string[];
  isHidden?: boolean;
  seriesId?: number;
  seriesOrder?: number;
  seriesInfo?: SeriesInfo;
}

/**
 * 系列信息数据结构
 * 用于文章详情页的系列导航
 */
export interface SeriesInfo {
  id: number;
  name: string;
  totalCount: number;
  currentOrder: number;
  prev?: PostLink;
  next?: PostLink;
}

/**
 * 简化的文章链接（用于系列导航）
 */
export interface PostLink {
  id: number;
  title: string;
}

/**
 * 评论数据结构
 */
export interface Comment {
  id: number;
  guestName: string;
  content: string;
  createTime: string;
  userAvatar?: string;
  parentId?: number;
  children?: Comment[];
}

/**
 * 分类数据结构
 */
export interface Category {
  id: number;
  name: string;
}

/**
 * 系列数据结构（管理端）
 */
export interface Series {
  id: number;
  name: string;
  description?: string;
  postCount: number;
}

/**
 * 文章列表项数据结构
 */
export interface Post {
  id: number;
  title: string;
  excerpt?: string;
  categoryName?: string;
  categoryId?: number;
  authorName?: string;
  authorAvatar?: string;
  createTime: string;
  updatedAt?: string;  // 文章最后修改时间 (可空)
  coverImage?: string;
  tags?: string[];
  isHidden?: boolean;
  likeCount?: number;
  seriesName?: string;
  seriesOrder?: number;
}
