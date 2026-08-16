import { useState } from 'react'
import { Leaf, Clock, Plus, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function ServicesTab() {
  const [servicesList, setServicesList] = useState([
    {
      id: 1,
      title: 'Gội Đầu Dưỡng Sinh Thảo Dược',
      category: 'Dưỡng sinh đầu',
      duration: '60 - 75 Phút',
      price: '199.000đ',
      ingredients: 'Bồ kết, sả chanh, vỏ bưởi tươi, hương nhu',
      isActive: true
    },
    {
      id: 2,
      title: 'Chăm Sóc & Phục Hồi Da Thảo Mộc',
      category: 'Chăm sóc da',
      duration: '75 Phút',
      price: '350.000đ',
      ingredients: 'Trà xanh hữu cơ, gel lô hội, ngải cứu tươi',
      isActive: true
    },
    {
      id: 3,
      title: 'Massage Body Đá Nóng Himalaya',
      category: 'Trị liệu toàn thân',
      duration: '90 Phút',
      price: '420.000đ',
      ingredients: 'Đá muối khoáng, tinh dầu tràm gừng trị liệu',
      isActive: true
    },
    {
      id: 4,
      title: 'Combo Thư Giãn Toàn Diện: Gội Đầu + Massage',
      category: 'Combo gói ưu đãi',
      duration: '120 Phút',
      price: '550.000đ',
      ingredients: 'Thảo mộc nấu tươi & đá nóng đả thông kinh lạc',
      isActive: true
    },
    {
      id: 5,
      title: 'Xông Hơi Thảo Dược Hoàng Cung & Ngâm Chân',
      category: 'Thải độc',
      duration: '45 Phút',
      price: '150.000đ',
      ingredients: 'Lá tía tô, quế chi, ngải diệp, muối hầm',
      isActive: true
    },
  ])

  const handleToggle = (id: number) => {
    setServicesList(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s))
    toast.success("Đã cập nhật trạng thái gói dịch vụ")
  }

  return (
    <div className="space-y-6">
      <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-primary">Danh Mục Gói Liệu Trình Dưỡng Sinh</h2>
          <p className="text-xs text-muted-foreground">Quản lý các gói chăm sóc khách hàng có thể đặt trên website</p>
        </div>
        <Button 
          onClick={() => toast.info("Tính năng tạo gói dịch vụ mới sẽ được bổ sung trong bản cập nhật kế tiếp.")}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm gói dịch vụ</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {servicesList.map((service) => (
          <Card key={service.id} className="rounded-2xl border-border/80 hover:shadow-md transition-all overflow-hidden flex flex-col">
            <CardHeader className="bg-secondary/30 pb-3 border-b border-border/60">
              <div className="flex justify-between items-start gap-2">
                <Badge variant="outline" className="bg-background text-primary border-primary/20 text-[10px]">
                  {service.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span>{service.duration}</span>
                </div>
              </div>
              <CardTitle className="font-serif font-bold text-base text-foreground mt-2">
                {service.title}
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
                  <span className="text-lg font-bold text-accent">{service.price}</span>
                </div>

                <Button
                  size="sm"
                  variant={service.isActive ? "outline" : "secondary"}
                  onClick={() => handleToggle(service.id)}
                  className={`text-xs rounded-xl h-8 px-3 ${service.isActive ? 'border-primary/30 text-primary' : 'text-muted-foreground'}`}
                >
                  {service.isActive ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-primary" />
                      Đang mở
                    </span>
                  ) : (
                    'Tạm ẩn'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
