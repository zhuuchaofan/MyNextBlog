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
