import { useState } from 'react'
import { Users, Bed, CheckCircle2, Clock, Plus, UserCheck, UserX } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function StaffTab() {
  const [staff, setStaff] = useState([
    { id: 1, name: 'Nguyễn Thị Mai', role: 'Chuyên viên Massage & Bấm huyệt', status: 'ready', exp: '4 năm' },
    { id: 2, name: 'Trần Thu Hà', role: 'Kỹ thuật viên Dưỡng sinh đầu', status: 'busy', exp: '3 năm' },
    { id: 3, name: 'Lê Thùy Dung', role: 'Chuyên viên Chăm sóc & Trẻ hóa da', status: 'ready', exp: '5 năm' },
    { id: 4, name: 'Phạm Ngọc Ánh', role: 'Kỹ thuật viên Trị liệu toàn thân', status: 'busy', exp: '2 năm' },
  ])

  const [rooms, setRooms] = useState([
    { id: 1, name: 'Phòng Thiền Tịnh 01', type: 'Phòng VIP Dưỡng Sinh Đầu', status: 'occupied', currentClient: 'Chị Mai Lan' },
    { id: 2, name: 'Phòng Thảo Dược 02', type: 'Phòng Massage Đá Nóng', status: 'available', currentClient: null },
    { id: 3, name: 'Phòng Hoàng Cung 03', type: 'Phòng Xông Hơi Thải Độc', status: 'available', currentClient: null },
    { id: 4, name: 'Phòng Trẻ Hóa 04', type: 'Phòng Chăm Sóc Da Chuyên Sâu', status: 'occupied', currentClient: 'Chị Thu Thủy' },
  ])

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Kỹ thuật viên Dưỡng sinh',
    exp: '2 năm',
  })

  const toggleStaffStatus = (id: number) => {
    setStaff(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'ready' ? 'busy' : 'ready'
        toast.success(`Đã cập nhật trạng thái ${s.name} thành "${nextStatus === 'ready' ? 'Sẵn sàng' : 'Đang làm liệu trình'}"`)
        return { ...s, status: nextStatus }
      }
      return s
    }))
  }

  const toggleRoomStatus = (id: number) => {
    setRooms(prev => prev.map(r => {
      if (r.id === id) {
        const nextStatus = r.status === 'available' ? 'occupied' : 'available'
        toast.success(`Đã cập nhật ${r.name} thành "${nextStatus === 'available' ? 'Phòng trống' : 'Đang phục vụ'}"`)
        return { 
          ...r, 
          status: nextStatus,
          currentClient: nextStatus === 'occupied' ? 'Khách hẹn trực tiếp' : null 
        }
      }
      return r
    }))
  }

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStaff.name) {
      toast.error('Vui lòng nhập họ tên nhân viên')
      return
    }

    const created = {
      id: Date.now(),
      name: newStaff.name,
      role: newStaff.role,
      exp: newStaff.exp,
      status: 'ready',
    }

    setStaff(prev => [...prev, created])
    setIsStaffModalOpen(false)
    setNewStaff({ name: '', role: 'Kỹ thuật viên Dưỡng sinh', exp: '2 năm' })
    toast.success(`Đã thêm kỹ thuật viên "${created.name}" vào ca trực!`)
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* Staff Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-2xl border border-border/80 shadow-2xs">
          <div>
            <h2 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <span>Đội Ngũ Kỹ Thuật Viên Trong Ca Trực</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Theo dõi và phân bổ kỹ thuật viên tiếp nhận khách đặt lịch dưỡng sinh
            </p>
          </div>

          <Button
            onClick={() => setIsStaffModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Kỹ Thuật Viên</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {staff.map((s) => (
            <Card key={s.id} className="rounded-2xl border-border/80 p-4 space-y-3 bg-card hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-secondary text-primary font-serif font-bold flex items-center justify-center text-sm">
                  {s.name.split(' ').pop()?.charAt(0)}
                </div>
                
                <button
                  onClick={() => toggleStaffStatus(s.id)}
                  className="cursor-pointer"
                  title="Bấm để đổi trạng thái"
                >
                  {s.status === 'ready' ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] py-0.5 hover:bg-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Sẵn sàng
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] py-0.5 hover:bg-amber-200">
                      <Clock className="w-3 h-3 mr-1" />
                      Đang làm khách
                    </Badge>
                  )}
                </button>
              </div>

              <div>
                <h3 className="font-serif font-bold text-sm text-foreground">{s.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{s.role}</p>
                <p className="text-[11px] text-accent font-semibold mt-1">Kinh nghiệm: {s.exp}</p>
              </div>

              <div className="pt-2 border-t border-border/60 flex justify-between items-center text-xs">
                <span className="text-[11px] text-muted-foreground">Đổi ca trực:</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleStaffStatus(s.id)}
                  className="h-7 px-2 text-[11px] text-primary hover:bg-secondary rounded-lg"
                >
                  {s.status === 'ready' ? (
                    <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> Gán khách</span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-700"><UserX className="w-3 h-3" /> Xong khách</span>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Rooms Section */}
      <div className="space-y-4 pt-4 border-t border-border/80">
        <div>
          <h2 className="text-lg font-serif font-bold text-primary flex items-center gap-2">
            <Bed className="w-5 h-5 text-accent" />
            <span>Tình Trạng Phòng Dịch Vụ & Trị Liệu</span>
          </h2>
          <p className="text-xs text-muted-foreground">Quản lý sức chứa phòng và công suất hoạt động tại spa</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rooms.map((r) => (
            <Card key={r.id} className="rounded-2xl border-border/80 p-4 space-y-3 bg-card hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <span className="font-serif font-bold text-sm text-foreground">{r.name}</span>
                <button
                  onClick={() => toggleRoomStatus(r.id)}
                  className="cursor-pointer"
                  title="Bấm để đổi trạng thái phòng"
                >
                  {r.status === 'available' ? (
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] hover:bg-emerald-200">
                      Phòng trống
                    </Badge>
                  ) : (
                    <Badge className="bg-primary/15 text-primary text-[10px] hover:bg-primary/25">
                      Đang phục vụ
                    </Badge>
                  )}
                </button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>{r.type}</p>
                {r.currentClient ? (
                  <p className="text-primary font-semibold text-[11px]">Khách: {r.currentClient}</p>
                ) : (
                  <p className="text-emerald-700 text-[11px]">Sẵn sàng đón khách mới</p>
                )}
              </div>

              <div className="pt-2 border-t border-border/60">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleRoomStatus(r.id)}
                  className="w-full text-xs h-7 rounded-lg border-border"
                >
                  {r.status === 'available' ? 'Đánh dấu có khách' : 'Trả phòng trống'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="font-serif font-bold text-lg text-primary">Thêm Kỹ Thuật Viên Mới</h3>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="staff-name" className="font-semibold text-foreground">Họ và tên *</Label>
                <Input
                  id="staff-name"
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Thị Lan"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="staff-role" className="font-semibold text-foreground">Vị trí / Chuyên môn</Label>
                <Input
                  id="staff-role"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  placeholder="Chuyên viên Bấm huyệt & Massage, Gội đầu dưỡng sinh..."
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="staff-exp" className="font-semibold text-foreground">Kinh nghiệm</Label>
                <Input
                  id="staff-exp"
                  value={newStaff.exp}
                  onChange={(e) => setNewStaff({ ...newStaff, exp: e.target.value })}
                  placeholder="3 năm, 5 năm..."
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold px-5 cursor-pointer"
                >
                  Thêm Kỹ Thuật Viên
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
