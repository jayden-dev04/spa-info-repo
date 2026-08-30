import { useState, type SyntheticEvent } from 'react'
import { X, ShoppingBag, Leaf, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/context/CartContext'
import { toast } from 'sonner'
import maskImg from '@/assets/images/product_mask.jpg'
import sunscreenImg from '@/assets/images/product_sunscreen.jpg'

const handleImgError = (e: SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget
  if (img.dataset.stage === 'unsplash') { img.src = maskImg; img.dataset.stage = 'mask' }
  else if (img.dataset.stage === 'mask') { img.src = sunscreenImg; img.dataset.stage = 'sunscreen' }
}

export interface ProductItem {
  id: string | number
  name: string
  price: number
  originalPrice?: number
  image_url?: string
  img?: string
  category?: string
  description?: string
  ingredients?: string
  volume?: string
  stock?: number
  tag?: string
  organic?: boolean
}

interface ProductDetailModalProps {
  product: ProductItem | null
  onClose: () => void
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { addToCart, setIsCartOpen } = useCart()
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const imageUrl = product.image_url || product.img || ''
  const isOutOfStock = product.stock !== undefined && product.stock <= 0

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: imageUrl,
        category: product.category,
      },
      quantity
    )
    toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`)
    onClose()
  }

  const handleBuyNow = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: imageUrl,
        category: product.category,
      },
      quantity
    )
    onClose()
    setIsCartOpen(true)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-background/80 hover:bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Product Image */}
            <div className="relative bg-secondary/40 h-64 md:h-full min-h-[300px] flex items-center justify-center overflow-hidden">
              <img
                src={imageUrl}
                alt={product.name}
                data-stage="unsplash"
                onError={handleImgError}
              />
              {product.tag && (
                <span className="absolute top-4 left-4 bg-primary/90 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  {product.tag}
                </span>
              )}
            </div>

            {/* Product Information */}
            <div className="p-6 md:p-8 flex flex-col justify-between space-y-5">
              
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-secondary text-primary border-primary/20 text-xs">
                    {product.category || 'Mỹ phẩm thảo mộc'}
                  </Badge>
                  {product.organic && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs gap-1">
                      <Leaf className="w-3 h-3 text-emerald-600" />
                      <span>100% Thuần Chay</span>
                    </Badge>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-serif font-bold text-primary leading-snug">
                  {product.name}
                </h3>

                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-accent">
                    {product.price.toLocaleString('vi-VN')}đ
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {product.originalPrice.toLocaleString('vi-VN')}đ
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {product.description || 'Chiết xuất từ thảo mộc thiên nhiên được tuyển chọn kỹ lưỡng, lành tính và an toàn cho mọi làn da nhạy cảm.'}
                </p>

                {product.ingredients && (
                  <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-accent" />
                      <span>Thành phần chính:</span>
                    </p>
                    <p>{product.ingredients}</p>
                  </div>
                )}
              </div>

              {/* Quantity & CTA */}
              <div className="space-y-4 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Số lượng mua:</span>
                  <div className="flex items-center border border-border rounded-xl bg-background overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="px-3 py-1.5 text-muted-foreground hover:bg-secondary disabled:opacity-40 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 text-sm font-bold text-foreground min-w-[32px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-1.5 text-muted-foreground hover:bg-secondary cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="rounded-xl border-primary/40 text-primary hover:bg-primary hover:text-white text-xs py-5"
                  >
                    <ShoppingBag className="w-4 h-4 mr-1.5" />
                    <span>Thêm vào giỏ</span>
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs py-5 shadow-md"
                  >
                    <span>Mua ngay</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
