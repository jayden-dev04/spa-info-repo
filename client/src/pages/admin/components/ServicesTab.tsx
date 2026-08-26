import { useState, useEffect } from 'react'
import { Leaf, Clock, Plus, Check, Edit2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export interface ServiceItem {
  id: string | number
  name: string
  category?: string
  duration_minutes?: number
  duration?: string
  price: number | string
  description?: string
  ingredients?: string
  is_active?: boolean
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 1,
    name: 'Gội Đầu Dưỡng Sinh Thảo Dược',
    category: 'Dưỡng sinh đầu',
    duration: '60 - 75 Phút',
    duration_minutes: 70,
    price: 199000,
    ingredients: 'Bồ kết, sả chanh, vỏ bưởi tươi, hương nhu',
    is_active: true,
  },
  {
    id: 2,
    name: 'Chăm Sóc & Phục Hồi Da Thảo Mộc',
    category: 'Chăm sóc da',
    duration: '75 Phút',
    duration_minutes: 75,
    price: 350000,
    ingredients: 'Trà xanh hữu cơ, gel lô hội, ngải cứu tươi',
    is_active: true,
  },
  {
    id: 3,
    name: 'Massage Body Đá Nóng Himalaya',
    category: 'Trị liệu toàn thân',
    duration: '90 Phút',
    duration_minutes: 90,
    price: 420000,
    ingredients: 'Đá muối khoáng, tinh dầu tràm gừng trị liệu',
    is_active: true,
  },
  {
    id: 4,
    name: 'Combo Thư Giãn Toàn Diện: Gội Đầu + Massage',
    category: 'Combo gói ưu đãi',
    duration: '120 Phút',
    duration_minutes: 120,
    price: 550000,
    ingredients: 'Thảo mộc nấu tươi & đá nóng đả thông kinh lạc',
    is_active: true,
  },
  {
    id: 5,
    name: 'Xông Hơi Thảo Dược Hoàng Cung & Ngâm Chân',
    category: 'Thải độc',
    duration: '45 Phút',
    duration_minutes: 45,
    price: 150000,
    ingredients: 'Lá tía tô, quế chi, ngải diệp, muối hầm',
    is_active: true,
  },
]

export default function ServicesTab() {
  const [servicesList, setServicesList] = useState<ServiceItem[]>(DEFAULT_SERVICES)
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    category: 'Dưỡng sinh đầu',
    duration_minutes: '60',
    price: '',
    ingredients: '',
    description: '',
  })

  const fetchServices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('id', { ascending: true })

      if (!error && data && data.length > 0) {
        const mapped = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          category: s.category || 'Liệu trình dưỡng sinh',
          duration_minutes: s.duration_minutes || 60,
          duration: `${s.duration_minutes || 60} Phút`,
          price: Number(s.price),
          ingredients: s.ingredients || s.description || 'Thảo mộc tự nhiên',
          description: s.description,
          is_active: s.is_active !== false,
        }))
        setServicesList(mapped)
      }
    } catch (e) {
      console.warn('Using default services:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleToggle = async (id: string | number) => {
    const current = servicesList.find((s) => s.id === id)
    if (!current) return
    const newActive = !current.is_active

    setServicesList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: newActive } : s))
    )

    try {
      await supabase
        .from('services')
        .update({ is_active: newActive })
        .eq('id', id)

      toast.success(newActive ? 'Đã kích hoạt gói dịch vụ' : 'Đã tạm ẩn gói dịch vụ')
    } catch {
      toast.success('Đã cập nhật trạng thái gói dịch vụ')
    }
  }

  const handleOpenAdd = () => {
    setEditingService(null)
    setFormData({
      name: '',
      category: 'Dưỡng sinh đầu',
      duration_minutes: '60',
      price: '',
      ingredients: '',
      description: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (service: ServiceItem) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      category: service.category || 'Dưỡng sinh đầu',
      duration_minutes: String(service.duration_minutes || 60),
      price: String(service.price),
      ingredients: service.ingredients || '',
      description: service.description || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.price) {
      toast.error('Vui lòng điền tên và giá dịch vụ')
      return
    }

    setSubmitting(true)
    const payload = {
      name: formData.name,
      price: Number(formData.price),
      duration_minutes: Number(formData.duration_minutes) || 60,
      description: formData.description || formData.ingredients,
      is_active: true,
    }

    try {
      if (editingService) {
        await supabase
          .from('services')
          .update(payload)
          .eq('id', editingService.id)

        toast.success(`Cập nhật gói "${formData.name}" thành công!`)
      } else {
        await supabase
          .from('services')
          .insert(payload)

        toast.success(`Thêm mới gói "${formData.name}" thành công!`)
      }

      setIsModalOpen(false)
      fetchServices()
    } catch (err: any) {
      toast.error('Lỗi khi lưu dịch vụ', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-primary">Danh Mục Gói Liệu Trình Dưỡng Sinh</h2>
          <p className="text-xs text-muted-foreground">Quản lý các gói chăm sóc khách hàng có thể đặt trên website</p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Gói Dịch Vụ</span>
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground text-xs">Đang tải danh sách dịch vụ...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {servicesList.map((service) => (
            <Card key={service.id} className="rounded-2xl border-border/80 hover:shadow-md transition-all overflow-hidden flex flex-col bg-card">
              <CardHeader className="bg-secondary/30 pb-3 border-b border-border/60">
                <div className="flex justify-between items-start gap-2">
                  <Badge variant="outline" className="bg-background text-primary border-primary/20 text-[10px]">
                    {service.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span>{service.duration || `${service.duration_minutes} Phút`}</span>
                  </div>
                </div>
                <CardTitle className="font-serif font-bold text-base text-foreground mt-2">
                  {service.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground font-medium">
                    <Leaf className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Thảo mộc: {service.ingredients}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Giá niêm yết</span>
                    <span className="text-lg font-bold text-accent">
                      {typeof service.price === 'number' ? service.price.toLocaleString('vi-VN') + 'đ' : service.price}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEdit(service)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant={service.is_active ? "outline" : "secondary"}
                      onClick={() => handleToggle(service.id)}
                      className={`text-xs rounded-xl h-8 px-3 cursor-pointer ${service.is_active ? 'border-primary/30 text-primary' : 'text-muted-foreground'}`}
                    >
                      {service.is_active ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-primary" />
                          Đang mở
                        </span>
                      ) : (
                        'Tạm ẩn'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="font-serif font-bold text-lg text-primary">
                {editingService ? 'Chỉnh Sửa Gói Dịch Vụ' : 'Thêm Gói Dịch Vụ Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <Label htmlFor="sname" className="font-semibold text-foreground">Tên gói dịch vụ *</Label>
                <Input
                  id="sname"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Gội Đầu Dưỡng Sinh Thảo Dược"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="sprice" className="font-semibold text-foreground">Giá gói (VNĐ) *</Label>
                  <Input
                    id="sprice"
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="199000"
                    className="rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sduration" className="font-semibold text-foreground">Thời lượng (Phút) *</Label>
                  <Input
                    id="sduration"
                    type="number"
                    required
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    placeholder="60"
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="scat" className="font-semibold text-foreground">Danh mục</Label>
                <Input
                  id="scat"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Dưỡng sinh đầu, Trị liệu cổ vai gáy..."
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="singr" className="font-semibold text-foreground">Thành phần thảo mộc / Mô tả ngắn</Label>
                <Input
                  id="singr"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  placeholder="Bồ kết, sả chanh, vỏ bưởi tươi..."
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold px-5 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : editingService ? 'Cập Nhật' : 'Tạo Gói Mới'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
