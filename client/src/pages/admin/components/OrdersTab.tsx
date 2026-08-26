import { useState, useMemo } from 'react'
import { ShoppingBag, Search, CheckCircle2, Clock, Truck, User, Phone, MapPin, Eye, XCircle, Package } from 'lucide-react'
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
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.customer_email || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.customer_phone || '').includes(search) ||
        (o.id || '').toString().includes(search)

      const status = o.status || 'pending'
      const matchStatus = statusFilter === 'all' || status === statusFilter

      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => (o.status || 'pending') === 'pending').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      completed: orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }
  }, [orders])

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs py-1 px-2.5 font-semibold">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Đã giao hàng
          </Badge>
        )
      case 'shipped':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs py-1 px-2.5 font-semibold">
            <Truck className="w-3 h-3 mr-1" />
            Đang giao hàng
          </Badge>
        )
      case 'processing':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs py-1 px-2.5 font-semibold">
            <Package className="w-3 h-3 mr-1" />
            Đang chuẩn bị
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-xs py-1 px-2.5 font-semibold">
            <XCircle className="w-3 h-3 mr-1" />
            Đã hủy
          </Badge>
        )
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs py-1 px-2.5 font-semibold">
            <Clock className="w-3 h-3 mr-1" />
            Chờ xử lý
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Search & Status Filters */}
      <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên khách, SĐT, email hoặc mã đơn..."
              className="pl-10 rounded-xl bg-background border-border text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-primary text-white font-semibold'
                : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            Tất cả ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            Chờ xử lý ({counts.pending})
          </button>
          <button
            onClick={() => setStatusFilter('shipped')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
              statusFilter === 'shipped'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            Đang giao ({counts.shipped})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-emerald-700 text-white font-semibold'
                : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            Hoàn tất ({counts.completed})
          </button>
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
            <p className="font-semibold text-foreground">Không tìm thấy đơn hàng nào</p>
            <p className="text-xs">Đơn hàng mới từ khách mua sắm sẽ xuất hiện tại đây.</p>
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
                  minute: '2-digit',
                })
              : 'Gần đây'

            return (
              <Card key={order.id} className="rounded-2xl border-border/80 hover:shadow-sm transition-all overflow-hidden bg-card">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                      <span className="text-[11px] text-muted-foreground font-mono">
                        #{order.id ? order.id.toString().substring(0, 8) : ''}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {order.customer_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-accent" />
                          <strong className="text-foreground">{order.customer_phone}</strong>
                        </span>
                      )}
                      <span>•</span>
                      <span>Email: <strong className="text-foreground">{order.customer_email}</strong></span>
                      <span>•</span>
                      <span>Ngày đặt: {formattedDate}</span>
                      <span>•</span>
                      <span>Tổng tiền: <strong className="text-accent text-sm font-bold">{(Number(order.total_amount) || 0).toLocaleString('vi-VN')}đ</strong></span>
                    </div>

                    {order.customer_address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                        <span className="line-clamp-1">{order.customer_address}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-xl text-xs h-9 px-3 border-border hover:bg-secondary"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Chi tiết
                    </Button>

                    {status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => onUpdateOrderStatus(order.id, 'shipped')}
                        className="bg-primary hover:bg-primary/90 text-white text-xs rounded-xl h-9 px-4 shadow-xs"
                      >
                        <Truck className="w-3.5 h-3.5 mr-1" />
                        Giao hàng
                      </Button>
                    )}

                    {status === 'shipped' && (
                      <Button
                        size="sm"
                        onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs rounded-xl h-9 px-4 shadow-xs"
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-primary">Chi Tiết Đơn Hàng</h3>
                <p className="text-xs text-muted-foreground">Mã đơn: #{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Customer summary */}
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-1.5">
                <p><strong>Khách hàng:</strong> {selectedOrder.customer_name}</p>
                <p><strong>Số điện thoại:</strong> {selectedOrder.customer_phone || 'Chưa cập nhật'}</p>
                <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                <p><strong>Địa chỉ nhận hàng:</strong> {selectedOrder.customer_address || 'Nhận tại spa'}</p>
                <p><strong>Trạng thái:</strong> {getOrderStatusBadge(selectedOrder.status || 'pending')}</p>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Sản phẩm trong đơn:</h4>
                <div className="p-3 rounded-2xl bg-background border border-border/60 divide-y divide-border/40 max-h-48 overflow-y-auto">
                  {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                    selectedOrder.order_items.map((oi: any, i: number) => (
                      <div key={i} className="py-2 first:pt-0 last:pb-0 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-foreground">{oi.products?.name || oi.product_name || 'Sản phẩm thảo mộc'}</p>
                          <p className="text-muted-foreground text-[11px]">SL: {oi.quantity} x {Number(oi.price).toLocaleString('vi-VN')}đ</p>
                        </div>
                        <span className="font-bold text-accent">{(Number(oi.price) * Number(oi.quantity)).toLocaleString('vi-VN')}đ</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 text-muted-foreground">
                      <span>Đơn hàng đặt gói sản phẩm (Tổng tiền: {Number(selectedOrder.total_amount).toLocaleString('vi-VN')}đ)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total calculation */}
              <div className="flex justify-between items-center pt-2 border-t border-border/60 text-sm font-bold">
                <span>Tổng giá trị đơn hàng:</span>
                <span className="text-accent text-base">{Number(selectedOrder.total_amount).toLocaleString('vi-VN')}đ</span>
              </div>

              {/* Status change actions */}
              <div className="pt-3 border-t border-border/60 flex flex-wrap gap-2 justify-end">
                {selectedOrder.status !== 'shipped' && selectedOrder.status !== 'completed' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onUpdateOrderStatus(selectedOrder.id, 'shipped')
                      setSelectedOrder(null)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs"
                  >
                    <Truck className="w-3.5 h-3.5 mr-1" />
                    Chuyển sang Đang giao
                  </Button>
                )}
                {selectedOrder.status !== 'completed' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onUpdateOrderStatus(selectedOrder.id, 'completed')
                      setSelectedOrder(null)
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Xác nhận Đã giao
                  </Button>
                )}
                {selectedOrder.status !== 'cancelled' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
                        onUpdateOrderStatus(selectedOrder.id, 'cancelled')
                        setSelectedOrder(null)
                      }
                    }}
                    className="border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Hủy đơn
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
