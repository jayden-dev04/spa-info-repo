import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, ArrowLeft, Share2, Sparkles, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BLOG_SEEDS } from '@/lib/blogSeeds'
import { toast } from 'sonner'

const DEFAULT_BLOG_DETAILS: Record<string, any> = {
  'goi-dau-duong-sinh-bo-ket-giam-rung-toc': {
    title: 'Bí quyết gội đầu dưỡng sinh bằng bồ kết & vỏ bưởi tươi giúp giảm rụng tóc',
    category: 'Chăm Sóc & Trẻ Hóa Da',
    date: '15/08/2026',
    readTime: '4 phút đọc',
    author: 'Chuyên gia Dưỡng Sinh Eva',
    featuredImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    content: `
      <h2>1. Tác dụng tuyệt vời của quả bồ kết với mái tóc</h2>
      <p>Từ xa xưa, phụ nữ Việt Nam đã biết sử dụng trái bồ kết nướng thơm để nấu nước gội đầu. Trong quả bồ kết chứa tới 10% hợp chất saponin có khả năng tạo bọt tự nhiên, làm sạch sâu gàu ngứa và bụi bẩn mà hoàn toàn không làm mất đi lớp dầu tự nhiên bảo vệ da đầu.</p>
      
      <blockquote>"Sự kết hợp giữa bồ kết nướng và vỏ bưởi tươi tạo nên bài thuốc dưỡng tóc cổ truyền hoàn hảo nhất."</blockquote>

      <h2>2. Tinh dầu vỏ bưởi tươi kích thích mọc tóc nhanh</h2>
      <p>Vỏ bưởi dồi dào tinh dầu Limonene, Vitamin C và Flavonoid. Khi được nấu cùng bồ kết ở nhiệt độ vừa phải, tinh dầu bưởi sẽ thẩm thấu vào từng nang tóc, giúp lưu thông máu dưới da đầu, nuôi dưỡng chân tóc chắc khỏe và kích thích tóc con mọc dày chỉ sau 2-3 tuần.</p>

      <h2>3. Quy trình gội đầu dưỡng sinh chuẩn spa tại Eva Spa</h2>
      <p>Tại Eva Spa Cần Thơ, mỗi nồi nước gội đều được nấu mới mỗi sáng từ bồ kết nướng than hoa, lá sả tươi, cỏ mần trầu và vỏ bưởi. Kết hợp với bài bấm huyệt đả thông kinh lạc vùng đầu, vai gáy giúp xua tan căng thẳng và phục hồi mái tóc bồng bềnh.</p>
    `,
  },
  'an-huyet-co-vai-gay-tri-mat-ngu': {
    title: 'Tại sao ấn huyệt vùng cổ vai gáy lại giúp cải thiện giấc ngủ sâu?',
    category: 'Dưỡng Sinh & Trị Liệu',
    date: '12/08/2026',
    readTime: '6 phút đọc',
    author: 'Lương Y Trị Liệu Hoàng',
    featuredImage: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=80',
    content: `
      <h2>1. Căn nguyên gây mất ngủ từ tắc nghẽn kinh lạc cổ vai gáy</h2>
      <p>Cuộc sống hiện đại với thói quen ngồi máy tính hàng giờ khiến các cơ vùng cổ vai gáy bị bó cứng. Điều này chèn ép lên động mạch cảnh và các dây thần kinh, làm giảm lưu lượng máu và oxy lên não bộ, gây ra hiện tượng đau đầu, chóng mặt và mất ngủ triền miên.</p>

      <h2>2. Tác động của các huyệt đạo Phong Trì, Kiên Tỉnh, Đại Chùy</h2>
      <p>Khi được chuyên viên trị liệu ấn huyệt chuẩn xác:</p>
      <ul>
        <li><strong>Huyệt Phong Trì:</strong> Giải tỏa căng cứng vùng chẩm, xoa dịu hệ thần kinh trung ương.</li>
        <li><strong>Huyệt Kiên Tỉnh:</strong> Giảm nhức mỏi bả vai, thúc đẩy tuần hoàn máu xuống hai cánh tay.</li>
        <li><strong>Huyệt Đại Chùy:</strong> Tăng cường dương khí toàn thân, giải trừ phong hàn.</li>
      </ul>

      <h2>3. Lời khuyên giúp duy trì giấc ngủ sâu tự nhiên</h2>
      <p>Bên cạnh việc định kỳ đi dưỡng sinh ấn huyệt tại spa, bạn nên duy trì thói quen ngâm chân thảo mộc bằng nước ấm trước khi ngủ 30 phút và hạn chế dùng thiết bị điện tử trong phòng ngủ.</p>
    `,
  },
  'xong-hoi-thao-duoc-giai-cam-thanh-loc-doc-to': {
    title: 'Xông hơi thảo dược giải cảm và thanh lọc độc tố cơ thể đúng cách',
    category: 'Kiến Thức Thảo Mộc',
    date: '08/08/2026',
    readTime: '5 phút đọc',
    author: 'Chuyên viên Trị liệu Thảo Dược',
    featuredImage: 'https://images.unsplash.com/photo-1512290900672-1f4869851604?auto=format&fit=crop&w=1200&q=80',
    content: `
      <h2>1. Cơ chế thải độc qua tuyến mồ hôi bằng thảo dược</h2>
      <p>Xông hơi thảo dược là liệu pháp sử dụng nhiệt ẩm kết hợp với tinh dầu tự nhiên từ các loại lá thơm như sả, chanh, ngải cứu, tía tô để làm giãn nở lỗ chân lông, kích thích tuyến mồ hôi đào thải độc tố tích tụ sâu dưới da.</p>

      <h2>2. Các loại lá thảo dược không thể thiếu trong nồi xông</h2>
      <p>Lá sả mang tính ấm giải cảm, tía tô giúp ra mồ hôi và kháng khuẩn, ngải cứu làm ấm kinh mạch giảm đau nhức xương khớp, hương nhu làm thông thoáng đường thở.</p>

      <h2>3. Những lưu ý an toàn khi xông hơi</h2>
      <p>Không nên xông hơi khi đang sốt quá cao hoặc cơ thể quá suy nhược. Sau khi xông cần lau khô mồ hôi bằng khăn ấm, tuyệt đối không tắm ngay bằng nước lạnh để tránh cảm nhiễm hàn khí.</p>
    `,
  }
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPost() {
      setLoading(true)
      try {
        if (slug) {
          const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .single()

          if (!error && data) {
            setPost({
              title: data.title,
              category: data.category || 'Dưỡng Sinh & Sức Khỏe',
              date: data.date_label || new Date(data.published_at || data.created_at || Date.now()).toLocaleDateString('vi-VN'),
              readTime: data.read_time || '5 phút đọc',
              author: data.author || 'Eva Spa',
              featuredImage: data.image_url || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
              content: data.content,
              excerpt: data.excerpt || undefined,
            })
            setLoading(false)
            return
          }
        }

        const saved = localStorage.getItem('eva_spa_admin_blog_posts')
        if (saved) {
          const parsed = JSON.parse(saved)
          const matched = parsed.find((p: any) => p.seoData?.slug === slug || p.id === slug)
          if (matched) {
            setPost({
              title: matched.title,
              category: matched.category || 'Dưỡng Sinh',
              date: matched.date || 'Gần đây',
              readTime: matched.readTime || '5 phút đọc',
              author: matched.author || 'Eva Spa',
              featuredImage: matched.featuredImage,
              content: matched.content,
            })
            setLoading(false)
            return
          }
        }
        const seeded = BLOG_SEEDS.find((p) => p.seoData.slug === slug || p.id === slug)
        if (seeded) {
          setPost({
            title: seeded.title,
            category: seeded.category,
            date: seeded.date,
            readTime: seeded.readTime,
            author: seeded.author,
            featuredImage: seeded.featuredImage,
            content: seeded.content,
          })
          setLoading(false)
          return
        }

        if (slug && DEFAULT_BLOG_DETAILS[slug]) {
          setPost(DEFAULT_BLOG_DETAILS[slug])
        } else {
          const firstKey = Object.keys(DEFAULT_BLOG_DETAILS)[0]
          setPost(DEFAULT_BLOG_DETAILS[firstKey])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadPost()
  }, [slug])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép liên kết bài viết!')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
        <p>Đang tải nội dung bài viết...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif font-bold text-primary mb-4">Không tìm thấy bài viết</h2>
        <Link to="/blog">
          <Button variant="outline" className="rounded-xl">Quay lại danh sách</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl font-sans text-left">
      
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/blog" className="hover:text-primary transition-colors">Góc dưỡng sinh</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium truncate max-w-xs">{post.title}</span>
      </div>

      {/* Post Header */}
      <div className="space-y-4 mb-8">
        <Badge variant="outline" className="bg-secondary text-primary border-primary/20 text-xs">
          {post.category}
        </Badge>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-primary leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-border/60 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <User className="w-3.5 h-3.5 text-accent" />
              {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              {post.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              {post.readTime}
            </span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleShare}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Chia sẻ</span>
          </Button>
        </div>
      </div>

      {/* Hero Image */}
      {post.featuredImage && (
        <div className="rounded-3xl overflow-hidden mb-10 shadow-lg border border-border/60 max-h-[460px]">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Content */}
      <div 
        className="prose prose-stone max-w-none text-foreground text-sm sm:text-base leading-relaxed space-y-6 [&>h2]:text-xl sm:[&>h2]:text-2xl [&>h2]:font-serif [&>h2]:font-bold [&>h2]:text-primary [&>h2]:mt-8 [&>h2]:mb-3 [&>p]:leading-relaxed [&>blockquote]:border-l-4 [&>blockquote]:border-accent [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:bg-secondary/30 [&>blockquote]:p-3 [&>blockquote]:rounded-r-xl [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Booking CTA Box */}
      <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-secondary/50 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-primary font-serif font-bold text-lg">
            <Sparkles className="w-5 h-5 text-accent" />
            <span>Trải Nghiệm Liệu Trình Dưỡng Sinh Tại Eva Spa</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
            Đặt hẹn ngay hôm nay để tận hưởng không gian thiền tĩnh lặng và bài massage ấn huyệt đả thông kinh lạc chuẩn y học cổ truyền.
          </p>
        </div>

        <Link to="/booking" className="shrink-0 w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-6 py-5 rounded-xl shadow-md">
            Đặt Lịch Hẹn Ngay
          </Button>
        </Link>
      </div>

      {/* Back Button */}
      <div className="mt-10 pt-6 border-t border-border flex justify-between items-center">
        <Link to="/blog">
          <Button variant="outline" className="rounded-xl gap-2 text-xs">
            <ArrowLeft className="w-4 h-4" />
            <span>Xem tất cả bài viết</span>
          </Button>
        </Link>
      </div>

    </div>
  )
}
