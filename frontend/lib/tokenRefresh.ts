// Token 刷新单例模块
// --------------------------------------------------------------------------------
// 此模块实现了 **Promise 缓存模式 (Singleton Refresh Pattern)**，
// 确保同一时刻只有一个 Token 刷新请求在执行，避免 "Thundering Herd (惊群效应)" 问题。
//
// **问题场景**：
// 当 Access Token 过期时，Middleware 和 /api/auth/me 可能同时发起刷新请求，
// 导致后端收到多个并发请求，Cookie 被多次覆盖，甚至在 Refresh Token 轮换时产生竞态条件。
//
// **解决方案**：
// 使用模块级变量 `refreshPromise` 缓存正在执行的刷新 Promise，
// 后续请求直接复用该 Promise，避免重复请求。
// --------------------------------------------------------------------------------

/**
 * Token 刷新结果接口
 */
export interface RefreshResult {
  /** 刷新是否成功 */
  success: boolean;
  /** 新的 Access Token (JWT) */
  accessToken?: string;
  /** 新的 Refresh Token (可能与旧的相同，取决于后端轮换策略) */
  refreshToken?: string;
}

// 模块级变量：缓存正在执行的刷新 Promise
let refreshPromise: Promise<RefreshResult> | null = null;

/**
 * 单例 Token 刷新函数
 * 
 * 如果当前已有刷新请求在执行，直接返回该 Promise，避免并发请求。
 * 
 * @param currentAccessToken - 当前的 Access Token (可能已过期)
 * @param currentRefreshToken - 当前的 Refresh Token
 * @param backendUrl - 后端服务 URL
 * @returns 刷新结果，包含新的 Token 对
 */
export async function refreshTokenSingleton(
  currentAccessToken: string | undefined,
  currentRefreshToken: string,
  backendUrl: string
): Promise<RefreshResult> {
  // 🔒 关键逻辑：如果已有刷新请求在执行，复用该 Promise
  if (refreshPromise) {
    console.log("[TokenRefresh] 复用已有的刷新请求");
    return refreshPromise;
  }

  console.log("[TokenRefresh] 发起新的刷新请求");

  // 创建新的刷新 Promise 并缓存
  refreshPromise = doRefresh(currentAccessToken, currentRefreshToken, backendUrl)
    .finally(() => {
      // 无论成功失败，都清除缓存，允许下次刷新
      refreshPromise = null;
    });

  return refreshPromise;
}

/**
 * 实际执行 Token 刷新的内部函数
 */
async function doRefresh(
  currentAccessToken: string | undefined,
  currentRefreshToken: string,
  backendUrl: string
): Promise<RefreshResult> {
  try {
    // 生成 Correlation ID 用于追踪此刷新请求
    const correlationId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 8) 
      : Math.random().toString(36).slice(2, 10);

    const response = await fetch(`${backendUrl}/api/auth/refresh-token`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Correlation-ID": correlationId,
      },
      body: JSON.stringify({
        accessToken: currentAccessToken || "",
        refreshToken: currentRefreshToken,
      }),
      // 设置超时，避免请求无限等待
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("[TokenRefresh] 刷新成功");
      return {
        success: true,
        accessToken: data.token,
        refreshToken: data.refreshToken,
      };
    } else {
      console.warn(`[TokenRefresh] 刷新失败: ${response.status} ${response.statusText}`);
      return { success: false };
    }
  } catch (error) {
    console.error("[TokenRefresh] 刷新异常:", error);
    return { success: false };
  }
}
