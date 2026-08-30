import { useState, useEffect } from 'react'
import { getCachedPopupConfig, fetchPopupConfig } from '@/lib/siteConfig'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

export interface PopupConfig {
  enabled: boolean
  badge: string
  title: string
  subtitle: string
  highlightPrice: string
  imageUrl: string
  ctaText: string
  ctaLink: string
  dismissText: string
  footnote: string
  delaySeconds: number
  frequency: 'always' | 'once_per_day' | 'once_per_session'
  showOnMobile: boolean
  couponCode?: string
  couponLabel?: string
  couponExpiresAt?: string
}

type TimerId = ReturnType<typeof setTimeout>

export const DEFAULT_POPUP_CONFIG: PopupConfig = {
  enabled: true,
  badge: "ƯU ĐÃI 30' CHĂM SÓC DA",
  title: "CHỈ 199.000Đ",
  subtitle: "Khi đặt kèm bất kỳ liệu trình dưỡng sinh chính",
  highlightPrice: "199K",
  imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
  ctaText: "ĐẶT LỊCH NGAY",
  ctaLink: "/booking",
  dismissText: "KHÔNG, CẢM ƠN",
  footnote: "*Giá chưa bao gồm 8% thuế VAT & phí dịch vụ",
  delaySeconds: 1.5,
  frequency: 'always',
  showOnMobile: true,
  // Mã vận hành ngay — người dùng bấm "Sao chép" là dán được vào ô mã giảm giá ở Checkout
  couponCode: 'T7SPRING',
  couponLabel: "Ưu đãi tháng này: Tặng kèm 30' chăm sóc da chỉ 199K khi đặt liệu trình chính",
  couponExpiresAt: '31/08/2026',
}

