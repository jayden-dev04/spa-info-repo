import { Users, Bed, CheckCircle2, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function StaffTab() {
  const staff = [
    { id: 1, name: 'Nguyễn Thị Mai', role: 'Chuyên viên Massage & Bấm huyệt', status: 'ready', exp: '4 năm' },
    { id: 2, name: 'Trần Thu Hà', role: 'Kỹ thuật viên Dưỡng sinh đầu', status: 'busy', exp: '3 năm' },
    { id: 3, name: 'Lê Thùy Dung', role: 'Chuyên viên Chăm sóc & Trẻ hóa da', status: 'ready', exp: '5 năm' },
    { id: 4, name: 'Phạm Ngọc Ánh', role: 'Kỹ thuật viên Trị liệu toàn thân', status: 'busy', exp: '2 năm' },
  ]

  const rooms = [
    { id: 1, name: 'Phòng Thiền Tịnh 01', type: 'Phòng VIP Dưỡng Sinh Đầu', status: 'occupied', currentClient: 'Chị Mai Lan' },
    { id: 2, name: 'Phòng Thảo Dược 02', type: 'Phòng Massage Đá Nóng', status: 'available', currentClient: null },
    { id: 3, name: 'Phòng Hoàng Cung 03', type: 'Phòng Xông Hơi Thải Độc', status: 'available', currentClient: null },
    { id: 4, name: 'Phòng Trẻ Hóa 04', type: 'Phòng Chăm Sóc Da Chuyên Sâu', status: 'occupied', currentClient: 'Chị Thu Thủy' },
  ]

  return (
    <div className="space-y-8">
      {/* Staff Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <span>Đội Ngũ Kỹ Thuật Viên Trong Ca Hôm Nay</span>
            </h2>
            <p className="text-xs text-muted-foreground">Theo dõi tình trạng kỹ thuật viên để phân bổ khách đặt hẹn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {staff.map((s) => (
            <Card key={s.id} className="rounded-2xl border-border/80 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-secondary text-primary font-serif font-bold flex items-center justify-center text-sm">
                  {s.name.split(' ').pop()?.charAt(0)}
                </div>
                {s.status === 'ready' ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] py-0.5">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Sẵn sàng
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] py-0.5">
                    <Clock className="w-3 h-3 mr-1" />
                    Đang làm liệu trình
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="font-serif font-bold text-sm text-foreground">{s.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{s.role}</p>
                <p className="text-[11px] text-accent font-semibold mt-1">Kinh nghiệm: {s.exp}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Rooms Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div>
          <h2 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
            <Bed className="w-5 h-5 text-accent" />
            <span>Tình Trạng Phòng Dịch Vụ & Trị Liệu</span>
          </h2>
          <p className="text-xs text-muted-foreground">Công suất phòng hoạt động tại chi nhánh Cần Thơ</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rooms.map((r) => (
            <Card key={r.id} className="rounded-2xl border-border/80 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <span className="font-serif font-bold text-sm text-foreground">{r.name}</span>
                {r.status === 'available' ? (
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                    Phòng trống
                  </Badge>
                ) : (
                  <Badge className="bg-primary/10 text-primary text-[10px]">
                    Đang phục vụ
                  </Badge>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>{r.type}</p>
                {r.currentClient && (
                  <p className="text-primary font-semibold">Khách đang làm: {r.currentClient}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
