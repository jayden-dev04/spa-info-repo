import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Leaf, Calendar, Sparkles, CheckCircle2, PhoneCall, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { API_BASE } from '@/lib/api'
import { supabase } from '@/lib/supabase'

type ServiceOption = { id: number; name: string; price: number; duration_minutes: number | null }

// Giá fallback chỉ dùng khi Supabase services trả về rỗng — giá thật khớp
// với seed_services.sql (id 1→5), không phải giá bịa.
const FALLBACK_SERVICES: ServiceOption[] = [
  { id: 1, name: 'Gội Đầu Dưỡng Sinh Thảo Dược (60–75 phút)', price: 199000, duration_minutes: 70 },
  { id: 2, name: 'Chăm Sóc & Phục Hồi Da Thảo Mộc (75 phút)', price: 350000, duration_minutes: 75 },
  { id: 3, name: 'Massage Body Đá Nóng Himalaya (90 phút)', price: 420000, duration_minutes: 90 },
  { id: 4, name: 'Combo Thư Giãn Toàn Diện: Gội Đầu + Massage Body', price: 550000, duration_minutes: 135 },
  { id: 5, name: 'Xông Hơi Thảo Dược Hoàng Cung & Ngâm Chân', price: 150000, duration_minutes: 45 },
]

export default function Booking() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [services, setServices] = useState<ServiceOption[]>(FALLBACK_SERVICES)

  // Danh sách liệu trình lấy thẳng từ bảng services (nguồn dữ liệu thật,
  // dùng chung với trang Dịch Vụ + admin). Rỗng/lỗi -> giữ fallback.
  useEffect(() => {
    let cancelled = false
    supabase
      .from('services')
      .select('id, name, price, duration_minutes')
      .eq('is_active', true)
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled || error || !data || data.length === 0) return
        setServices(data as ServiceOption[])
      })
    return () => { cancelled = true }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const payload = {
      customer_name: formData.get('name'),
      customer_phone: formData.get('phone'),
      customer_email: formData.get('email'),
      appointment_date: formData.get('date'),
      service_id: formData.get('service') || null,
      notes: formData.get('notes'),
    }

    try {
      const response = await fetch(`${API_BASE}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setSuccess(true)
        toast.success("Đặt lịch thành công!", { description: "Eva Spa đã nhận thông tin và sẽ gọi xác nhận trong ít phút." })
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error("Lỗi đặt lịch", { description: (errorData as any).error || "Vui lòng thử lại sau." })
      }
    } catch (error) {
      toast.error("Lỗi kết nối", { description: "Không thể kết nối đến máy chủ." })
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n: number) => Number(n).toLocaleString('vi-VN')

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      {/* Page Header */}
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 bg-secondary text-primary px-4 py-1.5 rounded-full text-xs font-semibold">
          <Leaf className="w-4 h-4 text-accent" />
          <span>Đặt Hẹn Trước — Nhận Trọn Thư Giãn</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary">Đặt Lịch Liệu Trình Dưỡng Sinh</h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          Hãy để Eva Spa chuẩn bị gian phòng tĩnh lặng và nồi nước thảo mộc thơm nồng đón tiếp bạn.
        </p>
      </div>
      
      {success ? (
        <Card className="bg-secondary/40 border-primary/20 shadow-md">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-primary font-serif text-2xl sm:text-3xl">Đặt Lịch Hẹn Thành Công!</CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Cảm ơn bạn đã lựa chọn trải nghiệm tại Eva Spa Dưỡng Sinh Thảo Mộc.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-card p-4 rounded-xl border border-border text-sm text-foreground/80 space-y-2 max-w-md mx-auto">
              <p className="flex items-center justify-center gap-2">
                <PhoneCall className="w-4 h-4 text-accent" />
                <span>Chuyên viên tư vấn sẽ liên hệ xác nhận trong <strong>15 phút</strong>.</span>
              </p>
              <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-4 h-4 text-accent" />
                <span>Giờ làm việc: 09:00 - 20:30 (Mỗi ngày)</span>
              </p>
            </div>
            <Button 
              onClick={() => setSuccess(false)} 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-5 rounded-xl shadow-xs"
            >
              Đặt thêm lịch hẹn khác
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border/80 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-secondary/30 border-b border-border/60 pb-6">
            <div className="flex items-center gap-2 text-primary font-serif font-bold text-xl">
              <Calendar className="w-5 h-5 text-accent" />
              <span>Thông Tin Lịch Hẹn Của Bạn</span>
            </div>
            <CardDescription>
              Điền thông tin bên dưới, chuyên viên Eva Spa sẽ chuẩn bị chu đáo nhất cho buổi trị liệu của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground/90 font-medium">Họ và tên *</Label>
                  <Input id="name" name="name" required placeholder="Ví dụ: Nguyễn Thùy Linh" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground/90 font-medium">Số điện thoại *</Label>
                  <Input id="phone" name="phone" required placeholder="0912 345 678" className="rounded-xl" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground/90 font-medium">Email xác nhận</Label>
                  <Input id="email" name="email" type="email" required placeholder="email@example.com" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-foreground/90 font-medium">Thời gian mong muốn *</Label>
                  <Input id="date" name="date" type="datetime-local" required className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service" className="text-foreground/90 font-medium">Liệu trình quan tâm *</Label>
                <select 
                  id="service" 
                  name="service" 
                  required
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <option value="">-- Chọn gói dưỡng sinh / spa --</option>
                  {services.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name} - {fmt(s.price)}đ
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-foreground/90 font-medium">Ghi chú đặc biệt (Nếu có)</Label>
                <textarea 
                  id="notes" 
                  name="notes" 
                  rows={3} 
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
                  placeholder="Ví dụ: Đau mỏi nhiều vùng cổ vai gáy, thích lực tay vừa phải, dị ứng mùi hương..."
                ></textarea>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6 rounded-xl shadow-md text-base transition-all" 
                  disabled={loading}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {loading ? 'Đang gửi thông tin...' : 'Xác Nhận Đặt Lịch Hẹn'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