export default function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<PopupConfig>(DEFAULT_POPUP_CONFIG)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    let timer: TimerId | null = null
    ;(async () => {
      // Nguồn sự thật: Supabase popup_configs (cache local chỉ là bước đệm offline)
      let activeConfig = getCachedPopupConfig()
      const parsed = await fetchPopupConfig()
      if (cancelled) return
      activeConfig = parsed
      setConfig(activeConfig)

      if (!activeConfig.enabled) return

      // Frequency check
      if (activeConfig.frequency === 'once_per_session') {
        if (sessionStorage.getItem('eva_spa_popup_shown')) return
      } else if (activeConfig.frequency === 'once_per_day') {
        const lastShown = localStorage.getItem('eva_spa_popup_last_shown')
        if (lastShown) {
          const lastDate = new Date(lastShown).toDateString()
          const today = new Date().toDateString()
          if (lastDate === today) return
        }
      }

      timer = setTimeout(() => {
        setIsOpen(true)
        if (activeConfig.frequency === 'once_per_session') {
          sessionStorage.setItem('eva_spa_popup_shown', 'true')
        } else if (activeConfig.frequency === 'once_per_day') {
          localStorage.setItem('eva_spa_popup_last_shown', new Date().toISOString())
        }
      }, (activeConfig.delaySeconds || 1.5) * 1000)
    })()
    return () => { cancelled = true; clearTimeout(timer as any) }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleCtaClick = () => {
    setIsOpen(false)
    if (config.ctaLink.startsWith('http')) {
      window.open(config.ctaLink, '_blank')
    } else {
      navigate(config.ctaLink)
    }
  }

  if (!isOpen || !config.enabled) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Backdrop Dismiss */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Luxury Spa Modal Card Container */}
      <div 
        className="relative w-full max-w-[370px] sm:max-w-[400px] bg-[#ddd7ce] dark:bg-stone-900 rounded-[28px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)] border border-[#c4baa9]/60 dark:border-stone-800 z-10 animate-in zoom-in-95 duration-300 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimalist Close Button X */}
        <button
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md cursor-pointer group"
          title="Đóng"
        >
          <X className="w-4 h-4 text-white/90 group-hover:scale-110 transition-transform" />
        </button>

        {/* Top Hero Image Area with Seamless Bottom Blend */}
        <div className="relative h-[320px] sm:h-[350px] w-full overflow-hidden">
          <img
            src={config.imageUrl}
            alt={config.title}
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle warm luxury vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#ddd7ce] via-[#ddd7ce]/20 to-black/10 dark:from-stone-900 dark:via-stone-900/20" />

          {/* Floating Gold Frame Luxury Offer Box (Exact Match with Reference) */}
          <div className="absolute inset-x-4 bottom-2 bg-[#fcfbfa]/95 dark:bg-stone-800/95 backdrop-blur-md px-4 py-4 sm:px-5 sm:py-5 rounded-xl border border-[#bfa47d]/70 shadow-lg text-center">
            {/* Badge */}
            {config.badge && (
              <p className="font-serif text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-[#473b2d] dark:text-stone-300">
                {config.badge}
              </p>
            )}

            {/* Huge Headline Title in Elegant Serif */}
            <h3 className="font-serif text-3xl sm:text-4xl font-normal text-[#1f1b16] dark:text-stone-100 tracking-tight my-0.5 leading-none">
              {config.title}
            </h3>

            {/* Subtitle / Details */}
            {config.subtitle && (
              <p className="font-serif italic text-xs sm:text-[13px] text-[#635748] dark:text-stone-400 mt-1">
                {config.subtitle}
              </p>
            )}

            {/* Dark Black Luxury Pill CTA */}
            <div className="pt-2">
              <span className="inline-block py-1.5 px-4 rounded-full bg-[#211e1a] text-[#f7f4ee] text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] shadow-xs">
                ĐẶT LỊCH HẸN HÔM NAY
              </span>
            </div>

            {/* Footnote */}
            {config.footnote && (
              <p className="text-[9px] text-[#918576] dark:text-stone-500 pt-1.5">
                {config.footnote}
              </p>
            )}

            {/* Coupon code (admin-configurable) */}
            {config.couponCode && (
              <div className="pt-1.5">
                <p className="text-[10px] text-[#635748] dark:text-stone-400">
                  {config.couponLabel || 'Mã giảm giá dành cho bạn'}
                </p>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard?.writeText(config.couponCode || '') }}
                  className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-[#bfa47d] bg-white/70 dark:bg-stone-900/50 text-[#7c5035] dark:text-amber-300 font-mono font-bold tracking-wider text-sm"
                  title="Bấm để sao chép mã"
                >
                  {config.couponCode}
                  <span className="text-[9px] font-sans font-semibold uppercase tracking-wider text-[#918576]">
                    sao chép
                  </span>
                </button>
                {config.couponExpiresAt && (
                  <p className="text-[9px] text-[#918576] pt-1">
                    Hạn dùng: {config.couponExpiresAt}
                  </p>
                )}
              </div>
            )}

            {/* Elegant Line-Art Gold Lotus Logo */}
            <div className="pt-2 flex flex-col items-center justify-center">
              <svg className="w-7 h-7 text-[#ab8752]" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M32 12 C32 12 37 22 37 32 C37 40 32 44 32 44 C32 44 27 40 27 32 C27 22 32 12 32 12 Z" />
                <path d="M32 20 C32 20 44 24 47 34 C49 40 43 44 35 44" />
                <path d="M32 20 C32 20 20 24 17 34 C15 40 21 44 29 44" />
                <path d="M32 27 C32 27 49 32 53 40 C55 44 47 46 39 46" />
                <path d="M32 27 C32 27 15 32 11 40 C9 44 17 46 25 46" />
                <path d="M26 49 C28 50 36 50 38 49" />
              </svg>
              <span className="text-[8px] font-serif font-bold tracking-[0.25em] text-[#8c6b3e] dark:text-amber-400 uppercase mt-0.5">
                EVA SPA CLINIC
              </span>
              <span className="text-[7px] text-[#9c8973] tracking-widest">
                TỪ NĂM 2018
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Actions Section */}
        <div className="p-4 sm:p-5 pt-3 space-y-2.5 bg-[#ddd7ce] dark:bg-stone-900 text-center">
          {/* Main Terracotta Wood Button */}
          <button
            onClick={handleCtaClick}
            className="w-full py-3 px-6 rounded-xl bg-[#7c5035] hover:bg-[#684128] text-white font-serif font-bold text-sm tracking-[0.18em] uppercase shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            {config.ctaText || 'BOOK NOW'}
          </button>

          {/* Dismiss Text */}
          {config.dismissText && (
            <button
              onClick={handleClose}
              className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#5c5246] hover:text-[#241f19] dark:text-stone-400 dark:hover:text-stone-200 underline underline-offset-4 transition-colors cursor-pointer py-0.5 block w-full"
            >
              {config.dismissText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
