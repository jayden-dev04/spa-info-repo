import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Leaf, ShoppingBag, Sparkles, Search, Eye, Filter, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { toast } from 'sonner'
import ProductDetailModal, { type ProductItem } from '@/components/shop/ProductDetailModal'

import serumImg from '@/assets/images/product_serum.jpg'
import maskImg from '@/assets/images/product_mask.jpg'
import sunscreenImg from '@/assets/images/product_sunscreen.jpg'

type ProductRow = {
  id?: unknown; name?: unknown; price?: unknown; stock_quantity?: unknown;
  image_url?: unknown; category_id?: unknown; description?: unknown;
  short_description?: unknown; is_active?: unknown;
}
const isRow = (v: unknown): v is ProductRow => !!v && typeof v === 'object'

// Dữ liệu sản phẩm lấy DUY NHẤT từ Supabase (bảng products + product_categories).
// Không có danh sách cứng fallback: nếu DB trống/lỗi thì trang báo trống thay vì
// hiển thị một bộ sản phẩm khác làm người dùng thấy dữ liệu "lộn xộn".

const PAGE_SIZE = 9

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'name-asc'
const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Mới nhất' },
  { key: 'price-asc', label: 'Giá tăng dần' },
  { key: 'price-desc', label: 'Giá giảm dần' },
  { key: 'name-asc', label: 'Tên A-Z' },
]

const fmtVnd = (n: number) => n.toLocaleString('vi-VN') + 'đ'

