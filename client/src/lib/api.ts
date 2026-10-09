// Địa chỉ backend Laravel — override bằng VITE_API_BASE trong .env khi cần.
export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)
  ?.replace(/\/+$/, '')
  ?? 'http://localhost:8000'

/**
 * Admin API token: backend Laravel đọc env ADMIN_API_TOKEN và chặn
 * GET/PATCH /api/orders & /api/appointments khi token được set.
 * Client đặt token vào localStorage('eva_admin_api_token').
 */
const ADMIN_TOKEN_KEY = 'eva_admin_api_token'

export function getAdminApiToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * fetch() wrapper cho các admin API (GET/PATCH orders & appointments):
 * tự gắn header X-Admin-Token nếu có token trong localStorage.
 * Signature giống fetch() gốc → thay thế trực tiếp, không phá chức năng hiện có.
 */
export async function adminFetch(
  input: string | URL | Request,
  init: RequestInit = {},
): Promise<Response> {
  const token = getAdminApiToken()

  const headers = new Headers(init.headers ?? {})
  if (token && !headers.has('X-Admin-Token')) {
    headers.set('X-Admin-Token', token)
  }

  return fetch(input, { ...init, headers })
}
