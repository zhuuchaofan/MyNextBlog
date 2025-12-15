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
}

// 获取文章详情 (客户端版本)
// 适用于 Client Component 需要获取数据的情况（例如点击查看详情时不刷新页面）
export async function getPostClient(id: string) {
    try {
      const res = await fetch(`/api/backend/posts/${id}`);
      if (!res.ok) return undefined;
      const json = await res.json();
      return json.success ? (json.data as PostDetail) : undefined;
    } catch (error) {
      return undefined;
    }
}

export interface Comment {
  id: number;
  guestName: string;
  content: string;
  createTime: string;
  userAvatar?: string;
  parentId?: number;
  children?: Comment[];
}

// 获取评论列表
export async function fetchComments(postId: number, page = 1, pageSize = 10) {
  const res = await fetch(`/api/backend/comments?postId=${postId}&page=${page}&pageSize=${pageSize}`);
  return res.json();
}

// 提交新评论
export async function submitComment(postId: number, content: string, guestName: string, parentId?: number) {
  const res = await fetch('/api/backend/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }, // 必须指定 JSON 内容类型
    body: JSON.stringify({ postId, content, guestName, parentId })
  });
  return res.json();
}

export interface Category {
  id: number;
  name: string;
}

// 获取所有分类
export async function fetchCategories() {
  const res = await fetch('/api/backend/categories'); 
  return res.json();
}

// 创建新分类
export async function createCategory(name: string) {
  const res = await fetch('/api/backend/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return res.json();
}

// 获取热门标签
export async function fetchPopularTags() {
  const res = await fetch('/api/backend/tags/popular');
  return res.json();
}

// 发布新文章
export async function createPost(postData: { title: string; content: string; categoryId?: number; tags?: string[] }) {
  const res = await fetch('/api/backend/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error: ${res.status} ${res.statusText} - ${text}`);
  }

  return res.json();
}

// 更新文章
export async function updatePost(id: number, postData: { title: string; content: string; categoryId?: number; tags?: string[] }) {
  const res = await fetch(`/api/backend/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error: ${res.status} ${res.statusText} - ${text}`);
  }

  return res.json();
}

// 删除文章
export async function deletePost(id: number) {
  const res = await fetch(`/api/backend/posts/${id}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error: ${res.status} ${res.statusText} - ${text}`);
  }

  return res.json();
}

// 切换文章可见性
export async function togglePostVisibility(id: number) {
  const res = await fetch(`/api/backend/posts/${id}/visibility`, {
    method: 'PATCH'
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error: ${res.status} ${res.statusText} - ${text}`);
  }

  return res.json();
}

// 管理员获取文章列表 (包含隐藏文章)
export async function fetchPostsWithAuth(page = 1, pageSize = 10) {
  const res = await fetch(`/api/backend/posts/admin?page=${page}&pageSize=${pageSize}`);
  return res.json();
}

// 管理员获取文章详情
export async function getPostWithAuth(id: number) {
  const res = await fetch(`/api/backend/posts/admin/${id}`);
  return res.json();
}

// 获取当前登录用户信息
export async function fetchCurrentUser() {
  const res = await fetch('/api/backend/account/me');
  return res.json();
}

// 上传用户头像
export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file); // 必须使用 FormData 来上传文件

  const res = await fetch('/api/backend/account/avatar', {
    method: 'POST',
    body: formData // fetch 会自动设置 Content-Type 为 multipart/form-data
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }

  return res.json();
}

// 切换文章点赞状态
export async function toggleLike(postId: number) {
  const res = await fetch(`/api/backend/posts/${postId}/like`, {
    method: 'POST'
  });
  return res.json();
}

// [Admin] 获取所有评论
export async function fetchAllCommentsAdmin(page = 1, pageSize = 20, isApproved?: boolean) {
  let url = `/api/backend/comments/admin?page=${page}&pageSize=${pageSize}`;
  if (isApproved !== undefined) {
    url += `&isApproved=${isApproved}`;
  }
  const res = await fetch(url);
  return res.json();
}

// [Admin] 切换评论审核状态
export async function toggleCommentApproval(id: number) {
  const res = await fetch(`/api/backend/comments/${id}/approval`, {
    method: 'PATCH'
  });
  return res.json();
}

// [Admin] 删除评论
export async function deleteCommentAdmin(id: number) {
  const res = await fetch(`/api/backend/comments/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

// [Admin] 批量批准评论
export async function batchApproveComments(ids: number[]) {
  const res = await fetch('/api/backend/comments/batch-approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids)
  });
  return res.json();
}

// [Admin] 批量删除评论
export async function batchDeleteComments(ids: number[]) {
  const res = await fetch('/api/backend/comments/batch-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids)
  });
  return res.json();
}