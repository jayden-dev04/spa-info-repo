import { useState, useEffect } from 'react'
import { Clock, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ServicesTab() {
  const [servicesList, setServicesList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    short_description: '',
    price: '',
    duration_minutes: '',
    is_active: true
  })

  const fetchServices = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/services')
      const data = await res.json()
      if (data.success) {
        setServicesList(data.data)
      } else {
        toast.error('Lỗi khi tải danh sách dịch vụ')
      }
    } catch (error) {
      toast.error('Không thể kết nối đến máy chủ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/services/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setServicesList(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s))
        toast.success("Đã cập nhật trạng thái hiển thị dịch vụ")
      } else {
        toast.error('Cập nhật thất bại')
      }
    } catch (error) {
      toast.error('Lỗi mạng')
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này không? Hành động này không thể hoàn tác.')) return

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/services/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setServicesList(prev => prev.filter(s => s.id !== id))
        toast.success('Đã xóa dịch vụ thành công')
      } else {
        toast.error('Xóa thất bại: ' + (data.error || 'Lỗi không xác định'))
      }
    } catch (error) {
      toast.error('Lỗi mạng khi xóa')
    }
  }

  const openAddModal = () => {
    setIsEditing(false)
    setFormData({
      id: 0,
      name: '',
      short_description: '',
      price: '',
      duration_minutes: '',
      is_active: true
    })
    setIsModalOpen(true)
  }

  const openEditModal = (service: any) => {
    setIsEditing(true)
    setFormData({
      id: service.id,
      name: service.name || '',
      short_description: service.short_description || '',
      price: service.price || '',
      duration_minutes: service.duration_minutes || '',
      is_active: service.is_active
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.duration_minutes) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (Tên, Giá, Thời gian)')
      return
    }

    setSubmitting(true)
    try {
      const url = isEditing 
        ? `http://127.0.0.1:8000/api/services/${formData.id}`
        : `http://127.0.0.1:8000/api/services`
      
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          short_description: formData.short_description,
          price: Number(formData.price),
          duration_minutes: Number(formData.duration_minutes),
          is_active: formData.is_active
        }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success(isEditing ? 'Cập nhật dịch vụ thành công!' : 'Thêm dịch vụ thành công!')
        setIsModalOpen(false)
        fetchServices() // Reload list
      } else {
        toast.error('Thao tác thất bại: ' + (data.message || 'Lỗi không xác định'))
      }
    } catch (error) {
      toast.error('Lỗi mạng, vui lòng thử lại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-primary">Danh Mục Dịch Vụ</h2>
          <p className="text-xs text-muted-foreground">Quản lý các gói dịch vụ và liệu trình tại spa</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm dịch vụ mới</span>
        </Button>
      </div>

      <Card className="border-border/80 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/40 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold w-16">ID</th>
                <th className="px-6 py-4 font-semibold min-w-[200px]">Tên Dịch Vụ</th>
                <th className="px-6 py-4 font-semibold min-w-[120px]">Thời Gian</th>
                <th className="px-6 py-4 font-semibold min-w-[120px]">Giá Tiền</th>
                <th className="px-6 py-4 font-semibold">Trạng Thái</th>
                <th className="px-6 py-4 font-semibold text-right min-w-[100px]">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : servicesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Chưa có dịch vụ nào.
                  </td>
                </tr>
              ) : (
                servicesList.map((service) => (
                  <tr key={service.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground/80">#{service.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-serif font-semibold text-foreground">{service.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-[300px]" title={service.short_description}>
                        {service.short_description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-accent" />
                        <span>{service.duration_minutes} phút</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-accent">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant="outline" 
                        className={`cursor-pointer ${service.is_active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}
                        onClick={() => handleToggle(service.id, service.is_active)}
                      >
                        {service.is_active ? <Eye className="w-3 h-3 mr-1"/> : <EyeOff className="w-3 h-3 mr-1"/>}
                        {service.is_active ? 'Hiển thị' : 'Đã ẩn'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditModal(service)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          title="Sửa dịch vụ"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(service.id)}
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          title="Xóa dịch vụ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-primary">
              {isEditing ? 'Sửa thông tin dịch vụ' : 'Thêm dịch vụ mới'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên dịch vụ <span className="text-rose-500">*</span></Label>
              <Input 
                id="name" 
                placeholder="Ví dụ: Gội đầu dưỡng sinh" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Giá tiền (VNĐ) <span className="text-rose-500">*</span></Label>
                <Input 
                  id="price" 
                  type="number"
                  placeholder="Ví dụ: 150000"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Thời gian (phút) <span className="text-rose-500">*</span></Label>
                <Input 
                  id="duration" 
                  type="number"
                  placeholder="Ví dụ: 60"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Mô tả ngắn gọn <span className="text-rose-500">*</span></Label>
              <Input 
                id="desc" 
                placeholder="Nguyên liệu, công dụng chính..."
                value={formData.short_description}
                onChange={(e) => setFormData({...formData, short_description: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Hủy bỏ
            </Button>
            <Button onClick={handleSave} disabled={submitting} className="bg-primary text-white">
              {submitting ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Tạo mới')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
