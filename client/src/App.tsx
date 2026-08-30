import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Leaf, Phone, MapPin, Clock, Sparkles, Heart, ShoppingBag, User } from 'lucide-react'
import { CartProvider, useCart } from '@/context/CartContext'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import CartDrawer from '@/components/cart/CartDrawer'
import AuthModal from '@/components/auth/AuthModal'
import Home from './pages/Home'
import Booking from './pages/Booking'
import Shop from './pages/Shop'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import Account from './pages/Account'
import AuthCallback from './pages/AuthCallback'
import AdminPortalRoute from './pages/admin/AdminPortalRoute'
import PromoPopup from './components/PromoPopup'
import { getCachedPopupConfig, fetchPopupConfig } from '@/lib/siteConfig'
import './index.css'

function Navbar() {
  const { totalItems, setIsCartOpen } = useCart()
  const { user, setIsAuthModalOpen } = useAuth()
  // Coupon tháng này — cache local ngay, rồi đồng bộ từ Supabase popup_configs
  const [bannerConfig, setBannerConfig] = useState(() => {
    const cfg = getCachedPopupConfig()
    return { couponCode: cfg.couponCode || '', couponExpiresAt: cfg.couponExpiresAt || '' }
    // (cache-local khởi tạo; fetchPopupConfig() phía dưới đồng bộ từ Supabase)
  })
  useEffect(() => {
    fetchPopupConfig().then((cfg) =>
      setBannerConfig({ couponCode: cfg.couponCode || '', couponExpiresAt: cfg.couponExpiresAt || '' }),
    )
  }, [])
  const { couponCode, couponExpiresAt } = bannerConfig

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/80 transition-all font-sans">
      {/* Top Banner Notice */}
      <div className="bg-primary text-primary-foreground text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
        <span>
          Ưu đãi tháng này: Miễn phí giao hàng toàn quốc cho đơn mỹ phẩm từ 500.000đ
          {couponCode && (
            <> — mã <span className="font-mono font-bold text-accent">{couponCode}</span>{couponExpiresAt ? ` (hạn ${couponExpiresAt})` : ''}</>
          )}
        </span>
      </div>

      <div className="container mx-auto px-4 py-3.5 flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-xs">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-serif font-bold text-primary tracking-tight block leading-none">Eva Spa</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Dưỡng Sinh & Thảo Mộc</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              isActive 
                ? "text-primary font-semibold border-b-2 border-primary pb-0.5" 
                : "text-foreground/80 hover:text-primary transition-colors"
            }
          >
            Trang chủ
          </NavLink>
          <NavLink 
            to="/booking" 
            className={({ isActive }) => 
              isActive 
                ? "text-primary font-semibold border-b-2 border-primary pb-0.5" 
                : "text-foreground/80 hover:text-primary transition-colors"
            }
          >
            Đặt lịch
          </NavLink>
          <NavLink 
            to="/shop" 
            className={({ isActive }) => 
              isActive 
                ? "text-primary font-semibold border-b-2 border-primary pb-0.5" 
                : "text-foreground/80 hover:text-primary transition-colors"
            }
          >
            Sản phẩm thảo mộc
          </NavLink>
          <NavLink 
            to="/blog" 
            className={({ isActive }) => 
              isActive 
                ? "text-primary font-semibold border-b-2 border-primary pb-0.5" 
                : "text-foreground/80 hover:text-primary transition-colors"
            }
          >
            Góc dưỡng sinh
          </NavLink>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Shopping Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-xl bg-secondary/80 hover:bg-secondary text-primary transition-all cursor-pointer flex items-center justify-center border border-border"
            title="Giỏ hàng"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-xs animate-in zoom-in">
                {totalItems}
              </span>
            )}
          </button>

          {/* User Account / Login Button */}
          {user ? (
            <Link
              to="/account"
              className="group flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground pl-1.5 pr-3 py-1.5 rounded-full text-xs font-semibold border border-border transition-all"
              title="Trang cá nhân & Lịch hẹn"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-border group-hover:ring-accent/50 transition-all"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).dataset.broken = '1'; e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline max-w-[160px] truncate">{user.fullName}</span>
            </Link>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary transition-all cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </button>
          )}

          {/* Booking CTA */}
          <Link 
            to="/booking" 
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-accent text-accent-foreground px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-accent/90 transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Đặt Lịch</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  const { user } = useAuth()
  const isStaff = user?.role === 'admin' || user?.role === 'staff'
  return (
    <footer className="bg-secondary/70 border-t border-border mt-20 pt-14 pb-8 text-foreground font-sans">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-border/60 text-left">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <Leaf className="w-4 h-4" />
              </div>
              <span className="text-2xl font-serif font-bold text-primary">Eva Spa</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Không gian trị liệu dưỡng sinh và làm đẹp từ 100% thảo mộc thiên nhiên, giúp thanh lọc cơ thể và tìm lại sự cân bằng trong tâm hồn.
            </p>
          </div>

          {/* Col 2: Services */}
          <div className="space-y-3 text-sm">
            <h4 className="font-serif font-bold text-base text-primary">Liệu Trình Dưỡng Sinh</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/booking" className="hover:text-primary transition-colors">Gội đầu dưỡng sinh thảo dược</Link></li>
              <li><Link to="/booking" className="hover:text-primary transition-colors">Massage body đá nóng Himalaya</Link></li>
              <li><Link to="/booking" className="hover:text-primary transition-colors">Chăm sóc & trẻ hóa da thảo mộc</Link></li>
              <li><Link to="/booking" className="hover:text-primary transition-colors">Xông hơi thải độc Hoàng Cung</Link></li>
            </ul>
          </div>

          {/* Col 3: Hours & Booking */}
          <div className="space-y-3 text-sm">
            <h4 className="font-serif font-bold text-base text-primary">Thời Gian Hoạt Động</h4>
            <div className="space-y-2 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent shrink-0" />
                <span>Thứ 2 - Chủ Nhật: 09:00 - 20:30</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <span>Hotline: 0766.98.3979</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <span>9B Lý Tự Trọng, Ninh Kiều, Cần Thơ</span>
              </div>
            </div>
          </div>

          {/* Col 4: Trust Badge */}
          <div className="space-y-3 bg-card p-4 rounded-xl border border-border/80 shadow-2xs text-sm">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Heart className="w-4 h-4 text-accent fill-accent" />
              <span>Cam Kết Chất Lượng</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              100% thảo mộc thiên nhiên hữu cơ, không chứa hóa chất độc hại, đảm bảo an toàn tuyệt đối cho làn da và sức khỏe.
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 text-center text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>&copy; {new Date().getFullYear()} Eva Spa Cần Thơ — Dưỡng Sinh & Spa Thảo Mộc. All rights reserved.</p>
          <div className="flex space-x-4">
            <Link to="/" className="hover:text-primary">Chính sách bảo mật</Link>
            <Link to="/" className="hover:text-primary">Điều khoản dịch vụ</Link>
            {isStaff && (
              <Link to="/admin" className="hover:text-primary font-medium">Trang Quản Trị</Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}

function ClientLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <AuthModal />
      <PromoPopup />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public Client Routes (with Navbar & Footer) */}
            <Route element={<ClientLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogDetail />} />
              <Route path="/account" element={<Account />} />
            </Route>

            {/* Google OAuth redirect đích — không layout */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Portal Quản Trị — chỉ role admin/staff do backend cấp */}
            <Route path="/admin" element={<AdminPortalRoute />} />
          </Routes>
          <Toaster richColors />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
