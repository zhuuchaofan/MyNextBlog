export interface PostDetail {
  id: number;
  title: string;
  content: string;
  createTime: string;
  category?: string;
  categoryId: number;
  author?: string;
  commentCount: number;
  coverImage?: string;
}

export async function getPost(id: string) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5095';
    const res = await fetch(`${baseUrl}/api/posts/${id}`, {
      next: { revalidate: 60 }
    });

    if (!res.ok) return undefined;
    const json = await res.json();
    if (!json.success) return undefined;

    return json.data as PostDetail;
  } catch (error) {
    console.error('Fetch post error:', error);
    return undefined;
  }
}

export interface Comment {
  id: number;
  guestName: string;
  content: string;
  createTime: string;
}

export async function fetchComments(postId: number, page = 1) {
  const res = await fetch(`/api/backend/comments?postId=${postId}&page=${page}&pageSize=100`); // 简单起见，先取 100 条
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
  // 由于我们没有专门的 GET /api/categories，暂时先用 Posts API 的附属数据或者假设有一个接口
  // 这里我们需要后端补充一个 GET /api/categories 接口
  const res = await fetch('/api/backend/categories'); 
  return res.json();
}

export async function createCategory(token: string, name: string) {
  const res = await fetch('/api/backend/categories', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name })
  });
  return res.json();
}

export async function fetchPopularTags() {
  const res = await fetch('/api/backend/tags/popular');
  return res.json();
}

export async function createPost(token: string, postData: { title: string; content: string; categoryId?: number; tags?: string[] }) {
  const res = await fetch('/api/backend/posts', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(postData)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error: ${res.status} ${res.statusText} - ${text}`);
  }

  return res.json();
}

export async function updatePost(token: string, id: number, postData: { title: string; content: string; categoryId?: number; tags?: string[] }) {
  const res = await fetch(`/api/backend/posts/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(postData)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error: ${res.status} ${res.statusText} - ${text}`);
  }

  return res.json();
}

export async function deletePost(token: string, id: number) {
  const res = await fetch(`/api/backend/posts/${id}`, {
    method: 'DELETE',
    headers: { 
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error: ${res.status} ${res.statusText} - ${text}`);
  }

  return res.json();
}

export async function fetchPostsWithAuth(token: string, page = 1, pageSize = 10) {
  const res = await fetch(`/api/backend/posts?page=${page}&pageSize=${pageSize}`, {
    headers: { 
      'Authorization': `Bearer ${token}` // 带 Token 才能看到隐藏文章
    }
  });
  return res.json();
}
