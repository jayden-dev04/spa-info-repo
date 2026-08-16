import { 
  DollarSign, 
  CalendarCheck2, 
  ShoppingBag, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Leaf
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface OverviewTabProps {
  stats: {
    appointments: number
    orders: number
    pendingAppointments: number
    confirmedAppointments: number
    totalRevenue: number
  }
  recentAppointments: any[]
  recentOrders: any[]
  onSelectTab: (tab: string) => void
  onUpdateStatus: (id: string, status: string) => void
}

export default function OverviewTab({
  stats,
  recentAppointments,
  recentOrders,
  onSelectTab,
  onUpdateStatus,
}: OverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* 21st.dev Style Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Revenue */}
        <Card className="rounded-2xl border-border/80 shadow-2xs hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Doanh Thu Ước Tính
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalRevenue.toLocaleString('vi-VN')}đ
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-primary">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.5% so với tuần trước</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pending Appointments */}
        <Card className="rounded-2xl border-border/80 shadow-2xs hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Lịch Hẹn Cần Duyệt
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {stats.pendingAppointments} lịch
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tổng số {stats.appointments} lượt hẹn trên hệ thống
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Orders */}
        <Card className="rounded-2xl border-border/80 shadow-2xs hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Đơn Hàng Mỹ Phẩm
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.orders} đơn
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Từ danh mục mỹ phẩm thảo mộc
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Service Quality & Staff */}
        <Card className="rounded-2xl border-border/80 shadow-2xs hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Công Suất Phòng Spa
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              85% Công Suất
            </div>
            <p className="text-xs text-primary font-medium mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>4/5 Phòng trị liệu đang sẵn sàng</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Latest Appointments & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Latest Appointments & Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Appointments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-bold text-primary">Lịch Hẹn Mới Đặt Gần Đây</h2>
                <p className="text-xs text-muted-foreground">Khách hàng đặt hẹn từ website cần xác nhận</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectTab('appointments')}
                className="text-xs rounded-xl flex items-center gap-1 border-border hover:bg-secondary"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="bg-card rounded-2xl border border-border/80 shadow-2xs overflow-hidden">
              {recentAppointments.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  <CalendarCheck2 className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                  <span>Chưa có lịch hẹn nào.</span>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {recentAppointments.slice(0, 4).map((apt) => {
                    const isPending = apt.status === 'pending' || !apt.status
                    const dateFormatted = apt.appointment_date 
                      ? new Date(apt.appointment_date).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Chưa xếp lịch'

                    return (
                      <div key={apt.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/30 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{apt.customer_name}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] font-semibold ${
                                isPending 
                                  ? 'bg-accent/15 text-accent border-accent/30' 
                                  : 'bg-primary/10 text-primary border-primary/20'
                              }`}
                            >
                              {isPending ? 'Chờ xác nhận' : 'Đã xác nhận'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>SĐT: <strong className="text-foreground">{apt.customer_phone}</strong></span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-accent" />
                              {dateFormatted}
                            </span>
                          </div>
                          {apt.notes && (
                            <p className="text-xs text-muted-foreground italic bg-secondary/50 px-2 py-1 rounded-md mt-1">
                              &ldquo;{apt.notes}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isPending ? (
                            <Button
                              size="sm"
                              onClick={() => onUpdateStatus(apt.id, 'confirmed')}
                              className="bg-primary hover:bg-primary/90 text-white text-xs rounded-xl h-8 px-3"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Xác nhận
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUpdateStatus(apt.id, 'completed')}
                              className="text-xs rounded-xl h-8 px-3 border-border hover:bg-secondary"
                            >
                              Hoàn tất
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders Overview */}
          {recentOrders.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-serif font-bold text-primary">Đơn Hàng Mỹ Phẩm Gần Đây</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectTab('orders')}
                  className="text-xs text-accent hover:text-accent font-semibold flex items-center gap-1"
                >
                  <span>Xem đơn hàng ({recentOrders.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="bg-card rounded-2xl border border-border/80 divide-y divide-border/60 overflow-hidden shadow-2xs">
                {recentOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="p-3.5 px-5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{order.customer_name}</p>
                      <p className="text-muted-foreground">{order.customer_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent">{(order.total_amount || 0).toLocaleString('vi-VN')}đ</p>
                      <p className="text-[10px] text-muted-foreground">{order.status || 'Chờ xử lý'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Top Services & Daily Tips */}
        <div className="space-y-6">
          {/* Top Services */}
          <div className="bg-card rounded-2xl border border-border/80 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 text-primary font-serif font-bold">
              <Leaf className="w-4 h-4 text-accent" />
              <span>Top Liệu Trình Đắt Khách</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Gội Đầu Dưỡng Sinh Thảo Dược</span>
                  <span className="text-accent">48%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '48%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Massage Body Đá Nóng Himalaya</span>
                  <span className="text-accent">32%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: '32%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Chăm Sóc & Phục Hồi Da Thảo Mộc</span>
                  <span className="text-accent">20%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary/70 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="bg-secondary/60 rounded-2xl border border-border p-5 space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <AlertCircle className="w-4 h-4 text-accent" />
              <span>Lưu Ý Vận Hành Spa</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nhắc nhở kỹ thuật viên chuẩn bị sẵn nồi nước gội đầu bồ kết ấm và tinh dầu tràm/quế trước giờ hẹn của khách 10 phút.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
