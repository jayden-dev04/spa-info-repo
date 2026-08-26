import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Leaf, ShoppingBag, Sparkles, Search, Eye, Filter, ArrowUpDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { toast } from 'sonner'
import ProductDetailModal, { type ProductItem } from '@/components/shop/ProductDetailModal'

import serumImg from '@/assets/images/product_serum.jpg'
import maskImg from '@/assets/images/product_mask.jpg'
import sunscreenImg from '@/assets/images/product_sunscreen.jpg'

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Tinh Chất Cấp Ẩm Thảo Mộc Danique',
    price: 1690000,
    originalPrice: 1890000,
    image_url: serumImg,
    category: 'Serum & Tinh chất',
    description: 'Tinh chất cấp ẩm chuyên sâu chứa tế bào gốc thực vật và chiết xuất cam thảo, giúp phục hồi màng ẩm tự nhiên, cho da căng bóng mịn màng.',
    ingredients: 'Chiết xuất cam thảo hữu cơ, tế bào gốc rau má, HA đa phân tử, Niacinamide 5%',
    tag: 'Bán chạy nhất',
    organic: true,
    stock: 25,
  },
  {
    id: 'prod-2',
    name: 'Mặt Nạ Dưỡng Trà Xanh pH Thấp',
    price: 540000,
    originalPrice: 620000,
    image_url: maskImg,
    category: 'Mặt nạ thảo mộc',
    description: 'Mặt nạ đất sét kết hợp bột lá trà xanh non và tràm trà, hút sạch dầu thừa bã nhờn, làm dịu các nốt mụn sưng viêm nhanh chóng.',
    ingredients: 'Bột lá trà xanh Thái Nguyên, đất sét trắng Kaolin, tinh dầu tràm trà, chiết xuất cúc La Mã',
    tag: 'Thảo mộc 100%',
    organic: true,
    stock: 40,
  },
  {
    id: 'prod-3',
    name: 'Kem Chống Nắng Vật Lý Thảo Dược SPF 50+',
    price: 790000,
    originalPrice: 890000,
    image_url: sunscreenImg,
    category: 'Chống nắng & Dưỡng da',
    description: 'Kem chống nắng vật lý phổ rộng bảo vệ da tối ưu trước tia UVA/UVB và ánh sáng xanh, nâng tông nhẹ tự nhiên không để lại vệt trắng.',
    ingredients: 'Zinc Oxide 12%, chiết xuất hoa sen tuyết, tinh dầu hạt tầm xuân, Vitamin E tự nhiên',
    tag: 'Dịu nhẹ cho da',
    organic: true,
    stock: 18,
  },
  {
    id: 'prod-4',
    name: 'Huyết Thanh Phục Hồi Midnight Glow',
    price: 1990000,
    originalPrice: 2200000,
    image_url: serumImg,
    category: 'Serum & Tinh chất',
    description: 'Serum tái tạo ban đêm với phức hợp thảo mộc quý hiếm, cải thiện nếp nhăn li ti và tăng sinh collagen cho làn da tươi trẻ rạng ngời.',
    ingredients: 'Chiết xuất nấm linh chi, nhân sâm đỏ, tinh dầu hoa anh thảo hữu cơ, peptide phức hợp',
    tag: 'Chống lão hóa',
    organic: false,
    stock: 12,
  },
  {
    id: 'prod-5',
    name: 'Muối Thảo Dược Ngâm Chân Thải Độc Hoàng Cung',
    price: 250000,
    originalPrice: 300000,
    image_url: maskImg,
    category: 'Thảo dược ngâm chân & Body',
    description: 'Muối khoáng hầm kết hợp ngải cứu, quế chi, gừng già và thiên niên kiện giúp kích thích tuần hoàn máu, giải trừ hàn khí, hỗ trợ ngủ ngon giấc.',
    ingredients: 'Muối hầm biển Đề Gi, ngải cứu khô, gừng gió, quế khâu, thảo quả, tinh dầu tràm gió',
    tag: 'Thư giãn dưỡng sinh',
    organic: true,
    stock: 50,
  },
  {
    id: 'prod-6',
    name: 'Dầu Gội Bồ Kết Nấu Tươi Thủ Công',
    price: 320000,
    originalPrice: 380000,
    image_url: serumImg,
    category: 'Chăm sóc tóc dưỡng sinh',
    description: 'Nước gội thảo dược cô đặc nấu từ bồ kết nướng than hoa, vỏ bưởi, hương nhu và cỏ mần trầu giúp giảm rụng tóc, sạch gàu và kích thích mọc tóc dày mượt.',
    ingredients: 'Bồ kết nướng, vỏ bưởi da xanh, cỏ mần trầu, hà thủ ô đỏ, lá sả chanh',
    tag: 'Thuần chay 100%',
    organic: true,
    stock: 35,
  }
]

