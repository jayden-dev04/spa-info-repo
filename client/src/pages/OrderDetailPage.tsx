import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { MOCK_ORDERS, mapOrderRow, ORDER_ITEM_IMAGES, type OrderSummary } from '@/lib/orderSeed'
import { ArrowLeft, Clock, CheckCircle2, Truck, PackageCheck, XCircle, ShoppingBag, User } from 'lucide-react'

// Anh ngoai canh loi -> ve anh mock dau tien ( cung la fallback toan cuc ).
const FALLBACK_IMG = ORDER_ITEM_IMAGES[0]

const STATUS_META: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
  pending: { label: 'Cho xac nhan', cls: 'bg-amber-500/10 border-amber-500/30 text-amber-700', Icon: Clock },
  confirmed: { label: 'Da xac nhan', cls: 'bg-sky-500/10 border-sky-500/30 text-sky-700', Icon: CheckCircle2 },
  shipped: { label: 'Dang giao', cls: 'bg-violet-500/10 border-violet-500/30 text-violet-700', Icon: Truck },
  completed: { label: 'Hoan thanh', cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700', Icon: PackageCheck },
  cancelled: { label: 'Da huy', cls: 'bg-rose-500/10 border-rose-500/30 text-rose-700', Icon: XCircle },
}

const statusMeta = (status: string) => STATUS_META[status] ?? STATUS_META.pending

function StatusBadge({ status }: { status: string }) {
  const { label, cls, Icon } = statusMeta(status)
  return (
    <Badge variant="outline" className={`font-semibold uppercase text-[11px] ${cls}`}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  )
}

type OrderDetail = {
  order: OrderSummary
  // Cột shipping_fee đang được thêm dần vào DB; thiếu → null (hiện 'Van chuyen: Mien phi').
  shippingFee: number | null
}

// Hang doi Supabase la jsonb khong chac chan shape; only đọc shipping_fee ở đây,
// phần còn lại do mapOrderRow (optional chaining) xử lý.
function readShippingFee(row: Record<string, unknown>): number | null {
  const v = row.shipping_fee
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') return Number(v) || 0
  return null
}

