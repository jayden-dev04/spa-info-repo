import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { ShoppingBag, User, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MOCK_ORDERS, mapOrderRow, type OrderSummary } from '@/lib/orderSeed'

const STATUS_BASE =
  'inline-block rounded-full border px-3 py-0.5 text-[11px] font-semibold uppercase'

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
  confirmed: 'text-blue-700 bg-blue-50 border-blue-200',
  shipped: 'text-purple-700 bg-purple-50 border-purple-200',
  completed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  cancelled: 'text-red-700 bg-red-50 border-red-200',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.pending
  return <span className={`${STATUS_BASE} ${cls}`}>{status || 'pending'}</span>
}

function formatDate(iso: string): string {
  const d = new Date(iso || Date.now())
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('vi-VN')
}

export default function MyOrdersPage() {
  const { user, setIsAuthModalOpen } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const loadedFor = useRef<string | null>(null)

  // ?dev=1 (chỉ dev build): preview mock khi chưa đăng nhập / DB chưa migration
  const [sp] = useSearchParams()
  const dev = import.meta.env.DEV && sp.get('dev') === '1'
  const email = user?.email || (dev ? 'mock@eva.spa' : '')

  useEffect(() => {
    if (!email) return
    if (loadedFor.current === email) return

    async function loadOrders() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .ilike('customer_email', email)
          .order('created_at', { ascending: false })

        if (error) throw error
        const rows = (data || []).map(mapOrderRow)
        if (rows.length > 0) {
          setOrders(rows)
          loadedFor.current = email
          return
        }
        useMockFallback()
      } catch (err) {
        console.warn('db loi', err)
        useMockFallback()
      } finally {
        setLoading(false)
      }
    }

    function useMockFallback() {
      const scoped = MOCK_ORDERS.filter(
        (o) => email && o.email?.toLowerCase() === email.toLowerCase()
      )
      setOrders(scoped.length > 0 ? scoped : MOCK_ORDERS)
    }

    setLoading(true)
    loadOrders()
  }, [email])

  if (!user && !dev) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-secondary text-primary flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-primary mb-2">Đăng Nhập Tài Khoản</h2>
        <p className="text-muted-foreground text-xs mb-6">
          Vui lòng đăng nhập để xem lại các đơn hàng mỹ phẩm của bạn.
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

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl font-sans text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-1">Đơn Hàng Của Tôi</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi trạng thái giao hàng và chi tiết từng đơn mỹ phẩm của bạn.
          </p>
        </div>
        <Link to="/account">
          <Button variant="outline" className="rounded-xl text-xs">
            Tài khoản của tôi
          </Button>
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <Loader2 className="w-7 h-7 animate-spin text-primary/70" />
          <p className="text-xs">Đang tải đơn hàng...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-card p-12 rounded-3xl border border-dashed border-border text-center space-y-3">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-serif font-bold text-base text-foreground">Chưa có đơn hàng</h3>
          <p className="text-xs text-muted-foreground">
            Khám phá các sản phẩm mỹ phẩm thuần chay hữu cơ tại cửa hàng.
          </p>
          <Link to="/shop">
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs mt-2">
              Khám Phá Cửa Hàng
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm border border-border rounded-xl overflow-hidden">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Mã đơn</th>
                <th className="px-4 py-3 font-semibold">Ngày</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold">Số món</th>
                <th className="px-4 py-3 font-semibold text-right">Tổng tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr
                  key={o.id || o.code}
                  onClick={() => navigate(`/orders/${o.code}`)}
                  className="bg-card hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/orders/${o.code}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono text-primary hover:underline"
                    >
                      {o.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(o.date)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.itemCount}</td>
                  <td className="px-4 py-3 text-right font-semibold text-accent">
                    {o.total.toLocaleString('vi-VN')}đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
