export async function fetchClient<T = any>(
  endpoint: string,
  options?: Omit<RequestInit, "body"> & { body?: unknown }
): Promise<T> {
  const { body, headers, ...customConfig } = options || {};

  // Default headers
  const configHeaders: HeadersInit = {
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
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      // Response Body 是流式的，只能消费一次
      // 先读取 text，再尝试解析为 JSON
      const text = await response.text();
      if (text) {
        try {
          const errorData = JSON.parse(text);
          if (errorData?.message) {
            errorMessage = errorData.message;
          } else {
            errorMessage += ` - ${text}`;
          }
        } catch {
          // JSON 解析失败，使用原始文本
          errorMessage += ` - ${text}`;
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
