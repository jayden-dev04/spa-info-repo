import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

/**
 * Nơi Google redirect về: /auth/callback?code=...
 * supabase-js (persistSession mặc định) tự đổi code lấy session;
 * AuthContext.onAuthStateChange sẽ gọi backend lấy role.
 * Trang này chỉ chờ session rồi đưa user về /account (hoặc trang trước đó).
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const returnTo = sessionStorage.getItem('eva_spa_return_to') || '/account'
    sessionStorage.removeItem('eva_spa_return_to')

    const finish = (ok: boolean) => {
      if (cancelled) return
      // replace() luôn xóa ?code=... khỏi URL (cả nhánh thành công lẫn lỗi)
      if (ok) navigate(returnTo, { replace: true })
      else navigate('/auth/callback', { replace: true })
    }

    // Chờ supabase-js đổi code → session (tối đa 8s)
    let waited = 0
    const timer = window.setInterval(async () => {
      waited += 250
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        window.clearInterval(timer)
        finish(true)
      } else if (waited >= 8000) {
        window.clearInterval(timer)
        finish(false)
        setFailed(true)
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [navigate])

  useEffect(() => {
    if (failed) toast.error('Đăng nhập Google chưa hoàn tất. Vui lòng thử lại.')
  }, [failed])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background font-sans text-center px-4">
      <Sparkles className="w-8 h-8 text-accent animate-pulse" />
      <p className="text-sm font-semibold text-primary">
        {failed ? 'Không xác thực được phiên Google' : 'Đang xác thực Google...'}
      </p>
      <p className="text-xs text-muted-foreground">Vui lòng đợi trong giây lát.</p>
    </div>
  )
}
