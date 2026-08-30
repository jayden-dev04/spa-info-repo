import { useState } from 'react'
import { X, Leaf, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

/**
 * Chỉ còn MỘT cổng đăng nhập: Google.
 * Role (admin / staff / user) không chọn ở đây — backend quyết định
 * qua POST /api/auth/exchange (server/app/Http/Controllers/AuthController.php).
 */
export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen } = useAuth()
  const [loading, setLoading] = useState(false)

  if (!isAuthModalOpen) return null

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Supabase chuyển tiếp Google → Google redirect về đây (không qua :8000)
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
          skipBrowserRedirect: false,
        },
      })

      if (error) throw error
      if (data.url) {
        window.location.assign(data.url)
        return
      }
      throw new Error('Không nhận được link đăng nhập Google')
    } catch (err: any) {
      toast.error(err?.message || 'Không thể mở trang đăng nhập Google')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in font-sans">
      <div
        className="w-full max-w-md bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-sm p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <Leaf className="w-6 h-6 text-accent" />
          </div>
          <h3 className="font-serif font-bold text-2xl text-primary">Tài Khoản Eva Spa</h3>
          <p className="text-xs text-muted-foreground">
            Theo dõi lịch hẹn trị liệu &amp; đơn hàng mỹ phẩm thảo mộc
          </p>
        </div>

        {/* Google Login Only */}
        <div className="space-y-4 text-xs">
          <Button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full h-auto px-8 py-3.5 bg-white hover:bg-secondary/60 text-foreground border border-border rounded-full text-sm font-bold transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {loading ? (
              <>
                <LogIn className="w-4 h-4 animate-pulse" />
                <span>Đang mở Google...</span>
              </>
            ) : (
              <>
                <svg className="size-6 shrink-0" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Đăng nhập với Google</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
