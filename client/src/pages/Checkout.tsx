import React, { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Leaf, ArrowLeft, ShieldCheck, Truck, Banknote, QrCode, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { API_BASE } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const BANK_INFO = {
  bankId: 'VietinBank',
  accountNo: '0364911491',
  accountName: 'TRAN TRUNG KIEN',
}

const FREESHIP_THRESHOLD = 500000
const STANDARD_SHIPPING_FEE = 30000

export default function Checkout() {
  const { cart, totalAmount, clearCart } = useCart()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vietqr'>('vietqr')
  const [qrConfirmOpen, setQrConfirmOpen] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: 'TP. Cần Thơ',
    district: '',
    address: '',
    notes: '',
  })

  // Redirect to shop if cart is empty
  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-lg text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-primary">
          <Leaf className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-primary mb-2">Giỏ hàng của bạn đang trống</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Vui lòng thêm sản phẩm thảo mộc vào giỏ hàng trước khi tiến hành thanh toán.
        </p>
        <Link to="/shop">
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6">
            Khám phá sản phẩm
          </Button>
        </Link>
      </div>
    )
  }

  const shippingFee = totalAmount >= FREESHIP_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE
  const finalTotal = totalAmount + shippingFee

  // Mã đơn ổn định cho suốt phiên thanh toán — không đổi mỗi re-render —
  // dùng chung cho ảnh QR preview lẫn payload gửi backend.
  const orderCode = useMemo(
    () => `EVA${Math.floor(100000 + Math.random() * 900000)}`,
    []
  )
  const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNo}-compact2.png?amount=${finalTotal}&addInfo=${orderCode}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      toast.error('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ chi tiết.')
      return
    }
    // Với VietQR: bật hộp xác nhận quét mã TRƯỚC khi ghi đơn.
    if (paymentMethod === 'vietqr') {
      setQrConfirmOpen(true)
      return
    }
    await placeOrder()
  }

  const placeOrder = async () => {
    setQrConfirmOpen(false)
    setLoading(true)

    const fullAddress = `${formData.address}${formData.district ? ', ' + formData.district : ''}${formData.city ? ', ' + formData.city : ''}`

    const payload = {
      customer_name: formData.fullName,
      customer_phone: formData.phone,
      customer_email: formData.email || `${formData.phone}@guest.evaspa.vn`,
      customer_address: fullAddress,
      total_amount: finalTotal,
      shipping_fee: shippingFee,
      payment_method: paymentMethod,
      notes: formData.notes,
      order_code: orderCode,
      items: cart.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.imageUrl,
      })),
    }

    try {
      let orderCreated = false

      try {
        const response = await fetch(`${API_BASE}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          orderCreated = true
        }
      } catch (beErr) {
        console.warn('Backend API offline or unreachable, falling back to Supabase direct insert:', beErr)
      }

      if (!orderCreated) {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: formData.fullName,
            customer_email: payload.customer_email,
            customer_phone: formData.phone,
            customer_address: fullAddress,
            total_amount: finalTotal,
            status: 'pending',
          })
          .select()
          .single()

        if (orderError) throw orderError

        if (orderData?.id && cart.length > 0) {
          const itemsToInsert = cart.map((item) => ({
            order_id: orderData.id,
            product_id: typeof item.id === 'string' && item.id.length > 10 ? item.id : null,
            quantity: item.quantity,
            price: item.price,
          }))

          await supabase.from('order_items').insert(itemsToInsert)
        }
      }

      const successState = {
        orderCode: orderCode,
        customerName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        address: fullAddress,
        paymentMethod: paymentMethod,
        totalAmount: finalTotal,
        shippingFee: shippingFee,
        items: cart,
        bankInfo: BANK_INFO,
        qrUrl: qrUrl,
      }

      clearCart()
      toast.success('Đặt hàng thành công!', {
        description: `Mã đơn hàng: #${orderCode}. Cảm ơn bạn đã ủng hộ Eva Spa.`,
      })

      navigate('/order-success', { state: successState })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại hoặc gọi Hotline.'
      console.error('Lỗi đặt hàng:', err)
      toast.error('Đặt hàng thất bại', {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl font-sans">
      {/* Back button */}
      <div className="mb-6">
        <Link 
          to="/shop" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại cửa hàng</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10 text-left">
        <div className="inline-flex items-center gap-1.5 text-accent text-xs font-semibold uppercase tracking-wider mb-2">
          <Leaf className="w-4 h-4" />
          <span>Thanh toán an toàn & nhanh chóng</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary">
          Thông Tin Đặt Hàng & Thanh Toán
        </h1>
      </div>

      <form onSubmit={handleSubmitOrder} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Shipping & Payment Method (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Customer Info */}
            <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden gap-0 py-0">
              <CardHeader className="bg-secondary/30 pb-4 border-b border-border/60">
                <CardTitle className="text-lg font-serif font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-sans font-bold">1</span>
                  <span>Địa Chỉ Nhận Hàng</span>
                </CardTitle>
                <CardDescription>
                  Vui lòng cung cấp chính xác để chuyên viên giao hàng tận nơi nhanh chóng.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-semibold text-foreground/90">
                      Họ và tên người nhận *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: Nguyễn Thùy Linh"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold text-foreground/90">
                      Số điện thoại nhận hàng *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0912 345 678"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground/90">
                    Email nhận thông báo đơn hàng
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com (nhận hóa đơn & mã đơn hàng)"
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-xs font-semibold text-foreground/90">
                      Tỉnh / Thành phố *
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Cần Thơ, TP.HCM, Hà Nội..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="district" className="text-xs font-semibold text-foreground/90">
                      Quận / Huyện
                    </Label>
                    <Input
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="Ninh Kiều, Cái Răng, Quận 1..."
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-semibold text-foreground/90">
                    Địa chỉ chi tiết (Số nhà, tên đường, phường/xã) *
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 123 Đường 30 Tháng 4, Phường An Khánh"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs font-semibold text-foreground/90">
                    Ghi chú giao hàng (Nếu có)
                  </Label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao 15 phút..."
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2. Payment Method */}
            <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden gap-0 py-0">
              <CardHeader className="bg-secondary/30 pb-4 border-b border-border/60">
                <CardTitle className="text-lg font-serif font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-sans font-bold">2</span>
                  <span>Phương Thức Thanh Toán</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                
                {/* VietQR Option */}
                <div 
                  onClick={() => setPaymentMethod('vietqr')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    paymentMethod === 'vietqr'
                      ? 'border-primary bg-primary/5 shadow-xs'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'vietqr'}
                    onChange={() => setPaymentMethod('vietqr')}
                    className="mt-1 text-primary focus:ring-primary h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <QrCode className="w-4 h-4 text-accent" />
                      <span className="font-serif font-bold text-foreground text-sm sm:text-base">
                        Chuyển Khoản Ngân Hàng Tự Động (VietQR)
                      </span>
                      <span className="bg-accent/20 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Khuyên Dùng
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Quét mã QR qua mọi ứng dụng ngân hàng (VietinBank, Vietcombank, MB, Techcombank, MoMo,...). Tiền vào tài khoản tức thì, xác nhận đơn tự động.
                    </p>

                    {/* VietQR Box Details */}
                    {paymentMethod === 'vietqr' && (
                      <div className="mt-4 p-4 rounded-xl bg-background border border-border space-y-3 animate-in fade-in">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-xs border border-border/80 shrink-0 flex items-center justify-center">
                            <img
                              src={qrUrl}
                              alt="VietQR VietinBank"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="text-xs space-y-1.5 text-muted-foreground w-full">
                            <div className="flex justify-between border-b border-border/50 pb-1">
                              <span>Ngân hàng:</span>
                              <strong className="text-foreground">{BANK_INFO.bankId} (Việt Nam Công Thương)</strong>
                            </div>
                            <div className="flex justify-between border-b border-border/50 pb-1">
                              <span>Số tài khoản:</span>
                              <strong className="text-primary font-mono text-sm">{BANK_INFO.accountNo}</strong>
                            </div>
                            <div className="flex justify-between border-b border-border/50 pb-1">
                              <span>Chủ tài khoản:</span>
                              <strong className="text-foreground uppercase">{BANK_INFO.accountName}</strong>
                            </div>
                            <div className="flex justify-between pt-1">
                              <span>Số tiền:</span>
                              <strong className="text-accent font-bold text-sm">{finalTotal.toLocaleString('vi-VN')}đ</strong>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                          ℹ️ Bạn có thể quét mã QR ngay bây giờ hoặc sau khi bấm Xác nhận Đặt hàng.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* COD Option */}
                <div 
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    paymentMethod === 'cod'
                      ? 'border-primary bg-primary/5 shadow-xs'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-primary focus:ring-primary h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Banknote className="w-4 h-4 text-primary" />
                      <span className="font-serif font-bold text-foreground text-sm sm:text-base">
                        Thanh Toán Tiền Mặt Khi Nhận Hàng (COD)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Bạn thanh toán bằng tiền mặt cho shipper khi nhận và kiểm tra kiện hàng tại nhà.
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: Order Summary & Submit (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="rounded-2xl border-border/80 shadow-md sticky top-24 overflow-hidden gap-0 py-0">
              <CardHeader className="bg-secondary/40 pb-4 border-b border-border/60">
                <CardTitle className="text-lg font-serif font-bold text-primary flex items-center justify-between">
                  <span>Tóm Tắt Đơn Hàng</span>
                  <span className="text-xs font-sans font-semibold text-muted-foreground">
                    ({cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm)
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Items List */}
                <div className="max-h-72 overflow-y-auto space-y-3 pr-1 divide-y divide-border/40">
                  {cart.map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover bg-secondary shrink-0 border border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs text-foreground line-clamp-2 leading-snug">
                          {item.name}
                        </h4>
                        <div className="flex justify-between items-center mt-1 text-xs">
                          <span className="text-muted-foreground">SL: {item.quantity}</span>
                          <span className="font-bold text-accent">
                            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-border/60 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tạm tính:</span>
                    <span>{totalAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Phí vận chuyển:</span>
                    <span>
                      {shippingFee === 0 ? (
                        <span className="text-emerald-700 font-bold">Miễn phí (Freeship)</span>
                      ) : (
                        <span className="font-semibold text-foreground">{shippingFee.toLocaleString('vi-VN')}đ</span>
                      )}
                    </span>
                  </div>
                  {shippingFee === 0 && (
                    <p className="text-[11px] text-emerald-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Đơn hàng trên 500k được miễn phí giao hàng toàn quốc</span>
                    </p>
                  )}

                  <div className="flex justify-between text-base font-bold text-foreground pt-3 border-t border-border">
                    <span className="font-serif text-lg text-primary">Tổng cộng:</span>
                    <span className="text-accent text-xl font-bold">{finalTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="bg-secondary/40 p-3 rounded-xl border border-border/60 space-y-1.5 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <ShieldCheck className="w-4 h-4 text-accent" />
                    <span>Cam kết 100% thảo mộc tự nhiên</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Truck className="w-4 h-4 text-accent" />
                    <span>Giao hàng toàn quốc 2 - 4 ngày làm việc</span>
                  </div>
                </div>

                {/* Submit CTA */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-6 rounded-xl text-base shadow-lg hover:shadow-xl transition-all"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {loading ? 'Đang xử lý đơn hàng...' : `Xác Nhận Đặt Hàng (${finalTotal.toLocaleString('vi-VN')}đ)`}
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </form>

      {/* Hộp xác nhận QR — chỉ bật sau khi form hợp lệ */}
      <Dialog open={qrConfirmOpen} onOpenChange={setQrConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-primary">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              Xác nhận chuyển khoản VietQR
            </DialogTitle>
            <DialogDescription>
              Mở ứng dụng ngân hàng và quét mã QR bên dưới để chuyển{' '}
              <strong className="text-accent">{finalTotal.toLocaleString('vi-VN')}đ</strong>{' '}
              với nội dung chuyển khoản <strong className="font-mono">#{orderCode}</strong>.
              Sau khi chuyển xong, bấm nút để hoàn tất đơn hàng.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-xs border border-border/80 flex items-center justify-center">
              <img src={qrUrl} alt="VietQR VietinBank" className="w-full h-full object-contain" />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              <span>{BANK_INFO.bankId} · {BANK_INFO.accountNo} · {BANK_INFO.accountName}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setQrConfirmOpen(false)}>
              Quay lại
            </Button>
            <Button
              className="flex-1 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
              onClick={() => placeOrder()}
            >
              Tôi đã chuyển khoản — Đặt hàng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
