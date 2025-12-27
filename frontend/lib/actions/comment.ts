"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

/**
 * 提交评论的 Server Action
 * 
 * 使用 Server Action 而非客户端 API 的原因：
 * - 可以调用 revalidatePath 来清除 ISR 缓存
 * - 确保新评论提交后，刷新页面能立即看到
 */
export async function submitCommentAction(
  postId: number,
  content: string,
  guestName: string,
  parentId?: number
) {
  try {
    const baseUrl = process.env.BACKEND_URL || "http://backend:8080";
    
    // 获取用户 token（如果有）
    const cookieStore = await cookies();
    const token = cookieStore.get("token");
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token.value}`;
    }

    const res = await fetch(`${baseUrl}/api/comments`, {
      method: "POST",
      headers,
      body: JSON.stringify({ postId, content, guestName, parentId }),
    });

    const json = await res.json();

    if (json.success) {
      // 关键：清除该文章的 ISR 缓存
      revalidatePath(`/posts/${postId}`);
    }

    return json;
  } catch (error) {
    console.error("Submit comment error:", error);
    return { success: false, message: "提交失败，请稍后重试" };
  }
}
