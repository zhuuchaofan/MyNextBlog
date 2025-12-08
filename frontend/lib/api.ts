// Client-side API functions (or Server Actions that don't use next/headers directly)
// Middleware handles token injection for /api/backend/* requests

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
  coverImage?: string;
  tags?: string[];
  isHidden?: boolean;
}

// Keep this for client-side fetching if needed (though getPost is mostly Server Component now)
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
}

export async function fetchComments(postId: number, page = 1) {
  const res = await fetch(`/api/backend/comments?postId=${postId}&page=${page}&pageSize=100`);
  return res.json();
}

export async function submitComment(postId: number, content: string, guestName: string) {
  const res = await fetch('/api/backend/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, content, guestName })
  });
  return res.json();
}

export interface Category {
  id: number;
  name: string;
}

export async function fetchCategories() {
  const res = await fetch('/api/backend/categories'); 
  return res.json();
}

export async function createCategory(name: string) {
  const res = await fetch('/api/backend/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return res.json();
}

export async function fetchPopularTags() {
  const res = await fetch('/api/backend/tags/popular');
  return res.json();
}

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

export async function fetchPostsWithAuth(page = 1, pageSize = 10) {
  const res = await fetch(`/api/backend/posts/admin?page=${page}&pageSize=${pageSize}`);
  return res.json();
}

export async function getPostWithAuth(id: number) {
  const res = await fetch(`/api/backend/posts/admin/${id}`);
  return res.json();
}

export async function fetchCurrentUser() {
  const res = await fetch('/api/backend/account/me');
  return res.json();
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/backend/account/avatar', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }

  return res.json();
}