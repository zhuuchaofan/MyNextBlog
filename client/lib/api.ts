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

export async function createPost(token: string, postData: { title: string; content: string; categoryId?: number }) {
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
