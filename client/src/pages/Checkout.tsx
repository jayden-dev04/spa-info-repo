import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Leaf, ArrowLeft, ShieldCheck, Truck, Banknote, QrCode, Sparkles, CheckCircle2, Trash2, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { API_BASE } from '@/lib/api'
import { useVietnamGeo, useWards } from '@/lib/useVietnamGeo'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getCachedPopupConfig, fetchPopupConfig } from '@/lib/siteConfig'

// Danh sách ngân hàng chọn được — mỗi mã đơn gắn với MỘT tài khoản
// VietQR thật (theo PROJECT_OVERVIEW), nên chọn ngân hàng chỉ đổi logo/
// nhãn hiển thị; qrUrl luôn dùng tài khoản thật BANK_INFO.
const BANK_OPTIONS = [
  { bankId: 'VietinBank', label: 'VietinBank (Việt Nam Công Thương)', short: 'VietinBank', logo: 'https://cdn.vietqr.io/img/ICB.png' },
  { bankId: 'Vietcombank', label: 'Vietcombank', short: 'Vietcombank', logo: 'https://cdn.vietqr.io/img/VCB.png' },
  { bankId: 'MB', label: 'MB Bank', short: 'MB Bank', logo: 'https://cdn.vietqr.io/img/MB.png' },
  { bankId: 'Techcombank', label: 'Techcombank', short: 'Techcombank', logo: 'https://cdn.vietqr.io/img/TCB.png' },
  { bankId: 'BIDV', label: 'BIDV', short: 'BIDV', logo: 'https://cdn.vietqr.io/img/BIDV.png' },
  { bankId: 'ACB', label: 'ACB', short: 'ACB', logo: 'https://cdn.vietqr.io/img/ACB.png' },
] as const

const BANK_INFO = {
  bankId: 'VietinBank',
  accountNo: '0364911491',
  accountName: 'TRAN TRUNG KIEN',
}

const FREESHIP_THRESHOLD = 500000
const STANDARD_SHIPPING_FEE = 30000