export default function Shop() {
  const { addToCart, totalItems, setIsCartOpen } = useCart()
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default')
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null)

  // Fetch products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          const mapped: ProductItem[] = data.map((item: any, idx: number) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            image_url: item.image_url || (idx % 3 === 0 ? serumImg : idx % 3 === 1 ? maskImg : sunscreenImg),
            category: item.category || 'Mỹ phẩm thảo mộc',
            description: item.description,
            stock: item.stock !== undefined ? Number(item.stock) : 20,
            organic: true,
            tag: item.stock > 0 ? 'Có sẵn' : 'Hết hàng',
          }))
          setProducts(mapped)
        }
      } catch (err) {
        console.warn('Sử dụng danh mục sản phẩm mặc định:', err)
      }
    }
    fetchProducts()
  }, [])

  // Unique categories list
  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ['all', ...Array.from(set)]
  }, [products])

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price
        if (sortBy === 'price-desc') return b.price - a.price
        return 0
      })
  }, [products, selectedCategory, searchQuery, sortBy])

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

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 text-accent text-xs font-semibold uppercase tracking-wider mb-2">
            <Leaf className="w-4 h-4" />
            <span>Mỹ phẩm thuần chay & Dưỡng sinh cao cấp</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-primary">
            Sản Phẩm Chăm Sóc Thảo Mộc
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Các dòng mỹ phẩm hữu cơ chiết xuất tự nhiên được Eva Spa chọn lọc kỹ lưỡng, an toàn lành tính cho mọi làn da.
          </p>
        </div>

        {/* Cart trigger button */}
        <Button
          onClick={() => setIsCartOpen(true)}
          variant="outline"
          className="relative border-border bg-card hover:bg-secondary flex items-center gap-2.5 rounded-xl px-4 py-5 shadow-xs cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 text-primary" />
          <span className="font-semibold text-xs text-foreground">Giỏ hàng của bạn</span>
          <span className="bg-accent text-accent-foreground text-xs font-bold rounded-full h-5.5 min-w-[22px] px-1.5 flex items-center justify-center shadow-xs animate-in zoom-in">
            {totalItems}
          </span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-2xs mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm mỹ phẩm, tinh chất, mặt nạ thảo mộc..."
              className="pl-10 rounded-xl bg-background border-border text-xs sm:text-sm"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="default">Sắp xếp: Mặc định</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-accent" />
            <span>Danh mục:</span>
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-white font-semibold shadow-xs'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/40'
              }`}
            >
              {cat === 'all' ? 'Tất cả sản phẩm' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border space-y-3">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-foreground">Không tìm thấy sản phẩm phù hợp</h3>
          <p className="text-xs text-muted-foreground">Thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc danh mục.</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
            }}
            className="rounded-xl text-xs mt-2"
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            const img = p.image_url || p.img || serumImg
            return (
              <Card 
                key={p.id} 
                className="flex flex-col overflow-hidden rounded-2xl border-border/80 hover:border-primary/40 hover:shadow-lg transition-all duration-300 group bg-card"
              >
                {/* Image & Badges */}
                <div 
                  className="relative h-60 w-full bg-secondary/30 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedProduct(p)}
                >
                  <img 
                    src={img} 
                    alt={p.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  {p.tag && (
                    <span className="absolute top-3 left-3 bg-primary/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 shadow-xs">
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

                  {/* Hover Quick View Button */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-background/95 text-foreground text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      Xem chi tiết
                    </span>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="pt-4 flex-grow text-left space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    {p.category || 'Mỹ phẩm thảo mộc'}
                  </span>

                  <CardTitle 
                    onClick={() => setSelectedProduct(p)}
                    className="text-base font-serif font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2 cursor-pointer"
                  >
                    {p.name}
                  </CardTitle>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {p.description || 'Chiết xuất từ thảo mộc thiên nhiên được tuyển chọn kỹ lưỡng.'}
                  </p>

                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-accent font-bold text-lg">
                      {p.price.toLocaleString('vi-VN')}đ
                    </span>
                    {p.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {p.originalPrice.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                </CardContent>

                {/* Footer Buttons */}
                <CardFooter className="pt-0 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProduct(p)}
                    className="rounded-xl border-border text-xs hover:bg-secondary font-medium"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Chi tiết
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs gap-1.5 font-medium shadow-xs" 
                    onClick={() => handleQuickAdd(p)}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Thêm giỏ</span>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

    </div>
  )
}
