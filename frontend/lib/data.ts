import { cookies } from 'next/headers';

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

// 专门供 Server Components 使用的数据获取函数
// 包含手动 Cookie 注入逻辑
export async function getPost(id: string) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://backend:8080';
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token.value}`;
    }

    const res = await fetch(`${baseUrl}/api/posts/${id}`, {
      headers,
      next: { revalidate: token ? 0 : 60 } // 管理员预览时不缓存，普通用户缓存 60s
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
