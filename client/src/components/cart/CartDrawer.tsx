import { useNavigate } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FREESHIP_THRESHOLD = 500000

export default function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount, isCartOpen, setIsCartOpen } = useCart()
  const navigate = useNavigate()

  if (!isCartOpen) return null

  const progressPercent = Math.min(100, Math.round((totalAmount / FREESHIP_THRESHOLD) * 100))
  const remainingForFreeship = Math.max(0, FREESHIP_THRESHOLD - totalAmount)

  const handleCheckout = () => {
    setIsCartOpen(false)
    navigate('/checkout')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-border bg-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-primary">Giỏ Hàng Thảo Mộc</h3>
                <p className="text-xs text-muted-foreground">{totalItems} sản phẩm đã chọn</p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full bg-background border border-border hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Freeship Progress Bar */}
          <div className="px-5 py-3 bg-secondary/50 border-b border-border/60 text-xs">
            {remainingForFreeship > 0 ? (
              <p className="text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Mua thêm <strong className="text-accent font-bold">{remainingForFreeship.toLocaleString('vi-VN')}đ</strong> để nhận <strong>Miễn phí vận chuyển</strong></span>
              </p>
            ) : (
              <p className="text-emerald-700 font-semibold mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bạn đủ điều kiện nhận <strong>Miễn phí vận chuyển toàn quốc!</strong></span>
              </p>
            )}
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-accent h-full transition-all duration-500 rounded-full" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground/50">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-serif font-bold text-base text-foreground">Giỏ hàng của bạn đang trống</h4>
                <p className="text-xs max-w-xs leading-relaxed">Hãy khám phá các sản phẩm thảo mộc và mỹ phẩm dưỡng sinh tự nhiên của Eva Spa.</p>
                <Button 
                  variant="outline" 
                  className="rounded-xl mt-2 border-primary/30 text-primary hover:bg-primary hover:text-white"
                  onClick={() => {
                    setIsCartOpen(false)
                    navigate('/shop')
                  }}
                >
                  Khám phá cửa hàng
                </Button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.id} 
                  className="flex gap-3.5 p-3 rounded-2xl bg-background border border-border/80 hover:border-primary/30 transition-all group"
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-20 h-20 rounded-xl object-cover bg-secondary shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-medium text-xs sm:text-sm text-foreground line-clamp-2 leading-snug">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-muted-foreground/60 hover:text-destructive transition-colors p-1 cursor-pointer"
                          title="Xóa món này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-accent font-bold text-sm mt-1">
                        {item.price.toLocaleString('vi-VN')}đ
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40">
                      <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 px-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold text-foreground min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 px-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-semibold text-muted-foreground">
                        = {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Actions */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-border bg-secondary/20 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tạm tính ({totalItems} sản phẩm):</span>
                  <span className="font-semibold text-foreground">{totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Phí vận chuyển:</span>
                  <span className="font-semibold text-foreground">
                    {remainingForFreeship === 0 ? (
                      <span className="text-emerald-700 font-bold">Miễn phí</span>
                    ) : (
                      'Tính khi thanh toán'
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border/60">
                  <span className="font-serif">Tổng thanh toán:</span>
                  <span className="text-accent text-lg font-bold">{totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="rounded-xl border-border text-xs text-muted-foreground hover:text-destructive"
                >
                  Xóa giỏ hàng
                </Button>
                <Button
                  onClick={handleCheckout}
                  className="rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>Thanh toán</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
