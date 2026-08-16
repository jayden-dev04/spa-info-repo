import { BrowserRouter, Routes, Route, Link, NavLink, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Leaf, Phone, MapPin, Clock, Sparkles, Heart } from 'lucide-react'
import Home from './pages/Home'
import Booking from './pages/Booking'
import Shop from './pages/Shop'
import Blog from './pages/Blog'
import AdminDashboard from './pages/admin/Dashboard'
import PromoPopup from './components/PromoPopup'
import './index.css'

function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/80 transition-all">
      {/* Top Banner Notice */}
      <div className="bg-primary text-primary-foreground text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
        <span>Ưu đãi tháng này: Tặng liệu trình ngâm chân thảo mộc cho mọi lịch hẹn dưỡng sinh</span>
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

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link 
            to="/booking" 
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Đặt Lịch Ngay</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-secondary/70 border-t border-border mt-20 pt-14 pb-8 text-foreground">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-border/60">
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
                <span>Hotline: 0912 345 678</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <span>Ninh Kiều, Cần Thơ</span>
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
            <Link to="/admin" className="hover:text-primary font-medium">Trang Quản Trị</Link>
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
      <PromoPopup />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Client Routes (with Navbar & Footer) */}
        <Route element={<ClientLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/blog" element={<Blog />} />
        </Route>

        {/* Standalone Admin Route (Completely separate full-screen layout) */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      <Toaster richColors />
    </BrowserRouter>
  )
}

export default App
