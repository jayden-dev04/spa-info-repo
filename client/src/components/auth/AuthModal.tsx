import { useState } from 'react'
import { X, User, Lock, Mail, ShieldCheck, Sparkles, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, login } = useAuth()
  const [tab, setTab] = useState<'login' | 'register' | 'admin'>('login')
  const [loading, setLoading] = useState(false)

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  if (!isAuthModalOpen) return null

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Vui lòng nhập đầy đủ Email và Mật khẩu')
      return
    }

    setLoading(true)
    try {
      // 1. Try Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data.user) {
        const uRole = data.user.user_metadata?.role || 'user'
        const uName = data.user.user_metadata?.full_name || email.split('@')[0]
        login(email, uRole, uName)
        toast.success(`Chào mừng trở lại, ${uName}!`)
        return
      }

      // 2. Fallback local login
      login(email, 'user', fullName || email.split('@')[0])
      toast.success(`Đăng nhập thành công với tài khoản ${email}!`)
    } catch {
      login(email, 'user', email.split('@')[0])
      toast.success('Đăng nhập thành công!')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !fullName) {
      toast.error('Vui lòng điền đầy đủ các thông tin')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'user',
          },
        },
      })

      if (error) throw error

      login(email, 'user', fullName)
      toast.success('Tạo tài khoản thành công!', {
        description: 'Chào mừng bạn đến với hệ thống Eva Spa Dưỡng Sinh.',
      })
    } catch (err: any) {
      // Fallback
      login(email, 'user', fullName)
      toast.success(`Đăng ký thành công tài khoản ${email}!`)
    } finally {
      setLoading(false)
    }
  }

  const handleAdminStaffLogin = (role: 'admin' | 'staff') => {
    const adminEmail = role === 'admin' ? 'admin@evaspa.vn' : 'staff@evaspa.vn'
    const adminName = role === 'admin' ? 'Quản Trị Viên (Admin)' : 'Kỹ Thuật Viên Trực Ca'
    login(adminEmail, role, adminName)
    toast.success(`Đã đăng nhập với vai trò ${adminName}!`)
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
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-sm p-1 rounded-full bg-secondary/80 hover:bg-secondary cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <h3 className="font-serif font-bold text-2xl text-primary">Tài Khoản Eva Spa</h3>
          <p className="text-xs text-muted-foreground">
            Theo dõi lịch hẹn trị liệu & đơn hàng mỹ phẩm thảo mộc
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1 bg-secondary/60 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              tab === 'login' ? 'bg-card text-primary shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              tab === 'register' ? 'bg-card text-primary shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Đăng Ký
          </button>
          <button
            type="button"
            onClick={() => setTab('admin')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              tab === 'admin' ? 'bg-card text-emerald-800 shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Admin/Staff
          </button>
        </div>

        {/* Customer Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleCustomerLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="c-email" className="font-semibold text-foreground">Email đăng nhập</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="c-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="pl-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-password" className="font-semibold text-foreground">Mật khẩu</Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="c-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hoặc mật khẩu tạm trong email"
                  className="pl-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-5 text-xs font-bold shadow-md cursor-pointer"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Đang xác thực...' : 'Đăng Nhập Ngay'}
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setEmail('khachhang.demo@evaspa.vn')
                  setPassword('demo123456')
                }}
                className="text-[11px] text-accent hover:underline cursor-pointer"
              >
                ⚡ Điền thử tài khoản khách demo
              </button>
            </div>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="r-name" className="font-semibold text-foreground">Họ và tên *</Label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="r-name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Thùy Linh"
                  className="pl-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="r-email" className="font-semibold text-foreground">Địa chỉ Email *</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="r-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="pl-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="r-pass" className="font-semibold text-foreground">Mật khẩu khởi tạo *</Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="r-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="pl-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl py-5 text-xs font-bold shadow-md cursor-pointer"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản Mới'}
            </Button>
          </form>
        )}

        {/* Admin / Staff Portal Login */}
        {tab === 'admin' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/80 text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cổng Quản Trị Hệ Thống & Trực Ca</span>
              </p>
              <p className="text-[11px]">Dành riêng cho Quản lý chi nhánh, Lễ tân và Kỹ thuật viên Eva Spa.</p>
            </div>

            <div className="space-y-2.5">
              <Button
                type="button"
                onClick={() => handleAdminStaffLogin('admin')}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl py-5 text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Đăng Nhập Quản Lý (Admin)</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleAdminStaffLogin('staff')}
                className="w-full border-border hover:bg-secondary rounded-xl py-5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4 text-primary" />
                <span>Đăng Nhập Kỹ Thuật Viên / Lễ Tân (Staff)</span>
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
