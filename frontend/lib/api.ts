// 客户端 API 请求库
// --------------------------------------------------------------------------------
// 此文件包含了一系列供**客户端组件 (Client Components)** 使用的异步函数，用于与后端 API 进行交互。
//
// **核心机制：API 代理 (BFF Pattern)**
// 我们**不**直接请求 `http://backend:8080`，而是请求 `Next.js` 的内部路由 `/api/backend/*`。
//
// 1. **请求流程**: Client -> Next.js Middleware -> Next.js Rewrite -> Backend API
// 2. **自动认证**:
//    - 客户端浏览器会自动携带 `token` Cookie 发送给 Next.js。
//    - Next.js 的 `middleware.ts` 会拦截以 `/api/backend` 开头的请求。
//    - 中间件读取 Cookie 中的 `token`，并将其转换为 `Authorization: Bearer <token>` 头。
//    - 最后将带有认证头的请求转发给真实的后端。
//
// **好处**: 前端代码完全不需要手动管理 Token（不需要 localStorage，不需要手动添加 Header），更加安全且简洁。

import { fetchClient } from "./fetchClient";
import type { Series } from "./types";

// Re-export types for backwards compatibility
export type { Series, Category, Comment } from "./types";

export interface PostDetail {
  id: number;
  title: string;
  content: string;
  createTime: string;
  categoryName?: string;
  categoryId: number;
  authorName?: string;
  authorAvatar?: string;
  commentCount: number;
  likeCount: number;
  coverImage?: string;
  tags?: string[];
  isHidden?: boolean;
  seriesInfo?: SeriesInfo;
}

export interface SeriesInfo {
  id: number;
  name: string;
  totalCount: number;
  currentOrder: number;
  prev?: { id: number; title: string };
  next?: { id: number; title: string };
}

// 获取文章详情 (客户端版本)
export async function getPostClient(id: string) {
  try {
    const json = await fetchClient<{ success: boolean; data: PostDetail }>(`/api/backend/posts/${id}`);
    return json.success ? json.data : undefined;
  } catch {
    return undefined;
  }
}


// 获取评论列表
export function fetchComments(postId: number, page = 1, pageSize = 10) {
  return fetchClient(
    `/api/backend/comments?postId=${postId}&page=${page}&pageSize=${pageSize}`
  );
}

// 提交新评论
export function submitComment(
  postId: number,
  content: string,
  guestName: string,
  parentId?: number
) {
  return fetchClient("/api/backend/comments", {
    method: "POST",
    body: { postId, content, guestName, parentId },
  });
}


// 获取所有分类
export function fetchCategories() {
  return fetchClient("/api/backend/categories");
}

// 创建新分类
export function createCategory(name: string) {
  return fetchClient("/api/backend/categories", {
    method: "POST",
    body: { name },
  });
}

// 获取热门标签
export function fetchPopularTags() {
  return fetchClient("/api/backend/tags/popular");
}

// 发布新文章
export function createPost(postData: {
  title: string;
  content: string;
  categoryId?: number;
  tags?: string[];
  seriesId?: number;
  seriesOrder?: number;
}) {
  return fetchClient("/api/backend/posts", {
    method: "POST",
    body: postData,
  });
}

// 更新文章
export function updatePost(
  id: number,
  postData: {
    title: string;
    content: string;
    categoryId?: number;
    tags?: string[];
    seriesId?: number;
    seriesOrder?: number;
  }
) {
  return fetchClient(`/api/backend/posts/${id}`, {
    method: "PUT",
    body: postData,
  });
}

// 删除文章
export function deletePost(id: number) {
  return fetchClient(`/api/backend/posts/${id}`, {
    method: "DELETE",
  });
}

// 切换文章可见性
export function togglePostVisibility(id: number) {
  return fetchClient(`/api/backend/posts/${id}/visibility`, {
    method: "PATCH",
  });
}

// 管理员获取文章列表 (包含隐藏文章)
export function fetchPostsWithAuth(page = 1, pageSize = 10) {
  return fetchClient(`/api/backend/posts/admin?page=${page}&pageSize=${pageSize}`);
}

// 管理员获取文章详情
export function getPostWithAuth(id: number) {
  return fetchClient(`/api/backend/posts/admin/${id}`);
}

// 获取当前登录用户信息
export function fetchCurrentUser() {
  return fetchClient("/api/backend/account/me");
}

// 上传用户头像
export function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return fetchClient("/api/backend/account/avatar", {
    method: "POST",
    body: formData,
  });
}

// 更新个人资料
export function updateProfile(data: {
  email?: string;
  nickname?: string;
  bio?: string;
  website?: string;
  location?: string;
  occupation?: string;
  birthDate?: string;
}) {
  return fetchClient("/api/backend/account/profile", {
    method: "PUT",
    body: data,
  });
}

// 注册新用户
export function registerUser(username: string, password: string) {
  return fetchClient("/api/auth/register", {
    method: "POST",
    body: { username, password },
  });
}

// 切换文章点赞状态
export function toggleLike(postId: number) {
  return fetchClient(`/api/backend/posts/${postId}/like`, {
    method: "POST",
  });
}

// [Admin] 获取所有评论
export function fetchAllCommentsAdmin(
  page = 1,
  pageSize = 20,
  isApproved?: boolean
) {
  let url = `/api/backend/comments/admin?page=${page}&pageSize=${pageSize}`;
  if (isApproved !== undefined) {
    url += `&isApproved=${isApproved}`;
  }
  return fetchClient(url);
}

// [Admin] 切换评论审核状态
export function toggleCommentApproval(id: number) {
  return fetchClient(`/api/backend/comments/${id}/approval`, {
    method: "PATCH",
  });
}

// [Admin] 删除评论
export function deleteCommentAdmin(id: number) {
  return fetchClient(`/api/backend/comments/${id}`, {
    method: "DELETE",
  });
}

// [Admin] 批量批准评论
export function batchApproveComments(ids: number[]) {
  return fetchClient("/api/backend/comments/batch-approve", {
    method: "POST",
    body: ids,
  });
}

// [Admin] 批量删除评论
export function batchDeleteComments(ids: number[]) {
  return fetchClient("/api/backend/comments/batch-delete", {
    method: "POST",
    body: ids,
  });
}

// [Admin] 获取所有系列
export function fetchAllSeries() {
  return fetchClient<{ success: boolean; data: Series[] }>("/api/backend/series");
}

// [Admin] 创建系列
export function createSeries(name: string, description?: string) {
  return fetchClient<{ success: boolean; message: string; data: Series }>("/api/backend/series", {
    method: "POST",
    body: { name, description },
  });
}

// [Admin] 更新系列
export function updateSeries(id: number, name: string, description?: string) {
    return fetchClient<{ success: boolean; message: string; data: Series }>(`/api/backend/series/${id}`, {
      method: "PUT",
      body: { name, description },
    });
}

// [Admin] 删除系列
export function deleteSeries(id: number) {
  return fetchClient<{ success: boolean; message: string }>(`/api/backend/series/${id}`, {
    method: "DELETE",
  });
}

// [Admin] 获取系列下一篇文章序号
export function fetchNextSeriesOrder(seriesId: number) {
    return fetchClient<{ success: boolean; data: number }>(`/api/backend/series/${seriesId}/next-order`);
}

