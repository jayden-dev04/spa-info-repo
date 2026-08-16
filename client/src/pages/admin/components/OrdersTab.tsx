import { useState } from 'react'
import { ShoppingBag, Search, CheckCircle2, Clock, Truck, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface OrdersTabProps {
  orders: any[]
  loading: boolean
  onUpdateOrderStatus: (id: string, status: string) => void
}

export default function OrdersTab({ orders, loading, onUpdateOrderStatus }: OrdersTabProps) {
  const [search, setSearch] = useState('')

  const filteredOrders = orders.filter((o) => 
    (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.customer_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.id || '').toString().includes(search)
  )

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs py-1 px-2.5 font-semibold">
            Đã giao hàng
          </Badge>
        )
      case 'shipped':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs py-1 px-2.5 font-semibold">
            Đang giao
          </Badge>
        )
      default:
        return (
          <Badge className="bg-accent/15 text-accent border-accent/30 text-xs py-1 px-2.5 font-semibold">
            Chờ xử lý
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-2xs flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên khách hàng, email hoặc mã đơn..."
            className="pl-10 rounded-xl bg-background border-border"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-card p-12 rounded-2xl border border-border text-center text-muted-foreground text-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
            <span>Đang tải danh sách đơn hàng...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-card p-12 rounded-2xl border border-dashed border-border text-center text-muted-foreground space-y-2">
            <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="font-semibold text-foreground">Chưa có đơn hàng nào</p>
            <p className="text-xs">Đơn hàng mới khi khách mua sắm tại trang Shop sẽ xuất hiện ở đây.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const status = order.status || 'pending'
            const formattedDate = order.created_at
              ? new Date(order.created_at).toLocaleString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Gần đây'

            return (
              <Card key={order.id} className="rounded-2xl border-border/80 hover:shadow-sm transition-all overflow-hidden">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-serif font-bold text-base text-foreground">
                          {order.customer_name}
                        </span>
                      </div>
                      {getOrderStatusBadge(status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      <span>Email: <strong className="text-foreground">{order.customer_email}</strong></span>
                      <span>•</span>
                      <span>Ngày đặt: {formattedDate}</span>
                      <span>•</span>
                      <span>Tổng tiền: <strong className="text-accent text-sm font-bold">{(order.total_amount || 0).toLocaleString('vi-VN')}đ</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                    {status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => onUpdateOrderStatus(order.id, 'shipped')}
                        className="bg-primary hover:bg-primary/90 text-white text-xs rounded-xl h-9 px-4"
                      >
                        <Truck className="w-3.5 h-3.5 mr-1" />
                        Giao hàng
                      </Button>
                    )}

                    {status === 'shipped' && (
                      <Button
                        size="sm"
                        onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs rounded-xl h-9 px-4"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Đã giao xong
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
