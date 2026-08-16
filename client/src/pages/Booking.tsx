import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function Booking() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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
      const response = await fetch('http://127.0.0.1:8000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setSuccess(true)
        toast.success("Đặt lịch thành công!", { description: "Chúng tôi đã gửi email xác nhận cho bạn." })
      } else {
        const errorData = await response.json()
        toast.error("Lỗi đặt lịch", { description: errorData.error || "Vui lòng thử lại sau." })
      }
    } catch (error) {
      toast.error("Lỗi kết nối", { description: "Không thể kết nối đến máy chủ." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold text-center mb-8">Đặt Lịch Chăm Sóc</h1>
      
      {success ? (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700 text-center text-2xl">Đặt Lịch Thành Công!</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-green-800">
            <p className="mb-4">Cảm ơn bạn đã đặt lịch. Chúng tôi đã gửi email xác nhận đến hòm thư của bạn.</p>
            <Button onClick={() => setSuccess(false)} variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
              Đặt lịch mới
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin lịch hẹn</CardTitle>
            <CardDescription>Vui lòng điền thông tin để Eva Spa chuẩn bị đón tiếp bạn chu đáo nhất.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên</Label>
                  <Input id="name" name="name" required placeholder="Nguyễn Văn A" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" name="phone" required placeholder="0912 345 678" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Để nhận xác nhận)</Label>
                  <Input id="email" name="email" type="email" required placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Thời gian mong muốn</Label>
                  <Input id="date" name="date" type="datetime-local" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Dịch vụ quan tâm</Label>
                <select id="service" name="service" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="">-- Chọn dịch vụ --</option>
                  <option value="1">Chăm sóc da mặt chuyên sâu</option>
                  <option value="2">Phun xăm thẩm mỹ (Môi/Mày)</option>
                  <option value="3">Massage gội đầu dưỡng sinh</option>
                  <option value="4">Triệt lông vĩnh viễn</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú thêm</Label>
                <textarea id="notes" name="notes" rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" placeholder="Tình trạng da, yêu cầu chuyên viên..."></textarea>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-orange-600 text-white" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Hoàn Tất Đặt Lịch'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
