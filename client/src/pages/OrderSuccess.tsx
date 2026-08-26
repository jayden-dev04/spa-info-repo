import { useLocation, Link, Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, QrCode, Copy, ShoppingBag, ArrowRight, Home, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export default function OrderSuccess() {
  const location = useLocation()
  const order = location.state

  if (!order) {
    return <Navigate to="/shop" replace />
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Đã sao chép ${label}!`, { description: text })
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl font-sans">
      
      {/* Header Banner */}
      <div className="text-center mb-8 space-y-3">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs animate-in zoom-in-75 duration-300">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary">
          Đặt Hàng Thành Công!
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Cảm ơn bạn đã tin chọn các sản phẩm chăm sóc thảo mộc tại Eva Spa. Đơn hàng của bạn đang được chuẩn bị để giao đến tay bạn.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Order Code & General Info */}
        <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden bg-secondary/20">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Mã đơn hàng</span>
              <h2 className="text-2xl font-serif font-bold text-primary mt-0.5">#{order.orderCode}</h2>
              <p className="text-xs text-muted-foreground mt-1">Ngày đặt: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>

            <div className="flex flex-col items-center sm:items-end">
              <span className="text-xs text-muted-foreground">Tổng tiền thanh toán</span>
              <span className="text-2xl font-bold text-accent">{(order.totalAmount || 0).toLocaleString('vi-VN')}đ</span>
              <span className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                {order.paymentMethod === 'vietqr' ? 'Chuyển khoản VietQR' : 'Thanh toán COD khi nhận hàng'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* VietQR Bank Transfer Box (If VietQR selected) */}
        {order.paymentMethod === 'vietqr' && (
          <Card className="rounded-2xl border-2 border-accent/40 shadow-md overflow-hidden bg-card">
            <CardHeader className="bg-accent/10 pb-4 border-b border-accent/20">
              <div className="flex items-center gap-2 text-primary font-serif font-bold text-lg">
                <QrCode className="w-5 h-5 text-accent" />
                <span>Quét Mã VietQR Chuyển Khoản Nhanh</span>
              </div>
              <CardDescription className="text-xs">
                Mở ứng dụng ngân hàng bất kỳ để quét mã QR tự động điền STK, số tiền và nội dung chuyển khoản.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                {/* QR Image */}
                <div className="w-52 h-52 bg-white p-3 rounded-2xl shadow-sm border border-border shrink-0 flex items-center justify-center">
                  <img
                    src={order.qrUrl}
                    alt="VietQR VietinBank"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Account Details */}
                <div className="w-full space-y-3 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-secondary/50 border border-border/60">
                    <span className="text-muted-foreground">Ngân hàng:</span>
                    <strong className="text-foreground text-sm font-semibold">VietinBank (Việt Nam Công Thương)</strong>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-secondary/50 border border-border/60">
                    <span className="text-muted-foreground">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <strong className="text-primary font-mono text-base">{order.bankInfo?.accountNo || '0364911491'}</strong>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(order.bankInfo?.accountNo || '0364911491', 'Số tài khoản')}
                        className="h-7 px-2 text-xs cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-secondary/50 border border-border/60">
                    <span className="text-muted-foreground">Chủ tài khoản:</span>
                    <strong className="text-foreground uppercase font-bold">{order.bankInfo?.accountName || 'TRAN TRUNG KIEN'}</strong>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-secondary/50 border border-border/60">
                    <span className="text-muted-foreground">Số tiền:</span>
                    <div className="flex items-center gap-2">
                      <strong className="text-accent font-bold text-base">{(order.totalAmount || 0).toLocaleString('vi-VN')}đ</strong>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(order.totalAmount.toString(), 'Số tiền')}
                        className="h-7 px-2 text-xs cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-accent/15 border border-accent/30">
                    <span className="text-accent font-semibold">Nội dung CK:</span>
                    <div className="flex items-center gap-2">
                      <strong className="text-primary font-mono text-sm">{order.orderCode}</strong>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(order.orderCode, 'Nội dung chuyển khoản')}
                        className="h-7 px-2 text-xs text-primary cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-center text-muted-foreground bg-secondary/40 p-3 rounded-xl">
                ⏳ Sau khi bạn chuyển khoản thành công, hệ thống sẽ tự động đối soát và chuẩn bị đóng gói hàng gửi đi trong ngày.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shipping details */}
        <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-secondary/30 pb-3 border-b border-border/60">
            <CardTitle className="text-base font-serif font-bold text-primary flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <span>Thông Tin Nhận Hàng</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-xs sm:text-sm space-y-2 text-muted-foreground">
            <p>Người nhận: <strong className="text-foreground">{order.customerName}</strong></p>
            <p>Số điện thoại: <strong className="text-foreground">{order.phone}</strong></p>
            {order.email && <p>Email: <strong className="text-foreground">{order.email}</strong></p>}
            <p>Địa chỉ giao hàng: <strong className="text-foreground">{order.address}</strong></p>
          </CardContent>
        </Card>

        {/* Ordered items */}
        <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-secondary/30 pb-3 border-b border-border/60">
            <CardTitle className="text-base font-serif font-bold text-primary flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-accent" />
              <span>Sản Phẩm Đã Đặt</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 divide-y divide-border/60">
            {order.items?.map((item: any) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover bg-secondary shrink-0 border border-border" />
                  <div>
                    <h4 className="font-medium text-xs sm:text-sm text-foreground line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">Số lượng: {item.quantity} x {item.price?.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
                <span className="font-bold text-xs sm:text-sm text-accent">
                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto rounded-xl gap-2 text-xs py-5 px-6">
              <Home className="w-4 h-4" />
              <span>Về Trang Chủ</span>
            </Button>
          </Link>
          <Link to="/shop" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 text-xs py-5 px-6 shadow-md">
              <ShoppingBag className="w-4 h-4" />
              <span>Tiếp Tục Mua Sắm</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}
