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

// Re-export all shared types from types.ts for backwards compatibility
// This ensures consumers of api.ts don't need to know about types.ts
export type { Series, Category, Comment, PostDetail, SeriesInfo } from "./types";




// 获取评论列表
export function fetchComments(postId: number, page = 1, pageSize = 10) {
  return fetchClient(
    `/api/backend/comments?postId=${postId}&page=${page}&pageSize=${pageSize}`
  );
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

// --- 回收站功能 (Trash) ---

// [Admin] 获取回收站中的文章列表
export function fetchDeletedPosts(page = 1, pageSize = 10) {
  return fetchClient(`/api/backend/posts/trash?page=${page}&pageSize=${pageSize}`);
}

// [Admin] 恢复文章
export function restorePost(id: number) {
  return fetchClient(`/api/backend/posts/${id}/restore`, {
    method: "POST",
  });
}

// [Admin] 永久删除文章
export function permanentDeletePost(id: number) {
  return fetchClient(`/api/backend/posts/${id}/permanent`, {
    method: "DELETE",
  });
}

// 获取相关文章推荐
export function fetchRelatedPosts(postId: number, count = 4) {
  return fetchClient(`/api/backend/posts/${postId}/related?count=${count}`);
}

// 流量统计心跳
export function pulseStats() {
  return fetchClient<{ 
    success: boolean;
    data: {
      visits: number;
      postsCount: number;
      commentsCount: number;
      runningDays: number;
    };
  }>("/api/backend/stats/pulse", {
    method: "POST",
  });
}

// --- 纪念日功能 (Anniversary) ---

// 纪念日类型定义
export interface Anniversary {
  id: number;
  title: string;
  emoji: string;
  startDate: string;  // "2024-06-01" 格式
  repeatType: "yearly" | "monthly" | "once";
  displayType: "duration" | "age";  // 显示类型
  daysSinceStart: number;
}

export interface AnniversaryAdmin extends Anniversary {
  isActive: boolean;
  displayOrder: number;
  // 邮件提醒配置
  enableReminder: boolean;
  reminderEmail: string | null;
  reminderDays: string;  // "30,15,7,1,0"
  createdAt: string;
  updatedAt: string;
}

// 获取所有启用的纪念日（公开 API）
export function fetchAnniversaries() {
  return fetchClient<Anniversary[]>("/api/backend/anniversaries");
}

// [Admin] 获取所有纪念日（含禁用）
export function fetchAllAnniversariesAdmin() {
  return fetchClient<AnniversaryAdmin[]>("/api/backend/anniversaries/admin");
}

// [Admin] 创建纪念日
export function createAnniversary(data: {
  title: string;
  emoji: string;
  startDate: string;
  repeatType: string;
  displayType: string;
  enableReminder?: boolean;
  reminderEmail?: string;
  reminderDays?: string;
}) {
  return fetchClient("/api/backend/anniversaries", {
    method: "POST",
    body: data,
  });
}

// [Admin] 更新纪念日
export function updateAnniversary(id: number, data: {
  title: string;
  emoji: string;
  startDate: string;
  repeatType: string;
  displayType: string;
  isActive?: boolean;
  displayOrder?: number;
  enableReminder?: boolean;
  reminderEmail?: string;
  reminderDays?: string;
}) {
  return fetchClient(`/api/backend/anniversaries/${id}`, {
    method: "PUT",
    body: data,
  });
}

// [Admin] 删除纪念日
export function deleteAnniversary(id: number) {
  return fetchClient(`/api/backend/anniversaries/${id}`, {
    method: "DELETE",
  });
}

// ============================================================
// 邮件模板管理 (Email Templates)
// ============================================================

// 邮件模板类型定义
export interface EmailTemplate {
  id: number;
  templateKey: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  availablePlaceholders: string | null;
  description: string | null;
  isEnabled: boolean;
  updatedAt: string;
}

// [Admin] 获取所有邮件模板
export async function fetchEmailTemplates(): Promise<EmailTemplate[]> {
  const res = await fetchClient<{ success: boolean; data: EmailTemplate[] }>("/api/backend/admin/email-templates");
  return res.data;
}



// [Admin] 更新邮件模板
export function updateEmailTemplate(
  key: string,
  data: {
    subjectTemplate: string;
    bodyTemplate: string;
    isEnabled?: boolean;
  }
) {
  return fetchClient(`/api/backend/admin/email-templates/${key}`, {
    method: "PUT",
    body: data,
  });
}

// ============================================================
// 计划管理 (Plans)
// ============================================================

// 计划类型定义
export interface PlanListItem {
  id: number;
  title: string;
  type: "trip" | "event" | "surprise";
  startDate: string;
  endDate: string | null;
  budget: number;
  actualCost: number;
  currency: string;
  status: "draft" | "confirmed" | "completed";
  isSecret: boolean;
  anniversaryId: number | null;
  anniversaryTitle: string | null;
  daysCount: number;
  createdAt: string;
}

export interface PlanActivity {
  id: number;
  time: string | null;
  title: string;
  location: string | null;
  notes: string | null;
  estimatedCost: number;
  actualCost: number;
  sortOrder: number;
}

export interface PlanDay {
  id: number;
  dayNumber: number;
  date: string;
  theme: string | null;
  activities: PlanActivity[];
}

export interface PlanDetail {
  id: number;
  title: string;
  description: string | null;
  type: string;
  startDate: string;
  endDate: string | null;
  budget: number;
  actualCost: number;
  currency: string;
  status: string;
  isSecret: boolean;
  enableReminder: boolean;
  reminderEmail: string | null;
  reminderDays: string;
  anniversaryId: number | null;
  anniversaryTitle: string | null;
  days: PlanDay[];
  createdAt: string;
  updatedAt: string;
}

// ========== 公开预览类型（隐藏敏感信息）==========

export interface PublicPlanDetail {
  id: number;
  title: string;
  description: string | null;
  type: string;
  startDate: string;
  endDate: string | null;
  status: string;
  days: Array<{
    id: number;
    dayNumber: number;
    date: string;
    theme: string | null;
    activities: Array<{
      id: number;
      time: string | null;
      title: string;
      location: string | null;
      notes: string | null;
      sortOrder: number;
    }>;
  }>;
}

// [Public] 获取公开预览的计划详情（无需登录，隐藏预算）
export function fetchPublicPlanById(id: number) {
  return fetchClient<PublicPlanDetail>(`/api/plans/${id}/public`);
}

// [Admin] 获取所有计划
export async function fetchPlans(): Promise<PlanListItem[]> {
  const res = await fetchClient<{ success: boolean; data: PlanListItem[] }>("/api/backend/admin/plans");
  return res.data;
}

// [Admin] 获取计划详情
export async function fetchPlanById(id: number): Promise<PlanDetail> {
  const res = await fetchClient<{ success: boolean; data: PlanDetail }>(`/api/backend/admin/plans/${id}`);
  return res.data;
}

// [Admin] 创建计划
export function createPlan(data: {
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  currency?: string;
  isSecret?: boolean;
  enableReminder?: boolean;
  reminderEmail?: string;
  reminderDays?: string;
  anniversaryId?: number;
}) {
  return fetchClient("/api/backend/admin/plans", {
    method: "POST",
    body: data,
  });
}

// [Admin] 更新计划
export function updatePlan(id: number, data: {
  title?: string;
  description?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  actualCost?: number;
  currency?: string;
  status?: string;
  isSecret?: boolean;
  enableReminder?: boolean;
  reminderEmail?: string;
  reminderDays?: string;
  anniversaryId?: number;
}) {
  return fetchClient(`/api/backend/admin/plans/${id}`, {
    method: "PUT",
    body: data,
  });
}

// [Admin] 删除计划
export function deletePlan(id: number) {
  return fetchClient(`/api/backend/admin/plans/${id}`, {
    method: "DELETE",
  });
}

// [Admin] 添加一天
export async function addPlanDay(planId: number, data: {
  dayNumber: number;
  date: string;
  theme?: string;
}): Promise<PlanDay> {
  const res = await fetchClient<{ success: boolean; data: PlanDay }>(`/api/backend/admin/plans/${planId}/days`, {
    method: "POST",
    body: data,
  });
  return res.data;
}

// [Admin] 更新一天
export async function updatePlanDay(planId: number, dayId: number, data: {
  dayNumber?: number;
  date?: string;
  theme?: string;
}): Promise<PlanDay> {
  const res = await fetchClient<{ success: boolean; data: PlanDay }>(`/api/backend/admin/plans/${planId}/days/${dayId}`, {
    method: "PUT",
    body: data,
  });
  return res.data;
}

// [Admin] 删除一天
export function deletePlanDay(planId: number, dayId: number) {
  return fetchClient(`/api/backend/admin/plans/${planId}/days/${dayId}`, {
    method: "DELETE",
  });
}

// [Admin] 添加活动
export async function addPlanActivity(dayId: number, data: {
  time?: string;
  title: string;
  location?: string;
  notes?: string;
  estimatedCost?: number;
  sortOrder?: number;
}): Promise<PlanActivity> {
  const res = await fetchClient<{ success: boolean; data: PlanActivity }>(`/api/backend/admin/days/${dayId}/activities`, {
    method: "POST",
    body: data,
  });
  return res.data;
}

// [Admin] 更新活动
export async function updatePlanActivity(activityId: number, data: {
  time?: string;
  title?: string;
  location?: string;
  notes?: string;
  estimatedCost?: number;
  actualCost?: number;
  sortOrder?: number;
}): Promise<PlanActivity> {
  const res = await fetchClient<{ success: boolean; data: PlanActivity }>(`/api/backend/admin/activities/${activityId}`, {
    method: "PUT",
    body: data,
  });
  return res.data;
}

// [Admin] 删除活动
export function deletePlanActivity(activityId: number) {
  return fetchClient(`/api/backend/admin/activities/${activityId}`, {
    method: "DELETE",
  });
}

// [Admin] 获取预算统计
export async function fetchPlanBudget(planId: number): Promise<{ totalEstimated: number; totalActual: number }> {
  const res = await fetchClient<{ success: boolean; data: { totalEstimated: number; totalActual: number } }>(
    `/api/backend/admin/plans/${planId}/budget`
  );
  return res.data;
}

// [Admin] 批量更新活动排序（拖拽排序优化，单次请求）
export function batchUpdateActivitySortOrder(
  items: Array<{ id: number; sortOrder: number }>
) {
  return fetchClient("/api/backend/admin/activities/batch-sort", {
    method: "PATCH",
    body: { items },
  });
}

