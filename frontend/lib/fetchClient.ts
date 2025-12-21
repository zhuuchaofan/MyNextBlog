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
      // Try to parse error message from JSON response if valid
      // Backend usually returns { message: "..." } or similar
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      } else {
         // Fallback to text if JSON parse fails or no message field
         const text = await response.text();
         if (text) errorMessage += ` - ${text}`;
      }
    } catch {
       // If json() fails, try text()
       try {
         const text = await response.text();
         if (text) errorMessage += ` - ${text}`;
       } catch {
         // Ignore
       }
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (e.g. 204 No Content)
  if (response.status === 204) {
      return {} as T; 
  }

  return response.json();
}