export default function Shop() {
  const { addToCart, totalItems, setIsCartOpen } = useCart()
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('newest')
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null)

  // Bộ lọc giá: khoảng chọn (checkbox) + nhập tay min/max
  const [priceBuckets, setPriceBuckets] = useState<string[]>([]) // ['all'] | [bucketKey...]
  const [minInput, setMinInput] = useState('')
  const [maxInput, setMaxInput] = useState('')
  const [appliedRange, setAppliedRange] = useState<{ min?: number; max?: number }>({})

  // Phân trang
  const [page, setPage] = useState(1)
  const gridTopRef = useRef<HTMLDivElement>(null)

  // Ảnh dự phòng khi Unsplash bị chặn: lần lượt serum -> mask -> sunscreen.
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    if (img.dataset.stage === 'unsplash') { img.src = maskImg; img.dataset.stage = 'mask' }
    else if (img.dataset.stage === 'mask') { img.src = sunscreenImg; img.dataset.stage = 'sunscreen' }
  }

  // Fetch products from Supabase — nguồn duy nhất, map đúng schema thật
  // (category_id, stock_quantity, short_description). Không fallback về bộ cứng.
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      setDbError(null)
      try {
        const [{ data, error }, { data: catData, error: catError }] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, price, stock_quantity, image_url, description, short_description, is_active, category_id')
            .eq('is_active', true)
            .order('id', { ascending: true }),
          supabase
            .from('product_categories')
            .select('id, name'),
        ])

        if (error) throw error
        if (catError) console.warn('Không tải được danh mục:', catError.message)

        const catNames = new Map<number, string>()
        if (Array.isArray(catData)) {
          for (const c of catData) {
            if (c && typeof c === 'object' && typeof (c as Record<string, unknown>).id === 'number') {
              catNames.set((c as { id: number }).id, String((c as { name: unknown }).name ?? ''))
            }
          }
        }

        const mapped: ProductItem[] = (Array.isArray(data) ? data : []).filter(isRow).map((item, idx) => {
          const stock = typeof item.stock_quantity === 'number'
            ? item.stock_quantity
            : Number(item.stock_quantity) || 0
          const catId = typeof item.category_id === 'number' ? item.category_id : Number(item.category_id)
          return {
            id: typeof item.id === 'string' || typeof item.id === 'number' ? item.id : `db-${idx}`,
            name: typeof item.name === 'string' ? item.name : 'Sản phẩm',
            price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
            image_url:
              typeof item.image_url === 'string' && item.image_url
                ? item.image_url
                : (idx % 3 === 0 ? serumImg : idx % 3 === 1 ? maskImg : sunscreenImg),
            category: catNames.get(catId) || 'Mỹ phẩm thảo mộc',
            description: typeof item.description === 'string' && item.description
              ? item.description
              : (typeof item.short_description === 'string' ? item.short_description : undefined),
            stock,
            organic: true,
            tag: stock > 0 ? 'Có sẵn' : 'Hết hàng',
          }
        })
        setProducts(mapped)
      } catch (err) {
        console.error('Lỗi tải sản phẩm từ Supabase:', err)
        setDbError(err instanceof Error ? err.message : 'Không tải được danh sách sản phẩm')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Danh mục duy nhất
  const categories = useMemo(() => {
    const seen: Record<string, true> = {}
    const list: string[] = []
    products.forEach((p) => {
      if (p.category && !seen[p.category]) {
        seen[p.category] = true
        list.push(p.category)
      }
    })
    return ['all', ...list]
  }, [products])

  // Khoảng giá toàn cục (để tạo bucket + placeholder input)
  const priceBounds = useMemo(() => {
    const prices = products.map((p) => p.price)
    return { min: Math.min(...prices), max: Math.max(...prices) }
  }, [products])

  // Các khoảng giá gợi ý — tự sinh 4 bucket phủ đều từ min → max
  const buckets = useMemo(() => {
    const { min, max } = priceBounds
    if (!isFinite(min) || !isFinite(max) || min === max) return []
    const step = (max - min) / 4
    return Array.from({ length: 4 }, (_, i) => {
      const lo = Math.floor((min + i * step) / 10000) * 10000
      const hi = i === 3 ? max : Math.floor((min + (i + 1) * step) / 10000) * 10000
      return { key: `${lo}-${hi}`, lo, hi, label: `Từ ${fmtVnd(lo)} - ${fmtVnd(hi)}` }
    })
  }, [priceBounds])

  // Lọc + sắp xếp
  const filteredProducts = useMemo(() => {
    const useBuckets = !priceBuckets.includes('all') && priceBuckets.length > 0
    const bucketRanges = useBuckets
      ? buckets.filter((b) => priceBuckets.includes(b.key)).map((b) => ({ lo: b.lo, hi: b.hi }))
      : []

    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
        const q = searchQuery.toLowerCase()
        const matchesSearch = p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
        if (!matchesCategory || !matchesSearch) return false

        // Lọc theo bucket đã chọn
        if (bucketRanges.length > 0) {
          const inBucket = bucketRanges.some((r) => p.price >= r.lo && p.price <= r.hi)
          if (!inBucket) return false
        }
        // Lọc theo khoảng nhập tay
        if (appliedRange.min !== undefined && p.price < appliedRange.min) return false
        if (appliedRange.max !== undefined && p.price > appliedRange.max) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price
        if (sortBy === 'price-desc') return b.price - a.price
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'vi')
        return 0 // newest: giữ thứ tự mặc định (DB đã order created_at desc)
      })
  }, [products, selectedCategory, searchQuery, sortBy, priceBuckets, buckets, appliedRange])

  // Reset về trang 1 mỗi khi bộ lọc / sắp xếp / tìm kiếm thay đổi
  useEffect(() => { setPage(1) }, [selectedCategory, searchQuery, sortBy, priceBuckets, appliedRange])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const goToPage = (p: number) => {
    setPage(Math.min(Math.max(1, p), totalPages))
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const clearAllFilters = () => {
    setSelectedCategory('all')
    setSearchQuery('')
    setPriceBuckets([])
    setMinInput('')
    setMaxInput('')
    setAppliedRange({})
    setSortBy('newest')
  }

  const hasActiveFilter =
    selectedCategory !== 'all' || searchQuery !== '' || priceBuckets.length > 0 ||
    appliedRange.min !== undefined || appliedRange.max !== undefined

  const handleQuickAdd = (p: ProductItem) => {
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      imageUrl: p.image_url || p.img || serumImg,
      category: p.category,
    })
    toast.success(`Đã thêm "${p.name}" vào giỏ hàng!`)
  }

  const discountOf = (p: ProductItem) => {
    if (!p.originalPrice || p.originalPrice <= p.price) return null
    return Math.round((1 - p.price / p.originalPrice) * 100)
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl font-sans">

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-secondary text-primary px-4 py-1.5 rounded-full text-xs font-semibold mb-4">
          <Leaf className="w-4 h-4 text-accent" />
          <span>Cửa hàng thảo mộc &amp; mỹ phẩm thuần chay</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary mb-3">
          Sản Phẩm Chăm Sóc Thảo Mộc
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Tuyển chọn các sản phẩm dưỡng sinh, serum, mặt nạ thảo mộc an toàn, thuần chay và hiệu quả.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* ===== SIDEBAR: Bộ lọc tìm kiếm ===== */}
        <aside className="w-full lg:w-72 shrink-0 border border-border rounded-2xl bg-card px-5 py-6 pb-6 space-y-6 lg:sticky lg:top-20 lg:self-start max-h-[calc(100vh-4rem)] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2 font-bold text-primary">
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc tìm kiếm
            </div>
            {hasActiveFilter && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-[11px] text-red-600 hover:underline font-semibold"
                title="Xóa tất cả bộ lọc"
              >
                <X className="w-3 h-3" /> Xóa lọc
              </button>
            )}
          </div>

          {/* Danh mục */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Danh mục</div>
            <div className="space-y-1.5">
              {categories.map((cat) => {
                const count = cat === 'all'
                  ? products.length
                  : products.filter((p) => p.category === cat).length
                const active = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs transition-colors ${
                      active ? 'bg-primary text-white font-semibold' : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    <span className="truncate">{cat === 'all' ? 'Tất cả sản phẩm' : cat}</span>
                    <span className={`text-[10px] ${active ? 'text-white/80' : 'text-muted-foreground'}`}>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Khoảng giá */}
          <div className="border-t border-border pt-6">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Khoảng giá</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 py-1 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-red-600 w-3.5 h-3.5"
                  checked={priceBuckets.includes('all') || priceBuckets.length === 0}
                  onChange={() => setPriceBuckets(['all'])}
                />
                <span className="font-medium">Tất cả</span>
              </label>
              {buckets.map((b) => (
                <label key={b.key} className="flex items-center gap-2.5 py-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-red-600 w-3.5 h-3.5"
                    checked={priceBuckets.includes(b.key)}
                    onChange={() => {
                      setPriceBuckets((prev) => {
                        const withoutAll = prev.filter((k) => k !== 'all')
                        return withoutAll.includes(b.key)
                          ? withoutAll.filter((k) => k !== b.key)
                          : [...withoutAll, b.key]
                      })
                    }}
                  />
                  <span>{b.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-3 text-[11px] text-muted-foreground">
              Hoặc nhập khoảng giá phù hợp với bạn:
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Input
                value={minInput}
                onChange={(e) => setMinInput(e.target.value.replace(/\D/g, ''))}
                placeholder={fmtVnd(priceBounds.min)}
                className="h-8 text-xs rounded-lg"
                inputMode="numeric"
              />
              <span className="text-xs text-muted-foreground">~</span>
              <Input
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value.replace(/\D/g, ''))}
                placeholder={fmtVnd(priceBounds.max)}
                className="h-8 text-xs rounded-lg"
                inputMode="numeric"
              />
            </div>
            <Button
              size="sm"
              className="w-full mt-2 h-8 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs"
              onClick={() => {
                const min = minInput ? Number(minInput) : undefined
                const max = maxInput ? Number(maxInput) : undefined
                if (min !== undefined && max !== undefined && min > max) {
                  toast.error('Giá tối thiểu phải nhỏ hơn giá tối đa!')
                  return
                }
                setAppliedRange({ min, max })
                setPriceBuckets([])
                toast.success('Đã áp dụng khoảng giá tùy chỉnh')
              }}
            >
              Áp dụng giá
            </Button>
          </div>
        </aside>

        {/* ===== MAIN ===== */}
        <div className="flex-1 w-full min-w-0">
          {/* Thanh sắp xếp + đếm kết quả */}
          <div ref={gridTopRef} className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 scroll-mt-24">
            <div className="text-sm text-muted-foreground">
              Tìm thấy <span className="font-bold text-foreground">{filteredProducts.length}</span> kết quả
            </div>
            <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs">
              {SORT_LABELS.map((s, i) => (
                <span key={s.key} className="flex items-center">
                  {i > 0 && <span className="mx-1.5 text-muted-foreground/50">·</span>}
                  <button
                    onClick={() => setSortBy(s.key)}
                    className={`font-semibold transition-colors ${
                      sortBy === s.key ? 'text-red-600' : 'text-foreground hover:text-red-600'
                    }`}
                  >
                    {s.label}
                  </button>
                </span>
              ))}
              <span className="mx-1.5 text-muted-foreground/50">·</span>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="pl-8 h-8 w-44 rounded-lg text-xs"
                />
              </div>
              <span className="ml-2 flex items-center gap-1.5 text-muted-foreground">
                <ShoppingBag className="w-4 h-4" />
                {totalItems}
                {totalItems > 0 && (
                  <Button size="sm" onClick={() => setIsCartOpen(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground h-7 rounded-lg">
                    Xem giỏ
                  </Button>
                )}
              </span>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <Card key={i} className="overflow-hidden rounded-2xl border-border/80 gap-0 py-0">
                  <div className="h-60 w-full bg-secondary/40 animate-pulse" />
                  <CardContent className="pt-4 space-y-3 pb-6">
                    <div className="h-4 w-3/4 bg-secondary/60 rounded animate-pulse" />
                    <div className="h-3 w-full bg-secondary/40 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-secondary/40 rounded animate-pulse" />
                    <div className="h-6 w-1/3 bg-secondary/60 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pagedProducts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
              <Filter className="w-8 h-8 mx-auto mb-3 opacity-60" />
              {dbError ? (
                <>
                  <p className="font-semibold text-red-600 mb-1">Không tải được danh sách sản phẩm</p>
                  <p className="text-xs mb-4">{dbError}</p>
                </>
              ) : (
                <p>Không tìm thấy sản phẩm phù hợp.</p>
              )}
              <Button variant="outline" size="sm" className="mt-4 rounded-lg" onClick={() => window.location.reload()}>
                Tải lại trang
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {pagedProducts.map((p) => {
                const img = p.image_url || p.img || serumImg
                const discount = discountOf(p)
                return (
                  <Card key={p.id} className="overflow-hidden group hover:shadow-md transition-shadow rounded-2xl border-border/80 gap-0 py-0">
                    {/* Image & Badges */}
                    <div
                      className="relative h-60 w-full bg-secondary/30 overflow-hidden cursor-pointer"
                      onClick={() => setSelectedProduct(p)}
                    >
                      <img
                        src={img}
                        alt={p.name}
                        data-stage="unsplash"
                        onError={handleImgError}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {discount !== null && (
                        <span className="absolute top-3 left-3 bg-rose-100 text-red-600 text-[11px] font-bold px-2.5 py-1 rounded-full">
                          Giảm {discount}%
                        </span>
                      )}
                      {p.tag && (
                        <span className="absolute bottom-3 left-3 bg-primary/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-3 h-3 text-accent" />
                          {p.tag}
                        </span>
                      )}
                      {p.organic && (
                        <span className="absolute top-3 right-3 bg-emerald-700/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                          <Leaf className="w-3 h-3 text-emerald-200" />
                          Organic
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <CardContent className="pt-4 space-y-2">
                      <CardTitle className="text-sm font-serif font-bold text-primary line-clamp-2 leading-snug">
                        {p.name}
                      </CardTitle>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {p.description}
                      </div>
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-lg font-bold text-red-600">
                          {p.price.toLocaleString('vi-VN')}đ
                        </span>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-xs line-through text-muted-foreground">
                            {p.originalPrice.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                        {discount !== null && (
                          <span className="text-[10px] font-bold text-red-600 bg-rose-100 px-1.5 py-0.5 rounded">
                            -{discount}%
                          </span>
                        )}
                      </div>
                    </CardContent>

                    {/* Footer */}
                    <CardFooter className="pt-2 pb-4 flex gap-2">
                      <Button
                        onClick={() => handleQuickAdd(p)}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl h-10"
                      >
                        Thêm vào giỏ
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedProduct(p)}
                        className="rounded-xl h-10"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4 text-primary" />
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}

          {/* ===== Phân trang ===== */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg"
                disabled={safePage === 1}
                onClick={() => goToPage(safePage - 1)}
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors ${
                    p === safePage
                      ? 'bg-primary text-white'
                      : 'border border-border bg-background hover:bg-secondary text-foreground'
                  }`}
                >
                  {p}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg"
                disabled={safePage === totalPages}
                onClick={() => goToPage(safePage + 1)}
              >
                Sau <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Chi tiết sản phẩm */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  )
}