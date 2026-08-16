import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Leaf, ShoppingBag, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

import serumImg from '@/assets/images/product_serum.jpg'
import maskImg from '@/assets/images/product_mask.jpg'
import sunscreenImg from '@/assets/images/product_sunscreen.jpg'

const PRODUCTS = [
  { id: 1, name: 'Tinh Chất Cấp Ẩm Thảo Mộc Danique', price: 1690000, img: serumImg, tag: 'Bán chạy nhất', organic: true },
  { id: 2, name: 'Mặt Nạ Dưỡng Trà Xanh pH Thấp', price: 540000, img: maskImg, tag: 'Thảo mộc 100%', organic: true },
  { id: 3, name: 'Retinol Midnight Phục Hồi Đêm', price: 1990000, img: serumImg, tag: 'Chống lão hóa', organic: false },
  { id: 4, name: 'Kem Chống Nắng Vật Lý Thảo Dược', price: 790000, img: sunscreenImg, tag: 'Dịu nhẹ cho da', organic: true },
]

export default function Shop() {
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const handleBuy = async (product: typeof PRODUCTS[0]) => {
    setLoadingId(product.id)
    try {
      // Create a dummy order for demonstration
      const { error } = await supabase
        .from('orders')
        .insert({
          customer_name: 'Khách hàng vãng lai',
          customer_email: 'guest@example.com',
          total_amount: product.price,
          status: 'pending'
        })
      
      if (error) throw error

      toast.success("Đặt hàng thành công!", { description: `Bạn đã đặt mua ${product.name}. Eva Spa sẽ sớm liên hệ xác nhận.` })
    } catch (err: any) {
      toast.error("Lỗi đặt hàng", { description: err.message })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 text-accent text-xs font-semibold uppercase tracking-wider mb-2">
            <Leaf className="w-4 h-4" />
            <span>Mỹ phẩm thuần chay & Dưỡng sinh</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary">Sản Phẩm Chăm Sóc Thảo Mộc</h1>
          <p className="text-muted-foreground text-sm mt-1">Các dòng mỹ phẩm hữu cơ chiết xuất tự nhiên được Eva Spa chọn lọc kỹ lưỡng.</p>
        </div>
        <Button variant="outline" className="relative border-border bg-card hover:bg-secondary flex items-center gap-2 rounded-xl">
          <ShoppingBag className="w-4 h-4 text-primary" />
          <span>Giỏ hàng</span>
          <span className="bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">0</span>
        </Button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRODUCTS.map((p) => (
          <Card key={p.id} className="flex flex-col overflow-hidden rounded-2xl border-border/80 hover:border-primary/40 hover:shadow-lg transition-all duration-300 group">
            <div className="relative h-56 w-full bg-secondary/30 overflow-hidden">
              <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              {p.tag && (
                <span className="absolute top-3 left-3 bg-primary/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-accent" />
                  {p.tag}
                </span>
              )}
            </div>

            <CardContent className="pt-5 flex-grow text-left space-y-2">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                <Leaf className="w-3 h-3 text-accent" />
                <span>Chiết xuất thiên nhiên</span>
              </div>
              <CardTitle className="text-base font-serif font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {p.name}
              </CardTitle>
              <CardDescription className="text-accent font-bold text-lg pt-1">
                {p.price.toLocaleString('vi-VN')}đ
              </CardDescription>
            </CardContent>

            <CardFooter className="pt-0">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 font-medium" 
                onClick={() => handleBuy(p)}
                disabled={loadingId === p.id}
              >
                <ShoppingBag className="w-4 h-4" />
                {loadingId === p.id ? 'Đang xử lý...' : 'Mua ngay'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
