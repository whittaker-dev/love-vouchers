import type { ApiErrorBody } from "@love/shared";

/** Error carrying the API's Vietnamese message and, for validation failures, per-field messages. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(0, "Không kết nối được máy chủ, kiểm tra mạng nhé");
  }

  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body as Partial<ApiErrorBody> | null;
    throw new ApiError(response.status, error?.error ?? "Có lỗi xảy ra", error?.fields ?? {});
  }
  return body as T;
}

export const json = (data: unknown): RequestInit["body"] => JSON.stringify(data);
