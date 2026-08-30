// Địa chỉ backend Laravel — override bằng VITE_API_BASE trong .env khi cần.
export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)
  ?.replace(/\/+$/, '')
  ?? 'http://localhost:8000'
