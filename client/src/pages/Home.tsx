import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import heroImg from '@/assets/images/hero.jpg'
import facialImg from '@/assets/images/service_facial.jpg'
import lipsImg from '@/assets/images/service_lips.jpg'
import massageImg from '@/assets/images/service_massage.jpg'

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-muted py-32 text-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="Eva Spa Hero" className="w-full h-full object-cover brightness-50" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Thiên đường chăm sóc sắc đẹp</h1>
          <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto">
            Eva Spa mang đến cho bạn trải nghiệm thư giãn và làm đẹp tuyệt vời với công nghệ hiện đại và đội ngũ tận tâm.
          </p>
          <div className="space-x-4">
            <Link to="/booking">
              <Button size="lg" className="bg-primary hover:bg-orange-600 text-white font-semibold">
                Đặt lịch ngay
              </Button>
            </Link>
            <Link to="/shop">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 hover:text-white">
                Mua sắm sản phẩm
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Dịch Vụ Nổi Bật</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Chăm sóc da mặt', desc: 'Làm sạch sâu, trẻ hóa làn da với công nghệ Meso và Hifu.', img: facialImg },
              { title: 'Phun xăm thẩm mỹ', desc: 'Mày, môi, mí sắc nét tự nhiên với công nghệ chuẩn Hàn.', img: lipsImg },
              { title: 'Massage thư giãn', desc: 'Gội đầu dưỡng sinh, thông kinh lạc giảm căng thẳng mệt mỏi.', img: massageImg }
            ].map((service, idx) => (
              <div key={idx} className="bg-card rounded-2xl shadow-sm border text-center hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                <img src={service.img} alt={service.title} className="w-full h-48 object-cover" />
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground mb-6 flex-1">{service.desc}</p>
                  <Link to="/booking" className="text-primary font-medium hover:underline mt-auto">Tìm hiểu thêm &rarr;</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
