import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Leaf, Sparkles, Clock, Star, ShieldCheck, HeartHandshake, Flower2, ArrowRight } from 'lucide-react'
import heroImg from '@/assets/images/hero.jpg'
import facialImg from '@/assets/images/service_facial.jpg'
import lipsImg from '@/assets/images/service_lips.jpg'
import massageImg from '@/assets/images/service_massage.jpg'

export default function Home() {
  const services = [
    {
      title: 'Gội Đầu Dưỡng Sinh Thảo Dược',
      subtitle: 'Thư giãn vùng đầu & đả thông kinh lạc',
      desc: 'Nấu từ bồ kết, sả, vỏ bưởi tươi mỗi ngày kết hợp bài massage cổ vai gáy giải tỏa căng thẳng tức thì.',
      duration: '60 - 75 Phút',
      price: '199.000đ',
      tag: 'Được yêu thích nhất',
      img: massageImg,
    },
    {
      title: 'Chăm Sóc & Phục Hồi Da Thảo Mộc',
      subtitle: 'Nuôi dưỡng làn da sáng khỏe tự nhiên',
      desc: 'Thanh lọc độc tố, cấp ẩm sâu với mặt nạ thảo dược hữu cơ và kỹ thuật massage nâng cơ trẻ hóa.',
      duration: '75 Phút',
      price: '350.000đ',
      tag: 'Thảo mộc 100%',
      img: facialImg,
    },
    {
      title: 'Massage Body Đá Nóng Himalaya',
      subtitle: 'Xua tan nhức mỏi toàn thân',
      desc: 'Nhiệt lượng từ đá muối khoáng Himalaya kết hợp tinh dầu trị liệu giúp lưu thông khí huyết, ngủ ngon giấc.',
      duration: '90 Phút',
      price: '420.000đ',
      tag: 'Trị liệu chuyên sâu',
      img: lipsImg,
    }
  ]

  const highlights = [
    {
      icon: Leaf,
      title: 'Thảo Mộc Nấu Tươi Mỗi Ngày',
      desc: 'Chiết xuất từ bồ kết, hương nhu, vỏ bưởi, gừng tươi tự nhiên không chất bảo quản.'
    },
    {
      icon: HeartHandshake,
      title: 'Kỹ Thuật Viên Tận Tâm',
      desc: 'Kỹ thuật ấn huyệt chuẩn xác, lực tay êm ái mang lại sự giải tỏa và thư giãn tối đa.'
    },
    {
      icon: Flower2,
      title: 'Không Gian Chuẩn Thiền',
      desc: 'Hương thơm tinh dầu dịu nhẹ, âm thanh suối reo và tiếng chuông xoay tĩnh tâm.'
    },
    {
      icon: ShieldCheck,
      title: 'Chuẩn Vệ Sinh Vô Trùng',
      desc: 'Khăn trải và dụng cụ được tiệt trùng riêng biệt cho từng khách hàng trước mỗi liệu trình.'
    }
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center text-center text-white overflow-hidden bg-primary">
        {/* Background Image with rich botanical overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            alt="Eva Spa Hero" 
            className="w-full h-full object-cover brightness-[0.4] scale-105 transition-transform duration-1000" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-primary/75 to-primary/95"></div>
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10 max-w-4xl">
          {/* Botanical Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/25 px-4 py-1.5 rounded-full text-white text-xs md:text-sm font-medium tracking-wide mb-6 shadow-sm">
            <Leaf className="w-4 h-4 text-accent" />
            <span>100% Thảo Mộc Tự Nhiên & Dưỡng Sinh Trị Liệu</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold mb-6 tracking-tight leading-tight drop-shadow-md text-white">
            Thanh Lọc Thân Tâm, <br className="hidden sm:inline" />
            Đánh Thức Vẻ Đẹp Thuần Khiết
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-stone-200 mb-10 max-w-2xl mx-auto font-normal leading-relaxed">
            Trải nghiệm không gian dưỡng sinh an yên, các liệu trình massage ấn huyệt đả thông kinh lạc và chăm sóc da bằng thảo dược thiên nhiên tại Cần Thơ.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/booking" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-base">
                <Sparkles className="w-5 h-5 mr-2" />
                Đặt Lịch Trải Nghiệm
              </Button>
            </Link>
            <Link to="/shop" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                variant="ghost" 
                className="w-full sm:w-auto bg-white/10 hover:bg-white text-white hover:text-primary border border-white/40 hover:border-white backdrop-blur-md px-8 py-6 rounded-xl font-semibold transition-all text-base shadow-sm hover:shadow-xl hover:-translate-y-0.5"
              >
                Khám Phá Sản Phẩm
              </Button>
            </Link>
          </div>

          {/* Floating Glass Stats Bar */}
          <div className="mt-14 max-w-3xl mx-auto bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/15">
              <div className="flex items-center justify-center sm:justify-start gap-3.5 px-3 pt-2 sm:pt-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-accent shrink-0 shadow-inner border border-white/10">
                  <Star className="w-5 h-5 text-accent fill-accent" />
                </div>
                <div className="text-left">
                  <p className="font-heading font-bold text-lg text-white leading-none">4.9 / 5.0</p>
                  <p className="text-xs text-stone-200 mt-1 font-sans">Đánh giá hài lòng</p>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3.5 px-3 pt-3 sm:pt-0 sm:pl-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-accent shrink-0 shadow-inner border border-white/10">
                  <Leaf className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-heading font-bold text-lg text-white leading-none">100% Hữu Cơ</p>
                  <p className="text-xs text-stone-200 mt-1 font-sans">Thảo mộc thiên nhiên</p>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3.5 px-3 pt-3 sm:pt-0 sm:pl-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-accent shrink-0 shadow-inner border border-white/10">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-heading font-bold text-lg text-white leading-none">10.000+</p>
                  <p className="text-xs text-stone-200 mt-1 font-sans">Lượt khách Cần Thơ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 text-accent font-semibold text-xs tracking-wider uppercase">
              <Leaf className="w-4 h-4" />
              <span>Liệu Trình Dưỡng Sinh Chuyên Sâu</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primary">Dịch Vụ Nổi Bật Tại Eva Spa</h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Mỗi liệu trình được thiết kế tỉ mỉ, kết hợp bí quyết thảo mộc cổ truyền cùng kỹ thuật ấn huyệt hiện đại giúp tái tạo năng lượng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div 
                key={idx} 
                className="bg-card rounded-2xl border border-border hover:border-primary/40 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Image Container */}
                <div className="relative h-56 w-full overflow-hidden bg-muted">
                  <img 
                    src={service.img} 
                    alt={service.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3 bg-primary/90 text-white text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-accent" />
                    <span>{service.tag}</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span>{service.duration}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-3">
                    <h3 className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-xs text-accent font-medium mt-1">{service.subtitle}</p>
                  </div>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                    {service.desc}
                  </p>

                  <div className="pt-4 border-t border-border/80 flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-xs text-muted-foreground block">Giá trải nghiệm</span>
                      <span className="text-xl font-bold text-accent">{service.price}</span>
                    </div>
                    <Link to="/booking">
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-lg gap-1">
                        <span>Đặt lịch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-secondary/50 border-y border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-accent font-semibold text-xs tracking-wider uppercase">Giá trị cốt lõi</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primary">Vì Sao Khách Hàng Yêu Mến Eva Spa?</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Chúng tôi trân trọng từng phút giây thư giãn của quý khách với không gian mộc mạc và sự chăm sóc chu đáo nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="bg-card p-6 rounded-2xl border border-border/80 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-primary">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Promo Banner */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-4xl text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-accent text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Món Quà Dành Tặng Bạn</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold leading-tight">
            Hãy Dành Cho Mình Một Buổi Chiều <br />
            Thư Giãn Cùng Hương Thảo Mộc
          </h2>
          <p className="text-stone-200 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Đặt lịch trước để Eva Spa chuẩn bị nước thảo mộc ấm và phòng trị liệu riêng tư dành riêng cho bạn.
          </p>
          <div className="pt-2">
            <Link to="/booking">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 rounded-xl shadow-lg text-base">
                Đặt Lịch Hẹn Ngay Hôm Nay
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
