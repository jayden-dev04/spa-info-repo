import { useState, useMemo, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  FileText, 
  Sparkles, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Tag
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BlogEditorView from './BlogEditorView'
import type { BlogPost } from './BlogEditorView'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-1',
    title: 'Bí Quyết Gội Đầu Dưỡng Sinh Bằng Bồ Kết & Vỏ Bưởi Tươi Giúp Giảm Rụng Tóc',
    category: 'Chăm Sóc & Trẻ Hóa Da',
    excerpt: 'Khám phá công dụng kỳ diệu của thảo mộc tự nhiên trong việc làm sạch sâu nang tóc, trị gàu nấm và kích thích mọc tóc dày mượt tự nhiên.',
    content: '<h2>1. Công dụng của bồ kết nguyên chất</h2><p>Bồ kết chứa hàm lượng lớn saponin có khả năng kháng khuẩn, làm sạch da đầu tự nhiên mà không gây khô xơ.</p><h2>2. Tinh dầu vỏ bưởi</h2><p>Tinh dầu vỏ bưởi giúp kích thích nang tóc phát triển mạnh mẽ và phục hồi hư tổn.</p>',
    featuredImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    views: 1420,
    readTime: '4 phút đọc',
    date: '2026-08-15',
    author: 'Chuyên gia Dưỡng Sinh Eva',
    seoData: {
      metaTitle: 'Gội Đầu Dưỡng Sinh Bồ Kết Cần Thơ — Giảm Rụng Tóc Hiệu Quả',
      metaDescription: 'Bí quyết gội đầu dưỡng sinh thảo mộc bồ kết và vỏ bưởi tươi giúp thải độc da đầu, trị gàu và kích thích mọc tóc tại Eva Spa Cần Thơ.',
      slug: 'goi-dau-duong-sinh-bo-ket-giam-rung-toc',
      focusKeyword: 'gội đầu dưỡng sinh'
    }
  },
  {
    id: 'blog-2',
    title: 'Tại Sao Ấn Huyệt Vùng Cổ Vai Gáy Lại Giúp Cải Thiện Giấc Ngủ Sâu?',
    category: 'Dưỡng Sinh & Trị Liệu',
    excerpt: 'Huyệt Phong Trì, Kiên Tỉnh và Đại Chùy khi được đả thông đúng cách sẽ giúp giải phóng chèn ép dây thần kinh, đưa oxy lên não nhanh chóng.',
    content: '<h2>1. Căn nguyên gây mất ngủ từ tắc nghẽn kinh lạc</h2><p>Lối sống văn phòng ngồi nhiều khiến các huyệt đạo vùng cổ vai gáy bị co cứng, cản trở lưu thông khí huyết.</p><h2>2. Kỹ thuật đả thông ấn huyệt chuyên sâu</h2><p>Tác động chính xác vào huyệt Phong Trì giúp thư giãn thần kinh trung ương.</p>',
    featuredImage: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    views: 980,
    readTime: '6 phút đọc',
    date: '2026-08-12',
    author: 'Lương Y Trị Liệu Hoàng',
    seoData: {
      metaTitle: 'Massage Ấn Huyệt Cổ Vai Gáy Cần Thơ — Giúp Ngủ Ngon Sâu Giấc',
      metaDescription: 'Liệu trình massage ấn huyệt đả thông kinh lạc cổ vai gáy giải tỏa đau mỏi, xoa dịu thần kinh và trị mất ngủ tại Eva Spa.',
      slug: 'an-huyet-co-vai-gay-tri-mat-ngu',
      focusKeyword: 'ấn huyệt cổ vai gáy'
    }
  },
  {
    id: 'blog-3',
    title: 'Xông Hơi Thảo Dược Giải Cảm Và Thanh Lọc Độc Tố Cơ Thể Đúng Cách',
    category: 'Kiến Thức Thảo Mộc',
    excerpt: 'Hướng dẫn các bước xông hơi với lá sả, tía tô, ngải cứu và hương nhu giúp da dẻ hồng hào, tăng cường hệ miễn dịch.',
    content: '<h2>1. Các loại lá xông cổ truyền</h2><p>Sả chanh, ngải cứu, bạc hà và tía tô khi đun sôi bốc hơi chứa nhiều tinh dầu kháng viêm tự nhiên.</p><h2>2. Lưu ý quan trọng sau khi xông hơi</h2><p>Uống trà gừng ấm và tuyệt đối không tắm ngay bằng nước lạnh.</p>',
    featuredImage: 'https://images.unsplash.com/photo-1512290900672-1f4869851604?auto=format&fit=crop&w=1200&q=80',
    status: 'draft',
    views: 310,
    readTime: '5 phút đọc',
    date: '2026-08-08',
    author: 'Chuyên viên Spa Minh Thảo',
    seoData: {
      metaTitle: 'Xông Hơi Thảo Dược Thải Độc Đúng Cách — Eva Spa Cần Thơ',
      metaDescription: 'Hướng dẫn chi tiết quy trình xông hơi giải cảm bằng lá thảo mộc tươi giúp thanh lọc cơ thể và tăng đề kháng.',
      slug: 'xong-hoi-thao-duoc-thanh-loc-doc-to',
      focusKeyword: 'xông hơi thảo dược'
    }
  }
]

