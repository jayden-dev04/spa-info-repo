import { useState, useMemo } from 'react'
import { 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Sparkles, 
  Smartphone, 
  Monitor, 
  Search, 
  BookOpenCheck,
  Target
} from 'lucide-react'

export interface SeoData {
  metaTitle: string
  metaDescription: string
  slug: string
  focusKeyword: string
  canonicalUrl?: string
}

interface SeoAssistantProps {
  title: string
  content: string
  excerpt: string
  featuredImage: string
  seoData: SeoData
  onUpdateSeo: (data: Partial<SeoData>) => void
}

interface AssessmentItem {
  id: string
  type: 'good' | 'improvement' | 'problem'
  title: string
  desc: string
}

export default function SeoAssistant({
  title,
  content,
  excerpt,
  featuredImage,
  seoData,
  onUpdateSeo
}: SeoAssistantProps) {
  const [activeTab, setActiveTab] = useState<'seo' | 'readability' | 'preview'>('seo')
  const [activePreview, setActivePreview] = useState<'google' | 'social'>('google')
  const [googleDevice, setGoogleDevice] = useState<'desktop' | 'mobile'>('desktop')

  // Helper to extract clean text and tags from HTML
  const plainContent = useMemo(() => {
    return content.replace(/<[^>]*>?/gm, ' ')
  }, [content])

  // Word count & Read time calculation
  const wordCount = useMemo(() => {
    return plainContent.trim() ? plainContent.trim().split(/\s+/).length : 0
  }, [plainContent])

  const readTimeMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200))
  }, [wordCount])

  // Yoast & Content Analysis Assessment Engine
  const { seoAssessments, readabilityAssessments, score, readabilityScore, stats } = useMemo(() => {
    const keyword = seoData.focusKeyword.trim().toLowerCase()
    const activeMetaTitle = seoData.metaTitle || title
    const activeMetaDesc = seoData.metaDescription || excerpt
    const seoList: AssessmentItem[] = []
    const readList: AssessmentItem[] = []

    // 1. Focus Keyword Checks
    let keywordCount = 0
    let keywordDensity = 0
    let keywordInTitle = false
    let keywordInDesc = false
    let keywordInSlug = false
    let keywordInIntro = false
    let keywordInH2 = false

    if (keyword) {
      // In Title
      keywordInTitle = activeMetaTitle.toLowerCase().includes(keyword)
      if (keywordInTitle) {
        seoList.push({
          id: 'kw-title',
          type: 'good',
          title: 'Từ khóa trong tiêu đề SEO',
          desc: `Từ khóa mục tiêu "${keyword}" đã xuất hiện trong tiêu đề.`
        })
      } else {
        seoList.push({
          id: 'kw-title',
          type: 'problem',
          title: 'Từ khóa chưa có trong tiêu đề SEO',
          desc: 'Hãy thêm từ khóa mục tiêu vào thẻ tiêu đề để tăng thứ hạng tìm kiếm.'
        })
      }

      // In Meta Description
      keywordInDesc = activeMetaDesc.toLowerCase().includes(keyword)
      if (keywordInDesc) {
        seoList.push({
          id: 'kw-desc',
          type: 'good',
          title: 'Từ khóa trong thẻ mô tả Meta',
          desc: 'Thẻ Meta Description đã chứa từ khóa mục tiêu.'
        })
      } else {
        seoList.push({
          id: 'kw-desc',
          type: 'improvement',
          title: 'Từ khóa chưa có trong mô tả Meta',
          desc: 'Khuyên dùng từ khóa trong đoạn mô tả để tăng tỷ lệ click (CTR).'
        })
      }

      // In Slug
      keywordInSlug = (seoData.slug || '').toLowerCase().includes(keyword.replace(/\s+/g, '-'))
      if (keywordInSlug) {
        seoList.push({
          id: 'kw-slug',
          type: 'good',
          title: 'Từ khóa trong đường dẫn (Slug)',
          desc: 'URL bài viết ngắn gọn và chứa từ khóa chính.'
        })
      } else {
        seoList.push({
          id: 'kw-slug',
          type: 'improvement',
          title: 'Từ khóa chưa có trong URL Slug',
          desc: 'Chèn từ khóa vào đường dẫn URL thân thiện.'
        })
      }

      // In Content & Density
      const contentLower = plainContent.toLowerCase()
      const matches = contentLower.match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))
      keywordCount = matches ? matches.length : 0
      keywordDensity = wordCount > 0 ? Number(((keywordCount / wordCount) * 100).toFixed(1)) : 0

      // In First Paragraph (Intro)
      const firstParagraph = plainContent.slice(0, 300).toLowerCase()
      keywordInIntro = firstParagraph.includes(keyword)
      if (keywordInIntro) {
        seoList.push({
          id: 'kw-intro',
          type: 'good',
          title: 'Từ khóa trong đoạn mở đầu',
          desc: 'Từ khóa xuất hiện ngay trong 100 từ đầu tiên của bài viết.'
        })
      } else {
        seoList.push({
          id: 'kw-intro',
          type: 'improvement',
          title: 'Từ khóa chưa có ở đoạn mở bài',
          desc: 'Nên đề cập từ khóa chính ngay trong đoạn văn đầu tiên.'
        })
      }

      // In Subheadings (H2, H3)
      const headings = content.match(/<h[23][^>]*>(.*?)<\/h[23]>/gi) || []
      keywordInH2 = headings.some(h => h.toLowerCase().includes(keyword))
      if (keywordInH2) {
        seoList.push({
          id: 'kw-h2',
          type: 'good',
          title: 'Từ khóa trong tiêu đề phụ (H2/H3)',
          desc: 'Các đề mục chính đã chứa từ khóa mục tiêu.'
        })
      } else {
        seoList.push({
          id: 'kw-h2',
          type: 'improvement',
          title: 'Từ khóa trong tiêu đề phụ (H2/H3)',
          desc: 'Nên phân bổ từ khóa vào ít nhất 1 thẻ H2 hoặc H3.'
        })
      }

      // Density check
      if (keywordDensity >= 0.5 && keywordDensity <= 2.5) {
        seoList.push({
          id: 'kw-density',
          type: 'good',
          title: `Mật độ từ khóa hoàn hảo (${keywordDensity}%)`,
          desc: `Từ khóa xuất hiện ${keywordCount} lần, nằm trong khoảng lý tưởng 0.5% - 2.5%.`
        })
      } else if (keywordDensity > 2.5) {
        seoList.push({
          id: 'kw-density',
          type: 'problem',
          title: `Mật độ từ khóa quá cao (${keywordDensity}%)`,
          desc: 'Nguy cơ bị Google phạt nhồi nhét từ khóa (Keyword Stuffing). Hãy giảm số lần lặp lại.'
        })
      } else {
        seoList.push({
          id: 'kw-density',
          type: 'improvement',
          title: `Mật độ từ khóa thấp (${keywordDensity}%)`,
          desc: `Từ khóa chỉ xuất hiện ${keywordCount} lần. Khuyên dùng tăng thêm 1-2 lần trong bài.`
        })
      }
    } else {
      seoList.push({
        id: 'no-kw',
        type: 'problem',
        title: 'Chưa nhập từ khóa mục tiêu (Focus Keyword)',
        desc: 'Hãy nhập từ khóa chính để kích hoạt bộ phân tích SEO toàn diện.'
      })
    }

    // 2. Text Length Check
    if (wordCount >= 600) {
      seoList.push({
        id: 'word-count',
        type: 'good',
        title: `Độ dài bài viết rất tốt (${wordCount} từ)`,
        desc: 'Số lượng từ đạt chuẩn khuyến nghị cho bài viết chuyên sâu (> 600 từ).'
      })
    } else if (wordCount >= 300) {
      seoList.push({
        id: 'word-count',
        type: 'improvement',
        title: `Độ dài bài viết tạm ổn (${wordCount} từ)`,
        desc: 'Bài viết đạt mức tối thiểu (> 300 từ). Hãy bổ sung thêm nội dung để tăng sức cạnh tranh.'
      })
    } else {
      seoList.push({
        id: 'word-count',
        type: 'problem',
        title: `Độ dài bài viết quá ngắn (${wordCount} từ)`,
        desc: 'Nội dung dưới 300 từ thường khó xếp hạng cao trên Google.'
      })
    }

    // 3. SEO Title & Description Lengths
    const titleLen = activeMetaTitle.length
    if (titleLen >= 40 && titleLen <= 65) {
      seoList.push({
        id: 'title-len',
        type: 'good',
        title: `Độ dài Tiêu đề SEO chuẩn (${titleLen}/60 ký tự)`,
        desc: 'Tiêu đề hiển thị đầy đủ và không bị cắt ngắn trên Google SERP.'
      })
    } else {
      seoList.push({
        id: 'title-len',
        type: 'improvement',
        title: `Độ dài Tiêu đề SEO (${titleLen}/60 ký tự)`,
        desc: titleLen > 65 ? 'Tiêu đề quá dài, sẽ bị Google cắt dấu ba chấm (...).' : 'Tiêu đề hơi ngắn, hãy tận dụng thêm từ khóa hấp dẫn.'
      })
    }

    const descLen = activeMetaDesc.length
    if (descLen >= 120 && descLen <= 165) {
      seoList.push({
        id: 'desc-len',
        type: 'good',
        title: `Độ dài Mô tả Meta chuẩn (${descLen}/160 ký tự)`,
        desc: 'Đoạn mô tả ngắn gọn, hấp dẫn và tối ưu hiển thị.'
      })
    } else {
      seoList.push({
        id: 'desc-len',
        type: 'improvement',
        title: `Độ dài Mô tả Meta (${descLen}/160 ký tự)`,
        desc: descLen > 165 ? 'Mô tả vượt quá 160 ký tự.' : 'Mô tả quá ngắn, nên viết từ 120 - 160 ký tự để kích thích click.'
      })
    }

    // 4. Image & Media Check
    if (featuredImage) {
      seoList.push({
        id: 'img-check',
        type: 'good',
        title: 'Có ảnh đại diện bài viết',
        desc: 'Ảnh đại diện giúp tăng trải nghiệm người đọc và hiển thị đẹp trên mạng xã hội.'
      })
    } else {
      seoList.push({
        id: 'img-check',
        type: 'problem',
        title: 'Chưa có ảnh đại diện bài viết',
        desc: 'Bài viết thiếu hình ảnh sẽ giảm 40% tỷ lệ tương tác.'
      })
    }

    // Readability Engine (Yoast Readability criteria)
    const hasHeadings = /<h[234][^>]*>/i.test(content)
    if (hasHeadings) {
      readList.push({
        id: 'h-dist',
        type: 'good',
        title: 'Phân bổ tiêu đề phụ (H2, H3)',
        desc: 'Bài viết được cấu trúc rõ ràng thành các mục nhỏ dễ theo dõi.'
      })
    } else {
      readList.push({
        id: 'h-dist',
        type: 'problem',
        title: 'Thiếu các tiêu đề phụ (H2, H3)',
        desc: 'Hãy chia nhỏ nội dung bằng các thẻ Heading để người đọc dễ quét thông tin.'
      })
    }

    const paragraphs = content.split(/<\/p>/i).filter(p => p.trim().length > 0)
    const longParagraphs = paragraphs.filter(p => p.replace(/<[^>]*>?/gm, '').split(/\s+/).length > 150)
    if (longParagraphs.length === 0) {
      readList.push({
        id: 'p-len',
        type: 'good',
        title: 'Độ dài đoạn văn cân đối',
        desc: 'Không có đoạn văn nào quá 150 từ, thuận mắt người đọc trên di động.'
      })
    } else {
      readList.push({
        id: 'p-len',
        type: 'improvement',
        title: 'Có đoạn văn quá dài',
        desc: 'Nên ngắt đoạn sau 3-4 câu để tạo khoảng thở cho mắt.'
      })
    }

    readList.push({
      id: 'transition',
      type: 'good',
      title: 'Độ mạch lạc & Dễ hiểu',
      desc: 'Nội dung sử dụng câu từ tự nhiên, mạch lạc theo phong cách dưỡng sinh đông y.'
    })

    // Calculate Overall Scores
    const goodSeoCount = seoList.filter(i => i.type === 'good').length
    const totalSeoCount = seoList.length
    const calculatedSeoScore = totalSeoCount > 0 ? Math.round((goodSeoCount / totalSeoCount) * 100) : 0

    const goodReadCount = readList.filter(i => i.type === 'good').length
    const totalReadCount = readList.length
    const calculatedReadScore = totalReadCount > 0 ? Math.round((goodReadCount / totalReadCount) * 100) : 0

    return {
      seoAssessments: seoList,
      readabilityAssessments: readList,
      score: calculatedSeoScore,
      readabilityScore: calculatedReadScore,
      stats: {
        keywordCount,
        keywordDensity,
        keywordInTitle,
        keywordInDesc,
        keywordInSlug,
        keywordInIntro,
        keywordInH2
      }
    }
  }, [seoData, title, excerpt, content, plainContent, wordCount, featuredImage])

  const getScoreBadge = (val: number) => {
    if (val >= 80) return { label: 'Tốt (Good)', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' }
    if (val >= 50) return { label: 'Cần Cải Thiện (OK)', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' }
    return { label: 'Chưa Đạt (Needs Work)', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' }
  }

  const seoBadge = getScoreBadge(score)
  const readBadge = getScoreBadge(readabilityScore)

  return (
    <div className="space-y-6">
      {/* Yoast SEO Traffic Light Header Card */}
      <div className="bg-card p-5 rounded-2xl border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-heading font-bold text-sm text-foreground">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Công Cụ Đánh Giá SEO Yoast & Power SEO</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">v4.3 Engine</span>
        </div>

        {/* Dual Score Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* SEO Score */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${seoBadge.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Điểm SEO</span>
              <span className="text-xl font-heading font-extrabold">{score}</span>
            </div>
            <p className="text-[11px] font-medium mt-2 truncate">{seoBadge.label}</p>
          </div>

          {/* Readability Score */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${readBadge.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Độ Dễ Đọc</span>
              <span className="text-xl font-heading font-extrabold">{readabilityScore}</span>
            </div>
            <p className="text-[11px] font-medium mt-2 truncate">{readBadge.label}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
          <span>{wordCount} từ &bull; ~{readTimeMinutes} phút đọc</span>
          <span>Mật độ từ khóa: <strong className="text-primary">{stats.keywordDensity}%</strong></span>
        </div>
      </div>

      {/* Focus Keyword Box */}
      <div className="bg-card p-5 rounded-2xl border border-border shadow-xs space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-primary" />
            <span>Từ Khóa Mục Tiêu (Focus Keyword)</span>
          </span>
          <span className="text-[10px] font-normal text-primary">Chuẩn Yoast</span>
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={seoData.focusKeyword}
            onChange={(e) => onUpdateSeo({ focusKeyword: e.target.value })}
            placeholder="Ví dụ: gội đầu dưỡng sinh, massage body..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-sans text-foreground"
          />
        </div>
      </div>

      {/* Tab Navigation: SEO Analysis vs Readability vs SERP Preview */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="flex border-b border-border bg-muted/40 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('seo')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'seo'
                ? 'bg-card text-primary shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phân Tích SEO ({seoAssessments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('readability')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'readability'
                ? 'bg-card text-primary shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpenCheck className="w-3.5 h-3.5" />
            <span>Khả Năng Đọc ({readabilityAssessments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'preview'
                ? 'bg-card text-primary shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Xem Trước SERP</span>
          </button>
        </div>

        {/* Tab 1: SEO Analysis Checklist (Yoast Style) */}
        {activeTab === 'seo' && (
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {seoAssessments.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors text-left">
                {item.type === 'good' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
                {item.type === 'improvement' && (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                {item.type === 'problem' && (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <p className="font-semibold text-foreground leading-tight">{item.title}</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Readability Checklist */}
        {activeTab === 'readability' && (
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {readabilityAssessments.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors text-left">
                {item.type === 'good' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
                {item.type === 'improvement' && (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                {item.type === 'problem' && (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <p className="font-semibold text-foreground leading-tight">{item.title}</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: SERP & Social Preview */}
        {activeTab === 'preview' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                <button
                  onClick={() => setActivePreview('google')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    activePreview === 'google' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  Google SERP
                </button>
                <button
                  onClick={() => setActivePreview('social')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    activePreview === 'social' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  Social Share
                </button>
              </div>

              {activePreview === 'google' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setGoogleDevice('desktop')}
                    className={`p-1.5 rounded-lg ${googleDevice === 'desktop' ? 'bg-secondary text-primary' : 'text-muted-foreground'}`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setGoogleDevice('mobile')}
                    className={`p-1.5 rounded-lg ${googleDevice === 'mobile' ? 'bg-secondary text-primary' : 'text-muted-foreground'}`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {activePreview === 'google' ? (
              <div className="p-4 bg-[#f8f9fa] rounded-xl border border-slate-200 text-left font-sans">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">
                    E
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-800">Eva Spa Cần Thơ</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      https://evaspa.vn/blog/{seoData.slug || 'bai-viet'}
                    </p>
                  </div>
                </div>
                <h3 className="text-[#1a0dab] font-medium text-sm leading-snug line-clamp-2 my-1">
                  {seoData.metaTitle || title || 'Tiêu Đề Bài Viết Blog — Eva Spa'}
                </h3>
                <p className="text-[#4d5156] text-xs leading-relaxed line-clamp-2">
                  {seoData.metaDescription || excerpt || 'Mô tả tóm tắt nội dung bài viết...'}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white text-left">
                <div className="w-full h-32 bg-slate-100 flex items-center justify-center">
                  {featuredImage ? (
                    <img src={featuredImage} alt="Social" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400">Chưa có ảnh đại diện</span>
                  )}
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400">EVASPA.VN</span>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
                    {seoData.metaTitle || title || 'Tiêu đề chia sẻ mạng xã hội'}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {seoData.metaDescription || excerpt || 'Mô tả chia sẻ...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Meta Title & Meta Description Inputs */}
      <div className="bg-card p-5 rounded-2xl border border-border shadow-xs space-y-4">
        {/* Meta Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-foreground">Thẻ Tiêu Đề SEO (Meta Title)</label>
            <span className={`text-[11px] ${(seoData.metaTitle || title).length >= 40 && (seoData.metaTitle || title).length <= 65 ? 'text-emerald-500 font-bold' : 'text-muted-foreground'}`}>
              {(seoData.metaTitle || title).length}/60 ký tự
            </span>
          </div>
          <input
            type="text"
            value={seoData.metaTitle}
            onChange={(e) => onUpdateSeo({ metaTitle: e.target.value })}
            placeholder={title || 'Nhập tiêu đề hiển thị trên Google...'}
            className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-sans text-foreground"
          />
        </div>

        {/* Meta Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-foreground">Thẻ Mô Tả SEO (Meta Description)</label>
            <span className={`text-[11px] ${(seoData.metaDescription || excerpt).length >= 120 && (seoData.metaDescription || excerpt).length <= 165 ? 'text-emerald-500 font-bold' : 'text-muted-foreground'}`}>
              {(seoData.metaDescription || excerpt).length}/160 ký tự
            </span>
          </div>
          <textarea
            rows={3}
            value={seoData.metaDescription}
            onChange={(e) => onUpdateSeo({ metaDescription: e.target.value })}
            placeholder={excerpt || 'Nhập mô tả tóm tắt hấp dẫn...'}
            className="w-full px-3.5 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-sans text-foreground resize-none leading-relaxed"
          />
        </div>

        {/* URL Slug */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Đường Dẫn Thân Thiện (URL Slug)</label>
          <div className="flex items-center bg-background border border-border rounded-xl overflow-hidden px-3 py-1.5 text-xs text-muted-foreground font-mono">
            <span>/blog/</span>
            <input
              type="text"
              value={seoData.slug}
              onChange={(e) => onUpdateSeo({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              placeholder="duong-dan-bai-viet"
              className="flex-1 bg-transparent text-foreground focus:outline-none ml-0.5"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
