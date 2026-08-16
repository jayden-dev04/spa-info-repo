import { useState, useMemo } from 'react'
import { 
  Search, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  User, 
  MessageSquare,
  Sparkles
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AppointmentsTabProps {
  appointments: any[]
  loading: boolean
  onUpdateStatus: (id: string, status: string) => void
}

export default function AppointmentsTab({
  appointments,
  loading,
  onUpdateStatus,
}: AppointmentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesSearch = 
        (apt.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (apt.customer_phone || '').includes(searchQuery) ||
        (apt.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase())

      const status = apt.status || 'pending'
      const matchesStatus = statusFilter === 'all' || status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [appointments, searchQuery, statusFilter])

  const counts = useMemo(() => {
    return {
      all: appointments.length,
      pending: appointments.filter(a => (a.status || 'pending') === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
    }
  }, [appointments])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20 gap-1 font-semibold text-xs py-1 px-2.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span>Đã xác nhận</span>
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1 font-semibold text-xs py-1 px-2.5">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Đã hoàn tất</span>
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 gap-1 font-semibold text-xs py-1 px-2.5">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Đã hủy</span>
          </Badge>
        )
      default:
        return (
          <Badge className="bg-accent/15 text-accent border-accent/30 gap-1 font-semibold text-xs py-1 px-2.5">
            <Clock3 className="w-3 h-3 text-accent" />
            <span>Chờ duyệt</span>
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls */}
      <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên khách, số điện thoại, email..."
              className="pl-10 rounded-xl bg-background border-border"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-secondary/60 p-1.5 rounded-xl border border-border/60">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-card text-primary shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tất cả ({counts.all})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'pending'
                  ? 'bg-accent text-accent-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Chờ duyệt ({counts.pending})
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'confirmed'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Đã duyệt ({counts.confirmed})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'completed'
                  ? 'bg-card text-emerald-800 shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Hoàn tất ({counts.completed})
            </button>
          </div>
        </div>
      </div>

      {/* Appointment Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-card p-12 rounded-2xl border border-border text-center text-muted-foreground text-sm">
            <Clock3 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
            <span>Đang tải danh sách lịch hẹn...</span>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-card p-12 rounded-2xl border border-dashed border-border text-center text-muted-foreground space-y-2">
            <Calendar className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="font-semibold text-foreground">Không tìm thấy lịch hẹn nào</p>
            <p className="text-xs">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const status = apt.status || 'pending'
            const formattedDate = apt.appointment_date 
              ? new Date(apt.appointment_date).toLocaleString('vi-VN', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Chưa xác định'

            return (
              <Card 
                key={apt.id} 
                className="rounded-2xl border-border/80 hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden"
              >
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* Left Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-serif font-bold text-base text-foreground">
                          {apt.customer_name}
                        </span>
                      </div>
                      {getStatusBadge(status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-accent" />
                        <span>SĐT: <a href={`tel:${apt.customer_phone}`} className="font-semibold text-foreground hover:text-primary">{apt.customer_phone}</a></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>Lịch: <strong className="text-foreground">{formattedDate}</strong></span>
                      </div>
                      {apt.customer_email && (
                        <div className="truncate">
                          <span>Email: {apt.customer_email}</span>
                        </div>
                      )}
                    </div>

                    {apt.notes && (
                      <div className="flex items-start gap-1.5 text-xs bg-secondary/40 p-2.5 rounded-xl text-foreground/80 mt-2">
                        <MessageSquare className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                        <span className="italic">Ghi chú của khách: &ldquo;{apt.notes}&rdquo;</span>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                    <a 
                      href={`tel:${apt.customer_phone}`}
                      className="inline-flex items-center gap-1 bg-secondary text-primary hover:bg-primary hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Gọi ngay</span>
                    </a>

                    {status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => onUpdateStatus(apt.id, 'confirmed')}
                        className="bg-primary hover:bg-primary/90 text-white text-xs rounded-xl h-9 px-4 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Duyệt lịch
                      </Button>
                    )}

                    {status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => onUpdateStatus(apt.id, 'completed')}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs rounded-xl h-9 px-4"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        Hoàn tất phục vụ
                      </Button>
                    )}

                    {status !== 'cancelled' && status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                        className="text-xs text-destructive hover:bg-destructive/10 rounded-xl h-9 px-3"
                      >
                        Hủy lịch
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