export default function BlogTab() {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('eva_spa_admin_blog_posts')
    return saved ? JSON.parse(saved) : INITIAL_BLOG_POSTS
  })

  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

  // Nguồn sự thật: bảng public.blog_posts (Supabase). localStorage chỉ cache.
  const toRow = (p: BlogPost) => ({
    slug: p.seoData.slug || p.id,
    title: p.title,
    category: p.category,
    excerpt: p.excerpt,
    content: p.content,
    image_url: p.featuredImage,
    views: p.views,
    read_time: p.readTime,
    date_label: p.date,
    author: p.author,
    meta_title: p.seoData.metaTitle,
    meta_description: p.seoData.metaDescription,
    focus_keyword: p.seoData.focusKeyword,
    published_at: p.status === 'published' ? (p.date ? new Date().toISOString() : null) : null,
    updated_at: new Date().toISOString(),
  })

  const savePosts = (newPosts: BlogPost[]) => {
    setPosts(newPosts)
    localStorage.setItem('eva_spa_admin_blog_posts', JSON.stringify(newPosts))
    ;(async () => {
      // upsert đủ bài hiện có; xóa các bài bị delete (id không còn trong danh sách)
      const slugs = newPosts.map((p) => p.seoData.slug || p.id)
      const { error } = await supabase.from('blog_posts').upsert(newPosts.map(toRow), { onConflict: 'slug' })
      if (error) toast.error('Không thể lưu blog vào Supabase: ' + error.message)
      else await supabase.from('blog_posts').delete().not('slug', 'in', `(${slugs.map((s) => `'${s}'`).join(',')})`)
    })()
  }

  // Lần mở tab đầu: đọc blog_posts về (gộp theo slug lên trên cache/seeds)
  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('slug,title,category,excerpt,content,image_url,views,read_time,date_label,author,meta_title,meta_description,focus_keyword,published_at,created_at')
        .order('created_at', { ascending: true })
      if (error || !data || data.length === 0) return
      const rows: BlogPost[] = data.map((r: any) => ({
        id: r.slug,
        title: r.title,
        category: r.category || 'Cẩm Nang Dưỡng Sinh',
        excerpt: r.excerpt || '',
        content: r.content || '',
        featuredImage: r.image_url || '',
        status: r.published_at ? 'published' : 'draft',
        views: r.views ?? 0,
        readTime: r.read_time || '5 phút đọc',
        date: r.date_label || new Date(r.created_at || Date.now()).toLocaleDateString('vi-VN'),
        author: r.author || 'Eva Spa',
        seoData: {
          metaTitle: r.meta_title || r.title,
          metaDescription: r.meta_description || (r.excerpt || '').slice(0, 150),
          focusKeyword: r.focus_keyword || '',
          slug: r.slug,
        },
      }))
      setPosts(rows)
      localStorage.setItem('eva_spa_admin_blog_posts', JSON.stringify(rows))
    })()
  }, [])

  // Calculate SEO score for badge
  const calculateSeoScore = (post: BlogPost) => {
    let score = 0
    if (post.seoData.metaTitle) score += 25
    if (post.seoData.metaDescription) score += 25
    if (post.seoData.focusKeyword) score += 25
    if (post.featuredImage) score += 15
    if (post.content.length > 200) score += 10
    return Math.min(100, score)
  }

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.seoData.focusKeyword.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchCategory = categoryFilter === 'all' || post.category === categoryFilter
      const matchStatus = statusFilter === 'all' || post.status === statusFilter

      return matchSearch && matchCategory && matchStatus
    })
  }, [posts, searchTerm, categoryFilter, statusFilter])

  // Stats calculation
  const stats = useMemo(() => {
    const total = posts.length
    const published = posts.filter((p) => p.status === 'published').length
    const drafts = posts.filter((p) => p.status === 'draft').length
    const totalScore = posts.reduce((sum, p) => sum + calculateSeoScore(p), 0)
    const avgScore = total > 0 ? Math.round(totalScore / total) : 0

    return { total, published, drafts, avgScore }
  }, [posts])

  const handleSavePost = (savedPost: BlogPost) => {
    const existingIndex = posts.findIndex((p) => p.id === savedPost.id)
    if (existingIndex >= 0) {
      const updated = [...posts]
      updated[existingIndex] = savedPost
      savePosts(updated)
    } else {
      savePosts([savedPost, ...posts])
    }
  }

  const handleDeletePost = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      const updated = posts.filter((p) => p.id !== id)
      savePosts(updated)
      toast.success('Đã xóa bài viết thành công')
    }
  }

  const handleToggleStatus = (id: string) => {
    const updated = posts.map((p) => {
      if (p.id === id) {
        const nextStatus = p.status === 'published' ? 'draft' : 'published'
        toast.info(nextStatus === 'published' ? 'Đã chuyển sang công khai' : 'Đã chuyển về bản nháp')
        return { ...p, status: nextStatus as 'published' | 'draft' }
      }
      return p
    })
    savePosts(updated)
  }

  const openNewPost = () => {
    setEditingPost(null)
    setViewMode('editor')
  }

  const openEditPost = (post: BlogPost) => {
    setEditingPost(post)
    setViewMode('editor')
  }

  // Render Full-Page Editor View when mode is 'editor'
  if (viewMode === 'editor') {
    return (
      <BlogEditorView
        post={editingPost}
        onSave={handleSavePost}
        onBack={() => setViewMode('list')}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Blog & SEO KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tổng Bài Viết
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Bài viết trên website</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Đã Xuất Bản
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold text-emerald-600">{stats.published}</div>
            <p className="text-xs text-muted-foreground mt-1">Hiển thị công khai với khách</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Bản Nháp
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold text-amber-600">{stats.drafts}</div>
            <p className="text-xs text-muted-foreground mt-1">Đang hoàn thiện nội dung</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-xs hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Điểm SEO Trung Bình
            </CardTitle>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold text-primary">{stats.avgScore}/100</div>
            <p className="text-xs text-muted-foreground mt-1">Độ chuẩn hóa tìm kiếm</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border">
        {/* Search & Category Filter */}
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm bài viết, từ khóa SEO..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground font-medium"
          >
            <option value="all">Tất cả chuyên mục</option>
            <option value="Dưỡng Sinh & Trị Liệu">Dưỡng Sinh & Trị Liệu</option>
            <option value="Chăm Sóc & Trẻ Hóa Da">Chăm Sóc & Trẻ Hóa Da</option>
            <option value="Kiến Thức Thảo Mộc">Kiến Thức Thảo Mộc</option>
            <option value="Massage Ấn Huyệt">Massage Ấn Huyệt</option>
            <option value="Góc Sống Khỏe">Góc Sống Khỏe</option>
          </select>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === 'all' ? 'bg-primary text-white font-semibold' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Tất cả ({posts.length})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === 'published' ? 'bg-emerald-700 text-white font-semibold' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Đã xuất bản ({stats.published})
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === 'draft' ? 'bg-amber-600 text-white font-semibold' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Bản nháp ({stats.drafts})
            </button>
          </div>
        </div>

        {/* Create Post Button */}
        <Button
          onClick={openNewPost}
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-4 rounded-xl gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Viết Bài Mới</span>
        </Button>
      </div>

      {/* Articles Table */}
      <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Bài Viết & Tóm Tắt</th>
                <th className="px-4 py-4">Chuyên Mục</th>
                <th className="px-4 py-4">Điểm SEO</th>
                <th className="px-4 py-4">Trạng Thái</th>
                <th className="px-4 py-4">Lượt Xem</th>
                <th className="px-4 py-4">Ngày Đăng</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="font-medium">Không tìm thấy bài viết nào phù hợp</p>
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => {
                  const seoScore = calculateSeoScore(post)

                  return (
                    <tr key={post.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5 max-w-md">
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-border shadow-2xs"
                          />
                          <div className="min-w-0">
                            <p className="font-heading font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                              {post.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {post.excerpt}
                            </p>
                            {post.seoData.focusKeyword && (
                              <div className="flex items-center gap-1 mt-1 text-[11px] text-primary">
                                <Tag className="w-3 h-3" />
                                <span className="font-medium font-mono">Từ khóa: {post.seoData.focusKeyword}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="bg-secondary/50 text-primary border-primary/20 text-xs">
                          {post.category}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-heading border shadow-2xs"
                          style={{
                            color: seoScore >= 80 ? '#10b981' : seoScore >= 50 ? '#f59e0b' : '#ef4444',
                            backgroundColor: seoScore >= 80 ? 'rgba(16, 185, 129, 0.1)' : seoScore >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            borderColor: seoScore >= 80 ? 'rgba(16, 185, 129, 0.2)' : seoScore >= 50 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                          }}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{seoScore}/100 SEO</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(post.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            post.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${post.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span>{post.status === 'published' ? 'Đã Xuất Bản' : 'Bản Nháp'}</span>
                        </button>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{post.views.toLocaleString()}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        {post.date}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditPost(post)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                            title="Chỉnh sửa bài viết"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                            title="Xóa bài viết"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
