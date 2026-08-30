import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Leaf, Calendar, ArrowRight, BookOpen, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BLOG_SEEDS } from '@/lib/blogSeeds'

const DEFAULT_POSTS = [
  { 
    id: 'goi-dau-duong-sinh-bo-ket-giam-rung-toc', 
    slug: 'goi-dau-duong-sinh-bo-ket-giam-rung-toc',
    title: 'Bí quyết gội đầu dưỡng sinh bằng bồ kết & vỏ bưởi tươi giúp giảm rụng tóc', 
    category: 'Chăm Sóc & Trẻ Hóa Da',
    excerpt: 'Khám phá công dụng kỳ diệu của thảo mộc tự nhiên trong việc làm sạch sâu nang tóc, trị gàu nấm và kích thích mọc tóc dày mượt tự nhiên.', 
    featuredImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    date: '15/08/2026',
    readTime: '4 phút đọc',
    status: 'published'
  },
  { 
    id: 'an-huyet-co-vai-gay-tri-mat-ngu', 
    slug: 'an-huyet-co-vai-gay-tri-mat-ngu',
    title: 'Tại sao ấn huyệt vùng cổ vai gáy lại giúp cải thiện giấc ngủ sâu?', 
    category: 'Dưỡng Sinh & Trị Liệu',
    excerpt: 'Huyệt Phong Trì, Kiên Tỉnh và Đại Chùy khi được đả thông đúng cách sẽ giúp giải phóng chèn ép dây thần kinh, đưa oxy lên não nhanh chóng.', 
    featuredImage: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=80',
    date: '12/08/2026',
    readTime: '6 phút đọc',
    status: 'published'
  },
  { 
    id: 'xong-hoi-thao-duoc-giai-cam-thanh-loc-doc-to', 
    slug: 'xong-hoi-thao-duoc-giai-cam-thanh-loc-doc-to',
    title: 'Xông hơi thảo dược giải cảm và thanh lọc độc tố cơ thể đúng cách', 
    category: 'Kiến Thức Thảo Mộc',
    excerpt: 'Hướng dẫn các bước xông hơi với lá sả, tía tô, ngải cứu và hương nhu giúp da dẻ hồng hào, tăng cường hệ miễn dịch.', 
    featuredImage: 'https://images.unsplash.com/photo-1512290900672-1f4869851604?auto=format&fit=crop&w=1200&q=80',
    date: '08/08/2026',
    readTime: '5 phút đọc',
    status: 'published'
  },
]

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [posts, setPosts] = useState(DEFAULT_POSTS)

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id,slug,title,category,excerpt,image_url,date_label,read_time,published_at,created_at')
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          const mapped = data.map((b: any) => ({
            id: b.id,
            slug: b.slug || b.id,
            title: b.title,
            category: b.category || 'Cẩm Nang Dưỡng Sinh',
            excerpt: b.excerpt || (b.content?.replace(/<[^>]*>?/gm, '').substring(0, 140) + '...'),
            featuredImage: b.image_url || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
            date: b.date_label || new Date(b.published_at || b.created_at || Date.now()).toLocaleDateString('vi-VN'),
            readTime: b.read_time || '5 phút đọc',
            status: 'published',
          }))
          setPosts(mapped)
          return
        }

        const seeded = BLOG_SEEDS.filter((p) => p.status === 'published').map((p) => ({
          id: p.id,
          slug: p.seoData.slug,
          title: p.title,
          category: p.category,
          excerpt: p.excerpt,
          featuredImage: p.featuredImage,
          date: p.date,
          readTime: p.readTime,
          status: 'published',
        }))
        if (seeded.length > 0) {
          setPosts(seeded)
          return
        }

        const saved = localStorage.getItem('eva_spa_admin_blog_posts')
        if (saved) {
          const parsed = JSON.parse(saved)
          const publishedOnly = parsed.filter((p: any) => p.status === 'published')
          if (publishedOnly.length > 0) {
            setPosts(publishedOnly)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchBlogs()
  }, [])

  const categories = useMemo(() => {
    const list = Array.from(new Set(posts.map((p: any) => p.category)))
    return ['all', ...list]
  }, [posts])

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'all') return posts
    return posts.filter((p: any) => p.category === selectedCategory)
  }, [posts, selectedCategory])

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl font-sans">
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

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          {categories.map((cat: any) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-white font-semibold shadow-xs'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {cat === 'all' ? 'Tất cả chủ đề' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Post List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPosts.map((post: any) => {
          const postSlug = post.slug || post.seoData?.slug || post.id
          return (
            <Link key={post.id} to={`/blog/${postSlug}`} className="group flex">
              <Card className="hover:border-primary/50 hover:shadow-lg transition-all duration-300 rounded-2xl border-border/80 overflow-hidden bg-card flex flex-col w-full text-left">
                {/* Post Thumbnail */}
                {post.featuredImage && (
                  <div className="h-52 w-full overflow-hidden relative bg-secondary">
                    <img 
                      src={post.featuredImage} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Leaf className="w-3 h-3 text-accent" />
                      {post.category}
                    </span>
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      {post.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-serif font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
                  <div className="inline-flex items-center gap-1.5 text-accent font-semibold text-xs group-hover:translate-x-1 transition-transform">
                    <span>Đọc bài viết chi tiết</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
