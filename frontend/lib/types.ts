// 共享类型定义
// --------------------------------------------------------------------------------
// 此文件包含前端应用中共享的 TypeScript 类型定义。
// 将公共类型集中在这里可以避免在 data.ts 和 api.ts 中重复定义。
//
// **自动生成类型映射** (2026-01 新增)
// 后端 DTO 可通过 `npm run gen-types` 自动生成到 `lib/generated/api-types.ts`。
// 本文件作为"映射层"，将冗长的 `components['schemas']['...']` 包装为简洁的别名。

// 导入自动生成的类型（如果存在）
// 注意: 部分类型（如 UserPresenceDto）因后端返回 IActionResult 未被 Swagger 捕获
// TODO: 后端添加 [ProducesResponseType] 后可移除手动定义
// import type { components } from './generated/api-types';

// ============================================================================
// 手动定义类型 (待后端完善 Swagger 后可迁移到 generated)
// ============================================================================

/**
 * 用户在线状态数据结构
 * 对应后端 UserPresenceDto
 *
 * **注意**: 此类型暂为手动定义，因后端 `PresenceController.GetStatus()` 返回
 * `IActionResult` 而非强类型，Swagger 无法推断。
 */
export interface UserPresence {
  status: string;
  icon: string;
  message: string;
  details?: string;
  timestamp: string;
}

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