export default function OrderDetailPage() {
  const { code } = useParams<{ code: string }>()
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const mock = MOCK_ORDERS.find((o) => o.code === code)
      const fallback: OrderDetail | null = mock ? { order: mock, shippingFee: null } : null
      try {
        let row: Record<string, unknown> | null = null
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name, image_url))')
            .eq('order_code', code)
            .maybeSingle()
          if (error) throw error
          row = (data as Record<string, unknown> | null) ?? null
        } catch {
          // FK products chưa có → về select('*'); order_items dẫn xuất cũ vẫn hiển thị được.
          const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('order_code', code)
            .maybeSingle()
          row = (data as Record<string, unknown> | null) ?? null
        }
        if (cancelled) return
        setDetail(row ? { order: mapOrderRow(row), shippingFee: readShippingFee(row) } : fallback)
      } catch (err) {
        console.warn('db loi', err)
        if (!cancelled) setDetail(fallback)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setLoading(true)
    load()
    return () => {
      cancelled = true
    }
  }, [code])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-5xl text-center font-sans">
        <div className="inline-block w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground mt-3">Đang tải chi tiết đơn hàng...</p>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center space-y-4 font-sans">
        <ShoppingBag className="w-10 h-10 text-muted-foreground/40 mx-auto" />
        <h2 className="font-serif font-bold text-lg text-foreground">Không tìm thấy đơn hàng</h2>
        <p className="text-xs text-muted-foreground">
          Mã đơn <strong className="text-foreground">{code}</strong> không tồn tại.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link to="/account/orders">
            <Button variant="outline" size="sm" className="rounded-xl text-xs border-border">
              Đơn hàng của tôi
            </Button>
          </Link>
          <Link to="/shop">
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs">Mua sắm tiếp</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { order, shippingFee } = detail
  const subtotal = order.items.reduce((s, it) => s + it.total, 0)
  const displaySubtotal = subtotal > 0 ? subtotal : order.total
  const orderDate = order.date ? new Date(order.date).toLocaleDateString('vi-VN') : '—'

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl font-sans text-left">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <div>
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Đơn hàng của tôi
          </Link>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-foreground">
            Chi tiết đơn hàng <span className="text-accent">#{order.code}</span>
          </h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Cột trái (span 2): bảng chi tiết đơn */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-3xl border border-border/80 shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-border/60">
              <h2 className="font-serif font-bold text-base text-foreground">Sản phẩm</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {order.items.length} sản phẩm • Đặt ngày {orderDate}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/40">
                    <th className="px-6 py-3 font-semibold">Sản phẩm</th>
                    <th className="px-3 py-3 font-semibold text-right">SL</th>
                    <th className="px-3 py-3 font-semibold text-right">Đơn giá</th>
                    <th className="px-6 py-3 font-semibold text-right">Tạm tính</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={`${it.product_id}-${it.name}`} className="border-b border-border/30 last:border-0 align-middle">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={it.image_url}
                            alt={it.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border/60"
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_IMG
                            }}
                          />
                          <span className="font-medium text-foreground">{it.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-right text-muted-foreground">{it.quantity}</td>
                      <td className="px-3 py-4 text-right text-muted-foreground">{it.price.toLocaleString('vi-VN')}đ</td>
                      <td className="px-6 py-4 text-right font-semibold text-foreground">{it.total.toLocaleString('vi-VN')}đ</td>
                    </tr>
                  ))}
                  {order.items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-xs text-muted-foreground">
                        Đơn hàng không có chi tiết sản phẩm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Người nhận */}
          <div className="bg-card rounded-3xl border border-border/80 shadow-sm p-6 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm mb-1">
              <User className="w-4 h-4 text-accent" />
              Khach hang
            </div>
            {order.address && <p>Giao tới: <span className="text-foreground">{order.address}</span></p>}
            <p className="flex flex-wrap gap-x-4">
              {order.phone && <span>SĐT: <span className="text-foreground">{order.phone}</span></span>}
              {order.email && <span>Email: <span className="text-foreground">{order.email}</span></span>}
            </p>
          </div>
        </div>

        {/* Cột phải: Vận Chuyển + Thanh Toán */}
        <div className="space-y-6">
          <div className="bg-card rounded-3xl border border-border/80 shadow-sm p-6 space-y-3">
            <h2 className="font-serif font-bold text-base text-foreground">Vận Chuyển</h2>
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Mã đơn</dt>
                <dd className="font-semibold text-foreground text-right">#{order.code}</dd>
              </div>
              <div className="flex justify-between items-center gap-3">
                <dt className="text-muted-foreground">Trạng thái</dt>
                <dd><StatusBadge status={order.status} /></dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Ngày đặt</dt>
                <dd className="text-foreground text-right">{orderDate}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Phương thức</dt>
                <dd className="text-foreground text-right">{order.payment || 'Thanh toán khi nhận hàng'}</dd>
              </div>
              {order.note && (
                <div className="pt-2 border-t border-border/40">
                  <dt className="text-muted-foreground mb-1">Ghi chú</dt>
                  <dd className="text-foreground italic">"{order.note}"</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-card rounded-3xl border border-border/80 shadow-sm p-6 space-y-3">
            <h2 className="font-serif font-bold text-base text-foreground">Thanh Toán</h2>
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Tạm tính</dt>
                <dd className="text-foreground">{displaySubtotal.toLocaleString('vi-VN')}đ</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Vận chuyển</dt>
                {shippingFee === null ? (
                  <dd className="text-foreground">
                    Van chuyen: <span className="text-emerald-700 font-medium">Mien phi</span>
                  </dd>
                ) : shippingFee === 0 ? (
                  <dd className="text-emerald-700 font-medium">Miễn phí vận chuyển</dd>
                ) : (
                  <dd className="text-foreground">{shippingFee.toLocaleString('vi-VN')}đ</dd>
                )}
              </div>
              <div className="flex justify-between items-center gap-3 pt-3 border-t border-border/40">
                <dt className="font-semibold text-foreground">Tổng cộng</dt>
                <dd className="font-bold text-base text-accent">{order.total.toLocaleString('vi-VN')}đ</dd>
              </div>
            </dl>
            <div className="pt-2 space-y-2">
              <Link to="/shop" className="block">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl text-xs">
                  Mua sắm tiếp
                </Button>
              </Link>
              <Link to="/account" className="block">
                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs border-border">
                  Tài khoản của tôi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
