import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

import serumImg from '@/assets/images/product_serum.jpg'
import maskImg from '@/assets/images/product_mask.jpg'
import sunscreenImg from '@/assets/images/product_sunscreen.jpg'

const PRODUCTS = [
  { id: 1, name: 'Tinh Chất Cấp Ẩm Danique', price: 1690000, img: serumImg },
  { id: 2, name: 'Mặt Nạ Dưỡng Da pH Thấp', price: 540000, img: maskImg },
  { id: 3, name: 'Retinol Midnight Serum', price: 1990000, img: serumImg },
  { id: 4, name: 'Kem Chống Nắng Nâng Tone', price: 790000, img: sunscreenImg },
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

      toast.success("Đặt hàng thành công!", { description: `Bạn đã mua ${product.name}` })
    } catch (err: any) {
      toast.error("Lỗi đặt hàng", { description: err.message })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Cửa Hàng Mỹ Phẩm</h1>
        <Button variant="outline" className="relative">
          🛒 Giỏ hàng
          <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">0</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {PRODUCTS.map((p) => (
          <Card key={p.id} className="flex flex-col overflow-hidden">
            <div className="h-48 w-full bg-muted/50 overflow-hidden">
              <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform hover:scale-105" />
            </div>
            <CardContent className="pt-6 flex-grow text-center">
              <CardTitle className="text-lg leading-tight mb-2">{p.name}</CardTitle>
              <CardDescription className="text-primary font-bold text-lg">{p.price.toLocaleString('vi-VN')}đ</CardDescription>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleBuy(p)}
                disabled={loadingId === p.id}
              >
                {loadingId === p.id ? 'Đang xử lý...' : 'Mua ngay'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
