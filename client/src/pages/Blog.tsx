import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Leaf, Calendar, ArrowRight, BookOpen } from 'lucide-react'

const POSTS = [
  { 
    id: 1, 
    title: 'Bí quyết gội đầu dưỡng sinh bằng bồ kết & vỏ bưởi tươi giúp giảm rụng tóc', 
    category: 'Chăm sóc tóc & da đầu',
    excerpt: 'Khám phá công dụng kỳ diệu của thảo mộc tự nhiên trong việc làm sạch sâu nang tóc, trị gàu nấm và kích thích mọc tóc dày mượt tự nhiên.', 
    date: '15/08/2026',
    readTime: '4 phút đọc'
  },
  { 
    id: 2, 
    title: 'Tại sao ấn huyệt vùng cổ vai gáy lại giúp cải thiện giấc ngủ sâu?', 
    category: 'Dưỡng sinh đông y',
    excerpt: 'Huyệt Phong Trì, Kiên Tỉnh và Đại Chùy khi được đả thông đúng cách sẽ giúp giải phóng chèn ép dây thần kinh, đưa oxy lên não nhanh chóng.', 
    date: '12/08/2026',
    readTime: '6 phút đọc'
  },
  { 
    id: 3, 
    title: 'Xông hơi thảo dược giải cảm và thanh lọc độc tố cơ thể đúng cách', 
    category: 'Trị liệu & Thải độc',
    excerpt: 'Hướng dẫn các bước xông hơi với lá sả, tía tô, ngải cứu và hương nhu giúp da dẻ hồng hào, tăng cường hệ miễn dịch.', 
    date: '08/08/2026',
    readTime: '5 phút đọc'
  },
]

export default function Blog() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12 space-y-3">
        <div className="inline-flex items-center gap-1.5 text-accent text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Kiến thức & Cẩm nang</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary">Góc Dưỡng Sinh & Làm Đẹp Tự Nhiên</h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
          Những chia sẻ hữu ích từ các chuyên viên trị liệu tại Eva Spa giúp bạn tự chăm sóc sức khỏe và vẻ đẹp tại nhà.
        </p>
      </div>

      {/* Post List */}
      <div className="space-y-6">
        {POSTS.map((post) => (
          <Card key={post.id} className="hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer group rounded-2xl border-border/80 overflow-hidden bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="bg-secondary text-primary font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-accent" />
                  {post.category}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  {post.date}
                </span>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
              <CardTitle className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                {post.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{post.excerpt}</p>
              <div className="inline-flex items-center gap-1.5 text-accent font-semibold text-sm group-hover:translate-x-1 transition-transform">
                <span>Đọc toàn bộ bài viết</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
