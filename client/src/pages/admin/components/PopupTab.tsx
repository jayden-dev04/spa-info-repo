import { useState } from 'react'
import { 
  Megaphone, 
  Save, 
  Eye, 
  RotateCcw, 
  Sparkles, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Clock, 
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { DEFAULT_POPUP_CONFIG } from '@/components/PromoPopup'
import type { PopupConfig } from '@/components/PromoPopup'

const PRESET_IMAGES = [
  {
    name: 'Chăm sóc da mặt Facial',
    url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Massage đá nóng thảo dược',
    url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Gội đầu dưỡng sinh Đông Y',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Không gian thư giãn Spa',
    url: 'https://images.unsplash.com/photo-1512290900672-1f4869851604?auto=format&fit=crop&w=1200&q=80'
  }
]

export default function PopupTab() {
  const [config, setConfig] = useState<PopupConfig>(() => {
    const saved = localStorage.getItem('eva_spa_popup_config')
    return saved ? JSON.parse(saved) : DEFAULT_POPUP_CONFIG
  })

  const [hasChanges, setHasChanges] = useState(false)

  const handleUpdate = (updated: Partial<PopupConfig>) => {
    setConfig((prev) => ({ ...prev, ...updated }))
    setHasChanges(true)
  }

  const handleSave = () => {
    localStorage.setItem('eva_spa_popup_config', JSON.stringify(config))
    // Clear session and day flags so the admin can test immediately
    sessionStorage.removeItem('eva_spa_popup_shown')
    localStorage.removeItem('eva_spa_popup_last_shown')
    setHasChanges(false)
    toast.success('Đã lưu cấu hình Popup Giới Thiệu thành công!')
  }

  const handleReset = () => {
    if (confirm('Bạn có muốn đặt lại cấu hình Popup về mặc định?')) {
      setConfig(DEFAULT_POPUP_CONFIG)
      localStorage.setItem('eva_spa_popup_config', JSON.stringify(DEFAULT_POPUP_CONFIG))
      setHasChanges(false)
      toast.info('Đã khôi phục cấu hình mặc định')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
              <span>Thiết Lập Popup Giới Thiệu & Ưu Đãi</span>
              {config.enabled ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  🟢 Đang Kích Hoạt
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  🔴 Đã Tạm Tắt
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground">Tùy biến cửa sổ Popup nổi (Banner khuyến mãi) khi khách truy cập website</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="rounded-xl gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            className="rounded-xl gap-1.5 bg-primary hover:bg-primary/90 text-white font-semibold shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{hasChanges ? 'Lưu Thay Đổi *' : 'Đã Lưu'}</span>
          </Button>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Settings Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Trạng thái & Tần suất hiển thị */}
          <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/70 py-4 px-6">
              <CardTitle className="text-sm font-heading font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Trạng Thái & Quy Tắc Hiển Thị</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Enable / Disable Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
                <div>
                  <label className="text-sm font-bold text-foreground block">
                    Bật / Tắt Popup nổi trên website
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Khi bật, popup sẽ tự động xuất hiện với khách hàng truy cập website.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdate({ enabled: !config.enabled })}
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    config.enabled ? 'bg-primary justify-end' : 'bg-muted-foreground/30 justify-start'
                  }`}
                >
                  <span className="w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>

              {/* Delay & Frequency Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Thời gian trễ xuất hiện (Giây)
                  </label>
                  <select
                    value={config.delaySeconds}
                    onChange={(e) => handleUpdate({ delaySeconds: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value={1}>1 giây (Gần như ngay lập tức)</option>
                    <option value={2}>2 giây (Chuẩn khuyến nghị)</option>
                    <option value={3}>3 giây</option>
                    <option value={5}>5 giây</option>
                    <option value={8}>8 giây</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Tần suất xuất hiện cho mỗi khách
                  </label>
                  <select
                    value={config.frequency}
                    onChange={(e) => handleUpdate({ frequency: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="always">Luôn hiển thị (Mỗi lần mở web)</option>
                    <option value="once_per_session">1 lần mỗi phiên duyệt web</option>
                    <option value="once_per_day">1 lần mỗi ngày (Tránh làm phiền)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Nội dung & Thông điệp Popup */}
          <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/70 py-4 px-6">
              <CardTitle className="text-sm font-heading font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Nội Dung & Thông Điệp Ưu Đãi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Badge text */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Dòng chữ huy hiệu nhỏ phía trên (Badge)
                </label>
                <input
                  type="text"
                  value={config.badge}
                  onChange={(e) => handleUpdate({ badge: e.target.value })}
                  placeholder="Ví dụ: ƯU ĐÃI 30' CHĂM SÓC DA..."
                  className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary uppercase tracking-wider"
                />
              </div>

              {/* Headline Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Tiêu đề nổi bật chính (Headline / Giá sốc) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => handleUpdate({ title: e.target.value })}
                  placeholder="Ví dụ: CHỈ 199.000Đ, GIẢM 50%..."
                  className="w-full px-3.5 py-2.5 text-base font-heading font-bold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>

              {/* Subtitle / Conditions */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Điều kiện áp dụng & Mô tả ngắn
                </label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) => handleUpdate({ subtitle: e.target.value })}
                  placeholder="Ví dụ: Khi đặt kèm bất kỳ liệu trình dưỡng sinh chính..."
                  className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Footnote */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Ghi chú phụ dưới cùng
                </label>
                <input
                  type="text"
                  value={config.footnote}
                  onChange={(e) => handleUpdate({ footnote: e.target.value })}
                  placeholder="Ví dụ: *Giá chưa bao gồm 8% thuế VAT & phí dịch vụ"
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-muted-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Hình ảnh đại diện Popup */}
          <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/70 py-4 px-6">
              <CardTitle className="text-sm font-heading font-bold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>Hình Ảnh Minh Họa Banner</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_IMAGES.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleUpdate({ imageUrl: img.url })}
                    className={`relative rounded-xl overflow-hidden h-20 border-2 transition-all group ${
                      config.imageUrl === img.url
                        ? 'border-primary ring-2 ring-primary/30 shadow-md'
                        : 'border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs text-white text-[9px] truncate px-1 py-0.5 text-center font-medium">
                      {img.name}
                    </span>
                    {config.imageUrl === img.url && (
                      <div className="absolute top-1 right-1 bg-primary text-white p-0.5 rounded-full shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Hoặc dán đường dẫn hình ảnh (URL tùy chỉnh)
                </label>
                <input
                  type="text"
                  value={config.imageUrl}
                  onChange={(e) => handleUpdate({ imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-muted-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Nút Kêu Gọi Hành Động (CTA) */}
          <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/70 py-4 px-6">
              <CardTitle className="text-sm font-heading font-bold flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                <span>Nút Kêu Gọi Hành Động (CTA Buttons)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Chữ hiển thị trên Nút Đặt Lịch (CTA)
                  </label>
                  <input
                    type="text"
                    value={config.ctaText}
                    onChange={(e) => handleUpdate({ ctaText: e.target.value })}
                    placeholder="ĐẶT LỊCH NGAY, NHẬN ƯU ĐÃI..."
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Đường dẫn điều hướng khi bấm nút
                  </label>
                  <input
                    type="text"
                    value={config.ctaLink}
                    onChange={(e) => handleUpdate({ ctaLink: e.target.value })}
                    placeholder="/booking hoặc https://..."
                    className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Chữ nút từ chối đóng popup
                </label>
                <input
                  type="text"
                  value={config.dismissText}
                  onChange={(e) => handleUpdate({ dismissText: e.target.value })}
                  placeholder="KHÔNG, CẢM ƠN, ĐỂ SAU..."
                  className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Interactive Mockup (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-primary" />
              <span>Xem Trước Trực Quan (Live Preview)</span>
            </span>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <span>Xem trên trang chủ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Device Mockup Canvas */}
          <div className="p-6 bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col items-center justify-center min-h-[580px]">
            {/* The Popup Mockup Window */}
            <div className="relative w-full max-w-[340px] bg-[#ddd7ce] dark:bg-stone-900 rounded-[26px] overflow-hidden shadow-2xl border border-[#c4baa9]/60 font-sans">
              {/* Fake Close X */}
              <div className="absolute top-3.5 right-3.5 z-20 w-7 h-7 rounded-full bg-black/45 text-white flex items-center justify-center backdrop-blur-md">
                <X className="w-3.5 h-3.5 text-white/90" />
              </div>

              {/* Hero Image */}
              <div className="relative h-[290px] w-full overflow-hidden">
                <img
                  src={config.imageUrl}
                  alt={config.title}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#ddd7ce] via-[#ddd7ce]/20 to-black/10 dark:from-stone-900" />

                {/* Floating Gold Border Offer Box */}
                <div className="absolute inset-x-3.5 bottom-1.5 bg-[#fcfbfa]/95 dark:bg-stone-800/95 backdrop-blur-md px-3.5 py-3.5 rounded-xl border border-[#bfa47d]/70 shadow-lg text-center">
                  {config.badge && (
                    <p className="font-serif text-[10px] font-semibold tracking-[0.2em] uppercase text-[#473b2d] dark:text-stone-300">
                      {config.badge}
                    </p>
                  )}

                  <h3 className="font-serif text-2xl font-normal text-[#1f1b16] dark:text-stone-100 tracking-tight my-0.5 leading-none">
                    {config.title || 'CHỈ 199.000Đ'}
                  </h3>

                  {config.subtitle && (
                    <p className="font-serif italic text-[11px] text-[#635748] dark:text-stone-400 mt-0.5 line-clamp-1">
                      {config.subtitle}
                    </p>
                  )}

                  <div className="pt-1.5">
                    <span className="inline-block py-1 px-3 rounded-full bg-[#211e1a] text-[#f7f4ee] text-[8px] font-bold uppercase tracking-[0.15em]">
                      ĐẶT LỊCH HẸN HÔM NAY
                    </span>
                  </div>

                  {config.footnote && (
                    <p className="text-[8px] text-[#918576] dark:text-stone-500 pt-1">
                      {config.footnote}
                    </p>
                  )}

                  <div className="pt-1.5 flex flex-col items-center justify-center">
                    <svg className="w-5 h-5 text-[#ab8752]" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M32 12 C32 12 37 22 37 32 C37 40 32 44 32 44 C32 44 27 40 27 32 C27 22 32 12 32 12 Z" />
                      <path d="M32 20 C32 20 44 24 47 34 C49 40 43 44 35 44" />
                      <path d="M32 20 C32 20 20 24 17 34 C15 40 21 44 29 44" />
                    </svg>
                    <span className="text-[7px] font-serif font-bold tracking-[0.25em] text-[#8c6b3e] uppercase mt-0.5">
                      EVA SPA CLINIC &bull; TỪ NĂM 2018
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3.5 pt-2.5 space-y-2 bg-[#ddd7ce] dark:bg-stone-900 text-center">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#7c5035] text-white font-serif font-bold text-xs tracking-[0.16em] uppercase shadow-md"
                >
                  {config.ctaText || 'ĐẶT LỊCH NGAY'}
                </button>

                {config.dismissText && (
                  <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-[#5c5246] underline underline-offset-4 block">
                    {config.dismissText}
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-4 text-center">
              Khung xem trước mô phỏng giao diện popup thực tế khi người dùng vào web.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
