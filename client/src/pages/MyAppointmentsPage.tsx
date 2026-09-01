import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MOCK_APPOINTMENTS, mapAppointmentRow, type AppointmentView } from '@/lib/orderSeed'

/** 'YYYY-MM-DD' → 'dd/MM/yyyy' */
function formatDate(date: string): string {
  if (!date) return '—'
  const [y, m, d] = date.split('T')[0].split('-')
  if (!y || !m || !d) return date
  return `${d}/${m}/${y}`
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(price || 0) + ' đ'
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Chờ xác nhận',
    className: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  confirmed: {
    label: 'Đã xác nhận',
    className: 'bg-sky-100 text-sky-800 border-sky-300',
  },
  completed: {
    label: 'Hoàn thành',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-rose-100 text-rose-800 border-rose-300',
  },
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE.pending
  return (
    <Badge
      className={`${style.className} font-semibold uppercase text-[11px] border`}
    >
      {style.label}
    </Badge>
  )
}

export default function MyAppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentView[]>([])
  const [loading, setLoading] = useState(true)
  const [minTimePassed, setMinTimePassed] = useState(false)
  const loadedFor = useRef<string | null>(null)

  // ?dev=1 (chỉ dev build): preview mock khi chưa đăng nhập / DB chưa migration
  const [sp] = useSearchParams()
  const dev = import.meta.env.DEV && sp.get('dev') === '1'
  const emailKey = user?.email || (dev ? 'mock@eva.spa' : '')

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!emailKey) return
    if (loadedFor.current === emailKey) return

    async function loadAppointments() {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .ilike('customer_email', emailKey)
          .order('appointment_date', { ascending: false })

        if (error) throw error

        const rows = (data || []).map(mapAppointmentRow).filter((a) => !!a.id)
        if (rows.length === 0) {
          // DB loi / chua du lieu cho email nay → dung mau
          console.warn('db loi')
          setAppointments(MOCK_APPOINTMENTS)
        } else {
          setAppointments(rows)
        }
        loadedFor.current = emailKey
      } catch (err) {
        console.warn('db loi')
        setAppointments(MOCK_APPOINTMENTS)
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    loadAppointments()
  }, [emailKey])

  if (!user && !dev) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-secondary text-primary flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-primary mb-2">Đăng Nhập Tài Khoản</h2>
        <p className="text-muted-foreground text-xs mb-6">
          Vui lòng đăng nhập để xem lại lịch hẹn trị liệu của bạn.
        </p>
        <Link to="/account">
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 text-xs">
            Đăng Nhập Ngay
          </Button>
        </Link>
      </div>
    )
  }

  const showLoading = loading || !minTimePassed

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl font-sans text-left">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/account">
          <Button variant="ghost" size="sm" className="rounded-xl text-xs text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Tài khoản của tôi
          </Button>
        </Link>
      </div>

      <h1 className="font-serif text-3xl font-bold text-primary mb-2">Lịch Hẹn Của Tôi</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Theo dõi và quản lý các lịch hẹn dưỡng sinh của bạn tại EVA Spa.
      </p>

      {showLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-xs text-muted-foreground">Đang tải lịch hẹn...</span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-card p-12 rounded-3xl border border-dashed border-border text-center space-y-3">
          <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-serif font-bold text-base text-foreground">Bạn chưa có lịch hẹn nào</h3>
          <p className="text-xs text-muted-foreground">
            Đặt lịch dưỡng sinh để tận hưởng không gian thiền an yên.
          </p>
          <Link to="/booking">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl text-xs mt-2">
              Đặt Lịch Trải Nghiệm Ngay
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop: bảng */}
          <div className="hidden sm:block bg-card rounded-3xl border border-border/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-muted-foreground pl-6">Mã hẹn</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Ngày</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Giờ</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Dịch vụ</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Kỹ thuật viên</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Trạng thái</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right pr-6">Giá</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="pl-6 font-mono text-xs text-foreground">{apt.code}</TableCell>
                      <TableCell className="text-sm">{formatDate(apt.date)}</TableCell>
                      <TableCell className="text-sm tabular-nums whitespace-nowrap">
                        {apt.start}–{apt.end}
                      </TableCell>
                      <TableCell className="text-sm">{apt.service}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{apt.staff}</TableCell>
                      <TableCell>
                        <StatusBadge status={apt.status} />
                      </TableCell>
                      <TableCell className="text-right pr-6 text-sm font-semibold whitespace-nowrap">
                        {formatPrice(apt.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile: stack thẻ */}
          <div className="grid sm:hidden gap-4">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-card rounded-2xl border border-border/80 shadow-sm p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-mono text-xs text-muted-foreground">{apt.code}</span>
                    <div className="font-serif font-bold text-base text-foreground">
                      {formatDate(apt.date)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="tabular-nums">
                        {apt.start}–{apt.end}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Dịch vụ:</span>{' '}
                  <span className="font-medium text-foreground">{apt.service}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Kỹ thuật viên: <span className="text-foreground">{apt.staff}</span>
                </div>
                <div className="pt-1 flex items-center justify-between border-t border-border/60">
                  <span className="text-xs text-muted-foreground">Tổng phí</span>
                  <span className="text-sm font-semibold text-foreground">{formatPrice(apt.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
