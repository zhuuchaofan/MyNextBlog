// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchClient<T = any>(
  endpoint: string,
  options?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<T> {
  const { body, headers, ...customConfig } = options || {};

  // 生成 Correlation ID 用于请求链路追踪
  // 使用 crypto.randomUUID() 生成唯一 ID，取前8位更简洁
  const correlationId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  // Default headers
  const configHeaders: HeadersInit = {
    // Correlation ID 用于追踪请求链路
    "X-Correlation-ID": correlationId,
    // If body is NOT FormData, default to application/json
    ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...headers,
  };

  const config: RequestInit = {
    ...customConfig,
    headers: configHeaders,
  };

  if (body) {
    // If it's FormData, let the browser handle serialization (and Content-Type boundary)
    // Otherwise, stringify JSON
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  // Ensure endpoint starts with /api/backend if not already (helper convenience)
  // But strictly speaking our api.ts calls usually include it.
  // Let's assume the caller passes the full relative path e.g. /api/backend/posts
  const response = await fetch(endpoint, config);

  if (!response.ok) {
    // 定义常见 HTTP 状态码的友好错误消息
    const statusMessages: Record<number, string> = {
      400: "请求参数错误",
      401: "登录已过期，请重新登录",
      403: "没有权限执行此操作",
      404: "请求的资源不存在",
      409: "操作冲突，请刷新后重试",
      422: "数据验证失败",
      429: "请求过于频繁，请稍后再试",
      500: "服务器内部错误，请稍后重试",
      502: "服务暂时不可用，请稍后重试",
      503: "服务维护中，请稍后重试",
    };

    // 默认错误消息（基于状态码或通用消息）
    let errorMessage =
      statusMessages[response.status] || `请求失败 (${response.status})`;

    try {
      // Response Body 是流式的，只能消费一次
      // 先读取 text，再尝试解析为 JSON
      const text = await response.text();
      if (text) {
        try {
          const errorData = JSON.parse(text);

          // 优先使用 message/Message 字段（兼容大小写）
          const serverMessage = errorData?.message || errorData?.Message;
          if (serverMessage && typeof serverMessage === "string") {
            // 过滤掉通用的英文错误消息，使用我们自定义的中文消息
            const genericMessages = [
              "Internal Server Error",
              "An error occurred",
              "Bad Request",
              "Unauthorized",
              "Forbidden",
              "Not Found",
            ];
            const isGeneric = genericMessages.some((m) =>
              serverMessage.toLowerCase().includes(m.toLowerCase()),
            );
            if (!isGeneric) {
              errorMessage = serverMessage;
            }
          }
          // ASP.NET Core 验证错误格式：{ errors: { field: ["error1", "error2"] } }
          else if (errorData?.errors) {
            const errorMessages = Object.values(errorData.errors)
              .flat()
              .filter(
                (msg): msg is string =>
                  typeof msg === "string" && msg.length > 0,
              );
            if (errorMessages.length > 0) {
              errorMessage = errorMessages.join("；");
            } else if (errorData?.title) {
              errorMessage = errorData.title;
            }
          }
          // 使用 title 字段
          else if (errorData?.title && typeof errorData.title === "string") {
            errorMessage = errorData.title;
          }
          // 不再降级到原始文本，避免暴露 JSON 给用户
        } catch {
          // JSON 解析失败，保持默认的友好错误消息
        }
      }
    } catch {
      // text() 读取失败，保持默认错误信息
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (e.g. 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
