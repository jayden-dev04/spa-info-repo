import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import Home from './pages/Home'
import Booking from './pages/Booking'
import Shop from './pages/Shop'
import Blog from './pages/Blog'
import AdminDashboard from './pages/admin/Dashboard'
import './index.css'

function Navbar() {
  return (
    <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary">Eva Spa</Link>
        <div className="space-x-6">
          <Link to="/" className="text-foreground hover:text-primary transition-colors">Trang chủ</Link>
          <Link to="/booking" className="text-foreground hover:text-primary transition-colors">Đặt lịch</Link>
          <Link to="/shop" className="text-foreground hover:text-primary transition-colors">Cửa hàng</Link>
          <Link to="/blog" className="text-foreground hover:text-primary transition-colors">Blog</Link>
        </div>
        <div>
          <Link to="/booking" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors">Đặt Lịch Ngay</Link>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <footer className="bg-secondary text-secondary-foreground text-center py-6 mt-12 border-t">
          <p>&copy; {new Date().getFullYear()} Eva Spa Cần Thơ. All rights reserved.</p>
        </footer>
        <Toaster richColors />
      </div>
    </BrowserRouter>
  )
}

export default App
