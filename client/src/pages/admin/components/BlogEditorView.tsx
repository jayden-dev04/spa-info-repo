import { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Image as ImageIcon, 
  Sparkles, 
  BookOpen, 
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import FreeRichEditor from './FreeRichEditor'
import SeoAssistant from './SeoAssistant'
import type { SeoData } from './SeoAssistant'
import { toast } from 'sonner'

export interface BlogPost {
  id: string
  title: string
  category: string
  excerpt: string
  content: string
  featuredImage: string
  status: 'published' | 'draft'
  views: number
  readTime: string
  date: string
  author: string
  seoData: SeoData
}

interface BlogEditorViewProps {
  post: BlogPost | null
  onSave: (post: BlogPost) => void
  onBack: () => void
}

const CATEGORIES = [
  'Dưỡng Sinh & Trị Liệu',
  'Chăm Sóc & Trẻ Hóa Da',
  'Kiến Thức Thảo Mộc',
  'Massage Ấn Huyệt',
  'Góc Sống Khỏe'
]

const PRESET_IMAGES = [
  { label: 'Gội đầu dưỡng sinh', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Massage đá nóng', url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Thảo mộc thiên nhiên', url: 'https://images.unsplash.com/photo-1512290900672-1f4869851604?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Chăm sóc da mặt', url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80' }
]

export default function BlogEditorView({ post, onSave, onBack }: BlogEditorViewProps) {
  const [title, setTitle] = useState(post?.title || '')
  const [category, setCategory] = useState(post?.category || CATEGORIES[0])
  const [excerpt, setExcerpt] = useState(post?.excerpt || '')
  const [content, setContent] = useState(
    post?.content || 
    '<h2>1. Giới thiệu liệu trình dưỡng sinh</h2><p>Dưỡng sinh đông y kết hợp thảo mộc thiên nhiên mang lại sự thư giãn sâu sắc cho hệ thần kinh và cơ bắp...</p><h2>2. Công dụng của các loại thảo mộc</h2><p>Bồ kết, hương nhu, sả chanh và gừng tươi giúp giải cảm, kích thích tuần hoàn máu và nuôi dưỡng mái tóc chắc khỏe.</p>'
  )
  const [featuredImage, setFeaturedImage] = useState(
    post?.featuredImage || PRESET_IMAGES[0].url
  )
  const [status, setStatus] = useState<'published' | 'draft'>(post?.status || 'published')
  const [seoData, setSeoData] = useState<SeoData>(
    post?.seoData || {
      metaTitle: '',
      metaDescription: '',
      slug: '',
      focusKeyword: ''
    }
  )

  // Auto-generate slug and meta title if empty
  useEffect(() => {
    if (!post && title && !seoData.slug) {
      const generatedSlug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')

      setSeoData((prev) => ({
        ...prev,
        slug: generatedSlug,
        metaTitle: prev.metaTitle || `${title} — Eva Spa Cần Thơ`
      }))
    }
  }, [title, post, seoData.slug])

  const handleUpdateSeo = (updated: Partial<SeoData>) => {
    setSeoData((prev) => ({ ...prev, ...updated }))
  }

  const handleSave = (targetStatus: 'published' | 'draft') => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài viết')
      return
    }

    const wordCount = content.replace(/<[^>]*>?/gm, ' ').trim().split(/\s+/).length
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))

    const newPost: BlogPost = {
      id: post?.id || `blog-${Date.now()}`,
      title: title.trim(),
      category,
      excerpt: excerpt.trim() || title.trim(),
      content,
      featuredImage,
      status: targetStatus,
      views: post?.views || 1,
      readTime: `${readTimeMinutes} phút đọc`,
      date: post?.date || new Date().toISOString().split('T')[0],
      author: post?.author || 'Chuyên gia Dưỡng Sinh Eva',
      seoData: {
        metaTitle: seoData.metaTitle.trim() || title.trim(),
        metaDescription: seoData.metaDescription.trim() || excerpt.trim(),
        slug: seoData.slug.trim() || 'bai-viet',
        focusKeyword: seoData.focusKeyword.trim()
      }
    }

    onSave(newPost)
    toast.success(targetStatus === 'published' ? 'Đã xuất bản bài viết thành công!' : 'Đã lưu bản nháp bài viết!')
    onBack()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="rounded-xl gap-2 hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách</span>
          </Button>

          <div>
            <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>{post ? 'Chỉnh Sửa Bài Viết Blog' : 'Biên Soạn Bài Viết Mới & Tối Ưu SEO'}</span>
            </h2>
            <p className="text-xs text-muted-foreground">Trình soạn thảo văn bản phong phú & Công cụ phân tích SEO Google</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Save Draft */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave('draft')}
            className="gap-1.5 rounded-xl font-medium"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Bản Nháp</span>
          </Button>

          {/* Publish Button */}
          <Button
            size="sm"
            onClick={() => handleSave('published')}
            className="gap-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md font-semibold px-4"
          >
            <Send className="w-4 h-4" />
            <span>Xuất Bản Bài Viết</span>
          </Button>
        </div>
      </div>

      {/* Main Content Workspace: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor & Main Meta (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Post Title Card */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Tiêu Đề Bài Viết <span className="text-destructive">*</span></span>
              <span className="text-[11px] font-normal text-primary">{title.length} ký tự</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài viết (Ví dụ: Bí Quyết Gội Đầu Dưỡng Sinh Thảo Mộc...)"
              className="w-full px-4 py-3.5 text-xl font-heading font-bold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Category & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card p-5 rounded-2xl border border-border shadow-xs space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Chuyên Mục Bài Viết
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-sans"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-card p-5 rounded-2xl border border-border shadow-xs space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Trạng Thái Xuất Bản
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-sans"
              >
                <option value="published">🟢 Đã Xuất Bản (Công Khai trên Web)</option>
                <option value="draft">🟡 Bản Nháp (Lưu nội bộ)</option>
              </select>
            </div>
          </div>

          {/* Featured Image Selector */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>Ảnh Đại Diện Bài Viết (Featured Image)</span>
              </label>
              <span className="text-[11px] text-muted-foreground">Chọn ảnh mẫu hoặc nhập URL</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_IMAGES.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFeaturedImage(img.url)}
                  className={`relative rounded-xl overflow-hidden h-20 border-2 transition-all group ${
                    featuredImage === img.url 
                      ? 'border-primary ring-2 ring-primary/30 shadow-md' 
                      : 'border-border/60 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs text-white text-[10px] truncate px-1 py-0.5 text-center font-medium">
                    {img.label}
                  </span>
                  {featuredImage === img.url && (
                    <div className="absolute top-1 right-1 bg-primary text-white p-0.5 rounded-full shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="Dán đường dẫn ảnh đại diện (URL)..."
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-muted-foreground"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Đoạn Trích Tóm Tắt (Excerpt)
            </label>
            <textarea
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Tóm tắt ngắn 1-2 câu về nội dung bài viết để hiển thị trên danh sách bài viết ngoài trang chủ và trang blog..."
              className="w-full px-4 py-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none leading-relaxed"
            />
          </div>

          {/* Free Rich Text Editor Container */}
          <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="p-5 pb-3.5 flex items-center justify-between border-b border-border/70 bg-muted/10">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Nội Dung Bài Viết (Trình Soạn Thảo Phong Phú 100% Free)</span>
              </label>
              <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                Mã nguồn mở &bull; MIT License
              </span>
            </div>

            <FreeRichEditor
              content={content}
              onChange={setContent}
              placeholder="Bắt đầu viết nội dung bài viết chuyên sâu tại đây..."
            />
          </div>
        </div>

        {/* Right Column: SEO Assistant & Live Previews (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 sticky top-6">
          <SeoAssistant
            title={title}
            content={content}
            excerpt={excerpt}
            featuredImage={featuredImage}
            seoData={seoData}
            onUpdateSeo={handleUpdateSeo}
          />
        </div>
      </div>
    </div>
  )
}
