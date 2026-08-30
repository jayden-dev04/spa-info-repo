import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Calendar, ShoppingBag, Clock, CheckCircle2, XCircle, Truck, Sparkles, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Account() {
  const { user, logout, setIsAuthModalOpen } = useAuth()
  const [activeTab, setActiveTab] = useState<'appointments' | 'orders'>('appointments')
  const [appointments, setAppointments] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const loadedFor = useRef<string | null>(null)

  const emailKey = user?.email || ''

  useEffect(() => {
    if (!emailKey) return

    if (loadedFor.current === emailKey) return

    async function loadUserData() {
      try {
        // 1. Load appointments
        const { data: aptData } = await supabase
          .from('appointments')
          .select('*')
          .ilike('customer_email', emailKey)
          .order('created_at', { ascending: false })

        if (aptData) setAppointments(aptData)

        // 2. Load orders
        const { data: orderData } = await supabase
          .from('orders')
          .select('*, order_items(*, products(name))')
          .ilike('customer_email', emailKey)
          .order('created_at', { ascending: false })

        if (orderData) setOrders(orderData)
        loadedFor.current = emailKey
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    loadUserData()
  }, [emailKey])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-secondary text-primary flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-primary mb-2">Đăng Nhập Tài Khoản</h2>
        <p className="text-muted-foreground text-xs mb-6">
          Vui lòng đăng nhập để xem lại lịch hẹn trị liệu và các đơn hàng mỹ phẩm của bạn.
        </p>
        <Button
          onClick={() => setIsAuthModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 text-xs"
        >
          Đăng Nhập Ngay
        </Button>
      </div>
    )
  }

  const isAdminOrStaff = user.role === 'admin' || user.role === 'staff'

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl font-sans text-left">
      
      {/* User Header Profile Card */}
      <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border border-border shadow-xs"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-secondary text-primary font-serif font-bold text-2xl flex items-center justify-center border border-border shadow-xs">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-primary">{user.fullName}</h1>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                {isAdminOrStaff ? 'Quản Trị / Nhân Viên' : 'Khách Hàng Thân Thiết'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdminOrStaff && (
            <Link to="/admin">
              <Button className="bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trang Quản Trị</span>
              </Button>
            </Link>
          )}

          <Button
            variant="outline"
            onClick={logout}
            className="rounded-xl text-xs gap-1.5 border-border hover:bg-secondary text-muted-foreground hover:text-destructive cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-border/60 pb-3 mb-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 pb-2 px-3 transition-all cursor-pointer ${
            activeTab === 'appointments'
              ? 'border-b-2 border-primary text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Lịch Hẹn Của Tôi ({appointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 pb-2 px-3 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'border-b-2 border-primary text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Đơn Hàng Của Tôi ({orders.length})</span>
        </button>
      </div>

      {/* Tab 1: Appointments List */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground text-xs">Đang tải lịch hẹn...</div>
          ) : appointments.length === 0 ? (
            <div className="bg-card p-12 rounded-3xl border border-dashed border-border text-center space-y-3">
              <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <h3 className="font-serif font-bold text-base text-foreground">Bạn chưa có lịch hẹn nào</h3>
              <p className="text-xs text-muted-foreground">Đặt lịch dưỡng sinh để tận hưởng không gian thiền an yên.</p>
              <Link to="/booking">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl text-xs mt-2">
                  Đặt Lịch Trải Nghiệm Ngay
                </Button>
              </Link>
            </div>
          ) : (
            appointments.map((apt) => {
              const status = apt.status || 'pending'
              return (
                <Card key={apt.id} className="rounded-2xl border-border/80 overflow-hidden bg-card">
                  <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-serif font-bold text-base text-foreground">
                          {apt.appointment_date}
                        </span>
                        {status === 'confirmed' ? (
                          <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Đã duyệt lịch
                          </Badge>
                        ) : status === 'completed' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Đã hoàn tất
                          </Badge>
                        ) : status === 'cancelled' ? (
                          <Badge className="bg-rose-100 text-rose-800 text-xs">
                            <XCircle className="w-3 h-3 mr-1" />
                            Đã hủy
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Đang chờ spa xác nhận
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 text-xs text-muted-foreground">
                        <span>Khách: <strong className="text-foreground">{apt.customer_name}</strong></span>
                        <span>•</span>
                        <span>SĐT: <strong>{apt.customer_phone}</strong></span>
                        {apt.note && (
                          <>
                            <span>•</span>
                            <span>Ghi chú: <em>{apt.note}</em></span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <Link to="/booking">
                        <Button variant="outline" size="sm" className="rounded-xl text-xs border-border">
                          Đặt thêm lịch
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Tab 2: Orders List */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground text-xs">Đang tải đơn hàng...</div>
          ) : orders.length === 0 ? (
            <div className="bg-card p-12 rounded-3xl border border-dashed border-border text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <h3 className="font-serif font-bold text-base text-foreground">Bạn chưa có đơn hàng nào</h3>
              <p className="text-xs text-muted-foreground">Khám phá các sản phẩm mỹ phẩm thuần chay hữu cơ tại cửa hàng.</p>
              <Link to="/shop">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs mt-2">
                  Khám Phá Cửa Hàng
                </Button>
              </Link>
            </div>
          ) : (
            orders.map((o) => {
              const status = o.status || 'pending'
              return (
                <Card key={o.id} className="rounded-2xl border-border/80 overflow-hidden bg-card">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-foreground">Mã đơn: #{o.id.toString().substring(0, 8)}</span>
                        {status === 'shipped' ? (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <Truck className="w-3 h-3 mr-1" />
                            Đang giao hàng
                          </Badge>
                        ) : status === 'completed' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Đã giao thành công
                          </Badge>
                        ) : status === 'cancelled' ? (
                          <Badge className="bg-rose-100 text-rose-800 text-xs">
                            <XCircle className="w-3 h-3 mr-1" />
                            Đã hủy
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Đang chuẩn bị hàng
                          </Badge>
                        )}
                      </div>

                      <span className="text-accent font-bold text-base">
                        {(Number(o.total_amount) || 0).toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border/40">
                      <p>Địa chỉ giao: <strong className="text-foreground">{o.customer_address}</strong></p>
                      <p>Ngày đặt: {new Date(o.created_at || Date.now()).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

    </div>
  )
}