export default function Checkout() {
  const { cart, totalAmount, clearCart, updateQuantity, removeFromCart } = useCart()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vietqr'>('vietqr')
  const [qrConfirmOpen, setQrConfirmOpen] = useState(false)
  // Mã giảm giá — khớp eva_spa_popup_config (admin PopupTab / banner Ưu đãi tháng này)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [couponError, setCouponError] = useState('')
  const [selectedBank, setSelectedBank] = useState<(typeof BANK_OPTIONS)[number]['bankId']>('VietinBank')
  // Địa danh VN — tỉnh/thành + phường/xã load từ DB (vietnam_provinces/vietnam_wards)
  const { provinces, provincesLoading } = useVietnamGeo()
  const [provinceCode, setProvinceCode] = useState<number | null>(null)
  const [wardCode, setWardCode] = useState<number | null>(null)
  const { wards, wardsLoading } = useWards(provinceCode)
  const selectedProvince = provinces.find((p) => p.code === provinceCode)
  const selectedWard = wards.find((w) => w.code === wardCode)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    district: '',
    address: '',
    notes: '',
  })

  // Coupon hợp lệ lấy từ cùng nguồn với banner: Supabase popup_configs (admin PopupTab)
  const [dbCoupon, setDbCoupon] = useState<{ code: string; label: string } | null>(null)
  const activeCoupon = useMemo(() => {
    const cfg = dbCoupon ? dbCoupon : (() => {
      const c = getCachedPopupConfig()
      return { code: (c.couponCode || '').toUpperCase(), label: c.couponLabel || 'Mã giảm giá' }
    })()
    return cfg
  }, [dbCoupon])
  useEffect(() => {
    fetchPopupConfig().then((cfg) =>
      setDbCoupon({ code: (cfg.couponCode || '').toUpperCase(), label: cfg.couponLabel || 'Mã giảm giá' }),
    )
  }, [])
  const discount = appliedCoupon && appliedCoupon === activeCoupon.code ? Math.min(100000, Math.round(totalAmount * 0.1)) : 0
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
  const finalTotal = totalAmount + shippingFee - discount

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) { setCouponError('Bạn chưa nhập mã giảm giá.'); return }
    if (code !== activeCoupon.code) { setCouponError(`Mã "${code}" không hợp lệ hoặc đã hết hạn.`); return }
    setCouponError('')
    setAppliedCoupon(code)
    toast.success('Áp dụng mã giảm giá thành công!', { description: 'Giảm 10% tối đa 100.000đ cho đơn này.' })
  }

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
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim() || !provinceCode || !wardCode) {
      toast.error('Vui lòng điền đầy đủ Họ tên, Số điện thoại, Tỉnh/Phường và Địa chỉ chi tiết.')
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

    const fullAddress = `${formData.address}, ${selectedWard?.name ?? ''}, ${selectedProvince?.name ?? ''}`

    const payload = {
      customer_name: formData.fullName,
      customer_phone: formData.phone,
      customer_email: formData.email || `${formData.phone}@guest.evaspa.vn`,
      customer_address: fullAddress,
      total_amount: finalTotal,
      shipping_fee: shippingFee,
      notes: formData.notes + (appliedCoupon && discount > 0 ? `${formData.notes ? ' | ' : ''}[coupon:${appliedCoupon} -${discount.toLocaleString('vi-VN')}đ]` : ''),
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
              <CardHeader className="bg-secondary/30 px-5 sm:px-6 py-5 border-b border-border/60">
                <CardTitle className="text-lg font-serif font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-sans font-bold">1</span>
                  <span>Địa Chỉ Nhận Hàng</span>
                </CardTitle>
                <CardDescription>
                  Vui lòng cung cấp chính xác để chuyên viên giao hàng tận nơi nhanh chóng.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 sm:px-6 pt-5 pb-6 space-y-4">
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
                    <Label htmlFor="province" className="text-xs font-semibold text-foreground/90">
                      Tỉnh / Thành phố *
                    </Label>
                    <select
                      id="province"
                      value={provinceCode ?? ''}
                      onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : null
                        setProvinceCode(v)
                        setWardCode(null)
                        setFormData((prev) => ({ ...prev, city: v ? (provinces.find((p) => p.code === v)?.name ?? '') : '', district: '' }))
                      }}
                      className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
                      disabled={provincesLoading}
                    >
                      <option value="">{provincesLoading ? 'Đang tải tỉnh/thành...' : '— Chọn tỉnh/thành —'}</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ward" className="text-xs font-semibold text-foreground/90">
                      Phường / Xã *
                    </Label>
                    <select
                      id="ward"
                      value={wardCode ?? ''}
                      onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : null
                        setWardCode(v)
                        setFormData((prev) => ({ ...prev, district: v ? (wards.find((w) => w.code === v)?.name ?? '') : '' }))
                      }}
                      className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
                      disabled={!provinceCode || wardsLoading}
                    >
                      <option value="">
                        {!provinceCode ? '— Chọn tỉnh trước —' : wardsLoading ? 'Đang tải phường/xã...' : '— Chọn phường/xã —'}
                      </option>
                      {wards.map((w) => (
                        <option key={w.code} value={w.code}>{w.name}</option>
                      ))}
                    </select>
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
              <CardHeader className="bg-secondary/30 px-5 sm:px-6 py-5 border-b border-border/60">
                <CardTitle className="text-lg font-serif font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-sans font-bold">2</span>
                  <span>Phương Thức Thanh Toán</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 sm:px-6 pt-5 pb-6 space-y-3">
                
                {/* VietQR Option */}
                <div 
                  onClick={() => setPaymentMethod('vietqr')}
                  className={`rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
                    paymentMethod === 'vietqr'
                      ? 'border-primary shadow-md'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  {/* Header lựa chọn */}
                  <div className={`flex items-start gap-3 p-4 sm:p-5 ${paymentMethod === 'vietqr' ? 'bg-primary/5' : ''}`}>
                    <span
                      aria-hidden
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                        paymentMethod === 'vietqr' ? 'border-primary' : 'border-border'
                      }`}
                    >
                      {paymentMethod === 'vietqr' && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </span>
                    <QrCode className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-foreground text-sm sm:text-base leading-snug">
                          Chuyển Khoản Ngân Hàng Tự Động (VietQR)
                        </span>
                        <span className="bg-accent/15 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wide">
                          Khuyên Dùng
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        Quét mã QR qua mọi ứng dụng ngân hàng. Tiền vào tài khoản tức thì, xác nhận đơn tự động.
                      </p>
                    </div>
                  </div>

                  {/* Chi tiết chuyển khoản */}
                  {paymentMethod === 'vietqr' && (
                    <div className="border-t border-border/60 p-4 sm:p-5 bg-background animate-in fade-in">
                      <div className="flex flex-col md:flex-row gap-5">

                        {/* QR + logo ngân hàng đang chọn */}
                        <div className="shrink-0 flex flex-col items-center gap-2.5 mx-auto md:mx-0">
                          <div className="w-44 h-44 bg-white p-2.5 rounded-xl border-2 border-primary/25 shadow-sm flex items-center justify-center">
                            <img
                              src={qrUrl}
                              alt="Mã VietQR"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                            <img
                              src={BANK_OPTIONS.find(b => b.bankId === selectedBank)?.logo}
                              alt=""
                              className="w-4 h-4 object-contain"
                            />
                            {BANK_OPTIONS.find(b => b.bankId === selectedBank)?.short}
                          </div>
                        </div>

                        {/* Thông tin ngân hàng */}
                        <div className="flex-1 min-w-0 space-y-4">
                          
                          {/* Chọn ngân hàng — grid logo lớn */}
                          <div>
                            <p className="text-xs font-semibold text-foreground/90 mb-2">Chọn ngân hàng của bạn:</p>
                            <div className="grid grid-cols-3 gap-2.5">
                              {BANK_OPTIONS.map((b) => (
                                <button
                                  key={b.bankId}
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedBank(b.bankId) }}
                                  aria-pressed={selectedBank === b.bankId}
                                  className={`rounded-xl border-2 bg-white py-2.5 px-2 flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                    selectedBank === b.bankId
                                      ? 'border-primary shadow-sm bg-primary/5'
                                      : 'border-border hover:border-primary/50 hover:shadow-xs'
                                  }`}
                                >
                                  <span className="w-12 h-9 flex items-center justify-center">
                                    <img src={b.logo} alt="" className="max-w-full max-h-full object-contain" loading="lazy" />
                                  </span>
                                  <span className={`text-[10px] font-semibold leading-tight text-center truncate w-full ${selectedBank === b.bankId ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {b.short}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Bảng thông tin tài khoản */}
                          <div className="rounded-xl border border-border bg-secondary/30 divide-y divide-border/50 overflow-hidden">
                            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                              <span className="text-xs text-muted-foreground">Ngân hàng</span>
                              <strong className="text-xs text-foreground flex items-center gap-1.5">
                                <img src={BANK_OPTIONS.find(b => b.bankId === selectedBank)?.logo} alt="" className="w-4 h-4 object-contain" />
                                {BANK_OPTIONS.find(b => b.bankId === selectedBank)?.short}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                              <span className="text-xs text-muted-foreground">Số tài khoản</span>
                              <strong className="flex items-center gap-1.5">
                                <span className="text-sm font-mono font-bold text-primary tracking-wide">{BANK_INFO.accountNo}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard?.writeText(BANK_INFO.accountNo)
                                    toast.success('Đã copy số tài khoản!')
                                  }}
                                  title="Copy số tài khoản"
                                  className="text-[10px] font-bold text-accent border border-accent/40 bg-accent/10 hover:bg-accent/20 rounded-md px-2 py-0.5 transition-colors cursor-pointer"
                                >
                                  Copy
                                </button>
                              </strong>
                            </div>
                            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                              <span className="text-xs text-muted-foreground">Chủ tài khoản</span>
                              <strong className="text-xs font-bold text-foreground uppercase tracking-wide">{BANK_INFO.accountName}</strong>
                            </div>
                            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-accent/5">
                              <span className="text-xs font-semibold text-foreground/80">Số tiền cần chuyển</span>
                              <strong className="text-sm font-bold text-accent">{finalTotal.toLocaleString('vi-VN')}đ</strong>
                            </div>
                          </div>

                          <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            Vui lòng chuyển đúng số tiền và nội dung <strong className="font-mono">#{orderCode}</strong> để hệ thống đối soát tự động.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* COD Option */}
                <div 
                  onClick={() => setPaymentMethod('cod')}
                  className={`rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
                    paymentMethod === 'cod'
                      ? 'border-primary shadow-md'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className={`flex items-start gap-3 p-4 sm:p-5 ${paymentMethod === 'cod' ? 'bg-primary/5' : ''}`}>
                    <span
                      aria-hidden
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                        paymentMethod === 'cod' ? 'border-primary' : 'border-border'
                      }`}
                    >
                      {paymentMethod === 'cod' && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </span>
                    <Banknote className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="font-serif font-bold text-foreground text-sm sm:text-base leading-snug">
                        Thanh Toán Tiền Mặt Khi Nhận Hàng (COD)
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        Bạn thanh toán bằng tiền mặt cho shipper khi nhận và kiểm tra kiện hàng tại nhà.
                      </p>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: Order Summary & Submit (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="rounded-2xl border-border/80 shadow-md sticky top-24 overflow-hidden gap-0 py-0">
              <CardHeader className="bg-secondary/40 px-5 sm:px-6 py-5 border-b border-border/60">
                <CardTitle className="text-lg font-serif font-bold text-primary flex items-center justify-between">
                  <span>Tóm Tắt Đơn Hàng</span>
                  <span className="text-xs font-sans font-semibold text-muted-foreground">
                    ({cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm)
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="px-5 sm:px-6 pt-4 pb-6 space-y-4">
                {/* Items List — có +/- số lượng và nút xoá */}
                <div className="max-h-80 overflow-y-auto pr-1 divide-y divide-border/40">
                  {cart.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover bg-secondary shrink-0 border border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-xs text-foreground line-clamp-2 leading-snug">
                            {item.name}
                          </h4>
                          <button
                            type="button"
                            title="Xoá khỏi giỏ"
                            onClick={() => { removeFromCart(item.id); toast.info(`Đã xoá "${item.name}" khỏi đơn`) }}
                            className="shrink-0 text-muted-foreground/60 hover:text-destructive transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          {/* Bộ chỉnh số lượng */}
                          <div className="inline-flex items-center border border-border rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                              title="Giảm số lượng"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-foreground select-none">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                              title="Tăng số lượng"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-bold text-accent text-xs">
                            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mã giảm giá */}
                <div className="border-t border-border/60 pt-3">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono font-bold text-emerald-700">{appliedCoupon}</span>
                        <span className="text-emerald-600">−{discount.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <button type="button" onClick={() => { setAppliedCoupon(null); setCouponInput('') }} className="text-[11px] text-muted-foreground hover:text-destructive underline">
                        Bỏ mã
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <Input
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value); setCouponError('') }}
                          placeholder={`Mã giảm giá (${activeCoupon.code || 'VD: T7SPRING'})`}
                          className="h-9 rounded-xl"
                        />
                        <Button type="button" variant="outline" onClick={handleApplyCoupon} className="rounded-xl h-9 px-4 text-xs font-bold shrink-0">
                          Áp dụng
                        </Button>
                      </div>
                      {couponError && <p className="text-[11px] text-destructive font-medium">{couponError}</p>}
                    </div>
                  )}
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
                  {appliedCoupon && discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Giảm giá ({appliedCoupon}):</span>
                      <span>−{discount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
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
              <img src={qrUrl} alt={`VietQR ${selectedBank}`} className="w-full h-full object-contain" />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              <span className="flex items-center gap-1.5 justify-center"><img src={BANK_OPTIONS.find(b=>b.bankId===selectedBank)?.logo} alt="" className="w-4 h-4 object-contain" />{BANK_OPTIONS.find(b=>b.bankId===selectedBank)?.label} · {BANK_INFO.accountNo} · {BANK_INFO.accountName}</span>
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