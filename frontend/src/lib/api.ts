import { ApiError } from "@student-portal/shared";

interface RequestOptions extends RequestInit {
  json?: any;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, ...init } = options;
  const headers = new Headers(init.headers);

  // Set credentials option so cookies are automatically sent/received
  init.credentials = "include";

  if (json) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(json);
  }

  init.headers = headers;

  const res = await fetch(path, init);

  if (res.status === 204) {
    return {} as T;
  }

  let data: any;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }

  if (!res.ok) {
    // Construct ApiError structure matching server output
    const err: ApiError = {
      message: data?.message || "Something went wrong",
      errors: data?.errors,
    };
    
    // Auto-redirect to login on 401 if not hitting auth endpoints
    if (res.status === 401 && !path.includes("/api/auth/")) {
      window.location.href = "/login";
    }
    
    throw err;
  }

  return data as T;
}
