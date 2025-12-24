// 共享类型定义
// --------------------------------------------------------------------------------
// 此文件包含前端应用中共享的 TypeScript 类型定义。
// 将公共类型集中在这里可以避免在 data.ts 和 api.ts 中重复定义。

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
