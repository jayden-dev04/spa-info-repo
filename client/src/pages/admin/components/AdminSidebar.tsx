import { Link } from 'react-router-dom'
import { 
  LayoutDashboard, 
  CalendarCheck2, 
  ShoppingBag, 
  Package,
  Sparkles, 
  Users2, 
  Leaf, 
  ChevronRight, 
  ExternalLink, 
  ShieldCheck,
  BookOpen,
  Megaphone
} from 'lucide-react'

interface AdminSidebarProps {
  currentTab: string
  setCurrentTab: (tab: string) => void
  pendingCount: number
  ordersCount: number
}

export default function AdminSidebar({ 
  currentTab, 
  setCurrentTab, 
  pendingCount, 
  ordersCount 
}: AdminSidebarProps) {
  const menuItems = [
    {
      id: 'overview',
      label: 'Tổng quan hệ thống',
      icon: LayoutDashboard,
    },
    {
      id: 'appointments',
      label: 'Quản lý Đặt lịch',
      icon: CalendarCheck2,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'orders',
      label: 'Đơn hàng TMĐT',
      icon: ShoppingBag,
      badge: ordersCount > 0 ? ordersCount : null,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'products',
      label: 'Sản phẩm & Mỹ phẩm',
      icon: Package,
    },
    {
      id: 'blog',
      label: 'Bài viết & Blog SEO',
      icon: BookOpen,
    },
    {
      id: 'popup',
      label: 'Popup & Khuyến Mãi',
      icon: Megaphone,
    },
    {
      id: 'services',
      label: 'Gói Liệu trình Spa',
      icon: Sparkles,
    },
    {
      id: 'staff',
      label: 'Kỹ thuật viên & Phòng',
      icon: Users2,
    },
  ]

  return (
    <aside className="w-64 bg-[#0f1713] text-white border-r border-[#1c2e25] flex flex-col shrink-0 h-screen select-none font-sans">
      {/* Brand & Role Header */}
      <div className="p-5 border-b border-[#1c2e25] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#1e3a2d] flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-md">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif font-bold text-lg text-white block leading-none tracking-tight">Eva Spa Studio</span>
            <div className="flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider font-sans">Admin Portal</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <div className="p-3 flex-1 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">
          Hệ Thống Quản Trị
        </div>
        
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-800/90 text-white font-semibold shadow-md border border-emerald-600/40'
                  : 'text-zinc-300 hover:bg-[#182920] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge !== null && item.badge !== undefined && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-[#1c2e25] space-y-3 bg-[#0c130f]">
        <Link
          to="/"
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-[#182920] transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Mở website khách</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>

        <div className="pt-2 border-t border-[#1c2e25] flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50 font-bold flex items-center justify-center text-xs">
              AD
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-white leading-none">Quản Lý Chi Nhánh</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Ninh Kiều, Cần Thơ</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
