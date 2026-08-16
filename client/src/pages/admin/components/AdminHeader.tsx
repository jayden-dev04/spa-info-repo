import { RefreshCw, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminHeaderProps {
  currentTab: string
  onRefresh: () => void
  loading: boolean
}

export default function AdminHeader({ currentTab, onRefresh, loading }: AdminHeaderProps) {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'overview':
        return { title: 'Bảng Điều Khiển Tổng Quan', subtitle: 'Thống kê hoạt động kinh doanh & lịch hẹn trong ngày' }
      case 'appointments':
        return { title: 'Quản Lý Lịch Hẹn Dưỡng Sinh', subtitle: 'Theo dõi, duyệt lịch và điều phối khách hàng' }
      case 'orders':
        return { title: 'Quản Lý Đơn Hàng Mỹ Phẩm', subtitle: 'Danh sách đơn đặt mua từ website' }
      case 'services':
        return { title: 'Bảng Giá & Gói Dịch Vụ', subtitle: 'Quản lý thông tin và thời lượng liệu trình' }
      case 'staff':
        return { title: 'Kỹ Thuật Viên & Phòng Dịch Vụ', subtitle: 'Tình trạng ca làm việc và công suất phòng' }
      default:
        return { title: 'Quản Trị Hệ Thống', subtitle: 'Hệ thống quản lý Eva Spa Cần Thơ' }
    }
  }

  const { title, subtitle } = getTabTitle(currentTab)
  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <header className="h-20 bg-card border-b border-border px-8 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-heading font-bold text-primary tracking-tight">{title}</h1>
        <p className="text-xs text-muted-foreground font-sans">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Branch tag */}
        <div className="hidden lg:flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-xl text-xs font-medium text-primary">
          <MapPin className="w-3.5 h-3.5 text-accent" />
          <span>Ninh Kiều, Cần Thơ</span>
        </div>

        {/* Date badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-xl text-xs text-muted-foreground font-medium">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span className="capitalize">{today}</span>
        </div>

        {/* Refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl flex items-center gap-1.5 border-border hover:bg-secondary text-foreground"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Làm mới</span>
        </Button>
      </div>
    </header>
  )
}
