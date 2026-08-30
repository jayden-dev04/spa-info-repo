import { toast } from 'sonner'

/**
 * Supabase GoTrue khi lỗi OAuth sẽ redirect về Site URL kèm query/hash
 * (?error=...&error_code=...&error_description=...). URL đó không đi qua
 * /auth/callback nên phải bắt ở ngay trang nhận redirect.
 * Trả về true nếu URL có lỗi và đã toast.
 */
export function consumeOAuthError(): boolean {
  // GoTrue gắn lỗi cả ở query string lẫn hash fragment (#error=...)
  const raw = [window.location.search, window.location.hash.replace(/^#/, '')]
    .filter(Boolean)
    .join('&')
  if (!raw.includes('error')) return false

  const p = new URLSearchParams(raw)
  const code = p.get('error_code') || p.get('error') || ''
  const desc = p.get('error_description') || ''

  if (!code && !desc) return false

  const messages: Record<string, string> = {
    bad_oauth_state: 'Phiên đăng nhập Google đã hết hạn (mở tab/cửa sổ cũ). Hãy thử lại.',
    otp_expired: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.',
    access_denied: 'Bạn đã hủy quyền truy cập. Vui lòng đăng nhập lại và chọn "Cho phép".',
    email_not_confirmed: 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.',
    email_exists: 'Email này đã có tài khoản. Hãy đăng nhập bằng Google cùng email.',
    over_request_limit: 'Thử quá nhiều lần. Vui lòng chờ ít phút rồi thử lại.',
  }

  toast.error(messages[code] || 'Đăng nhập Google thất bại', {
    description: desc || undefined,
    duration: 8000,
  })

  // Xóa tham số lỗi khỏi URL để F5 không toast lặp
  const clean = window.location.pathname + window.location.hash.replace(/[#&]?(error|error_code|error_description|code)=[^&]*/g, '').replace(/[?&]$/, '')
  window.history.replaceState({}, '', clean || window.location.pathname)

  return true
}
