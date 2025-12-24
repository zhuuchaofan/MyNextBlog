import { cookies } from "next/headers"; // 导入 Next.js 的 cookies 工具，用于在 Server Components 中访问 Cookie。
import type { PostDetail } from "./types"; // 统一从 types.ts 导入，避免重复定义

// Re-export for backwards compatibility
export type { PostDetail };

/**
 * 获取文章详情 (Server Component 专用)
 *
 * 此函数设计用于在 Next.js 的 Server Components 中直接调用。
 * 它实现了 BFF (Backend for Frontend) 模式中的关键一步：**身份凭证透传**。
 *
 * @param id 文章 ID
 */
export async function getPost(id: string) {
  try {
    // 确定后端 API 地址
    // 优先使用环境变量（Docker 网络），否则回退到本地调试地址。
    const baseUrl = process.env.BACKEND_URL || "http://backend:8080";

    // **关键步骤：手动注入 Cookie**
    // Server Components 运行在服务端，它们发出的 fetch 请求默认**不会**带上浏览器发来的 Cookie。
    // 为了让后端知道“当前是谁在访问”（例如管理员预览草稿），我们需要：
    // 1. 获取当前请求的 Cookie (cookieStore)
    // 2. 读取名为 'token' 的 JWT Cookie
    // 3. 手动将其添加到 fetch 请求的 Authorization 头中
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      // 如果有 token，构造 Bearer Token 认证头
      headers["Authorization"] = `Bearer ${token.value}`;
    }

    const res = await fetch(`${baseUrl}/api/posts/${id}`, {
      headers,
      // **缓存控制策略**
      // next: { revalidate: ... } 是 Next.js 特有的 fetch 扩展配置。
      // - 如果有 token (管理员登录)，revalidate: 0 -> 禁用缓存，确保所见即所得。
      // - 如果无 token (普通访客)，revalidate: 60 -> 缓存 60 秒，减轻后端压力。
      next: { revalidate: token ? 0 : 60 },
    });

    if (!res.ok) return undefined;
    const json = await res.json();
    if (!json.success) return undefined;

    return json.data as PostDetail;
  } catch (error) {
    console.error("Fetch post error:", error);
    return undefined;
  }
}

/**
 * 获取所有文章列表 (用于 Sitemap 生成)
 * TODO: 如果文章数量巨大，需要分批获取或增加专用 ID 列表接口
 */
export async function getPostsForSitemap() {
  try {
    const baseUrl = process.env.BACKEND_URL || "http://backend:8080";
    // 请求 1000 条，基本覆盖个人博客需求
    const res = await fetch(`${baseUrl}/api/posts?page=1&pageSize=1000`, {
      next: { revalidate: 3600 }, // Sitemap 缓存 1 小时
    });

    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success) return [];

    return json.data as { id: number; title: string; createTime: string }[];
  } catch (error) {
    console.error("Fetch sitemap posts error:", error);
    return [];
  }
}

/**
 * 获取评论列表 (Server Component 专用)
 *
 * 用于在服务端获取首屏评论数据，实现 RSC 模式。
 * 评论是公开数据，无需认证。
 *
 * @param postId 文章 ID
 * @param page 页码 (默认 1)
 * @param pageSize 每页条数 (默认 5)
 */
export async function getCommentsServer(
  postId: number,
  page = 1,
  pageSize = 5
) {
  try {
    const baseUrl = process.env.BACKEND_URL || "http://backend:8080";

    const res = await fetch(
      `${baseUrl}/api/comments?postId=${postId}&page=${page}&pageSize=${pageSize}`,
      {
        next: { revalidate: 60 }, // 评论缓存 60 秒
      }
    );

    if (!res.ok) {
      return { success: false, comments: [], totalCount: 0, hasMore: false };
    }

    const json = await res.json();
    return {
      success: json.success ?? false,
      comments: json.comments ?? [],
      totalCount: json.totalCount ?? 0,
      hasMore: json.hasMore ?? false,
    };
  } catch (error) {
    console.error("Fetch comments error:", error);
    return { success: false, comments: [], totalCount: 0, hasMore: false };
  }
}
