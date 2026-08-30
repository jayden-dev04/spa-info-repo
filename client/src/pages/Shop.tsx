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

type ProductRow = {
  id?: unknown; name?: unknown; price?: unknown; stock?: unknown;
  image_url?: unknown; category?: unknown; description?: unknown;
  original_price?: unknown;
}
const isRow = (v: unknown): v is ProductRow => !!v && typeof v === 'object'

// 20 sản phẩm — MỌI image_url đã kiểm tra HTTP HEAD = 200 (xem
// client/scripts/fetch-product-images.mjs). onError() trong JSX bên dưới
// sẽ tự fallback ảnh local serum/mask/sunscreen nếu ngoại cảnh chặn Unsplash.
const DEFAULT_PRODUCTS: ProductItem[] = [
  { id: 'prod-1', name: 'Tinh Chất Cấp Ẩm Thảo Mộc Danique', price: 1690000, originalPrice: 1890000, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', category: 'Serum & Tinh chất', description: 'Tinh chất cấp ẩm chuyên sâu chứa tế bào gốc thực vật và chiết xuất cam thảo, giúp phục hồi màng ẩm tự nhiên, cho da căng bóng mịn màng.', ingredients: 'Chiết xuất cam thảo hữu cơ, tế bào gốc rau má, HA đa phân tử, Niacinamide 5%', tag: 'Bán chạy nhất', organic: true, stock: 25 },
  { id: 'prod-2', name: 'Huyết Thanh Phục Hồi Midnight Glow', price: 1990000, originalPrice: 2200000, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', category: 'Serum & Tinh chất', description: 'Serum tái tạo ban đêm với phức hợp thảo mộc quý hiếm, cải thiện nếp nhăn li ti và tăng sinh collagen cho làn da tươi trẻ rạng ngời.', ingredients: 'Chiết xuất nấm linh chi, nhân sâm đỏ, tinh dầu hoa anh thảo hữu cơ, peptide phức hợp', tag: 'Phục hồi đêm', organic: true, stock: 12 },
  { id: 'prod-3', name: 'Serum Vitamin C Sáng Da Cam Thảo', price: 890000, originalPrice: 990000, image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80', category: 'Serum & Tinh chất', description: 'Tinh chất vitamin C dạng ổn định kết hợp cam thảo, làm sáng vùng da xỉn màu và đều màu da mà không gây kích ứng.', ingredients: 'Vitamin C dạng SAP 10%, chiết xuất cam thảo, Ferulic acid, Panthenol', tag: 'Sáng da', organic: true, stock: 30 },
  { id: 'prod-4', name: 'Mặt Nạ Đất Sét Tràm Trà', price: 480000, originalPrice: 550000, image_url: 'https://images.unsplash.com/photo-1631730359585-38a4935cbec4?auto=format&fit=crop&w=800&q=80', category: 'Mặt nạ thảo mộc', description: 'Mặt nạ đất sét kết hợp tràm trà, hút sạch dầu thừa bã nhờn, làm dịu các nốt mụn sưng viêm nhanh chóng.', ingredients: 'Đất sét trắng Kaolin, tinh dầu tràm trà, chiết xuất cúc La Mã', tag: 'Cho da dầu mụn', organic: true, stock: 35 },
  { id: 'prod-5', name: 'Mặt Nạ Dưỡng Ẩm Rau Má Hoa Cúc', price: 540000, originalPrice: 620000, image_url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80', category: 'Mặt nạ thảo mộc', description: 'Mặt nạ dưỡng ẩm dịu nhẹ từ rau má và hoa cúc, cấp nước tức thì, làm dịu da khô rát sau một ngày dài.', ingredients: 'Chiết xuất rau má, hoa cúc La Mã, HA đa phân tử, Allantoin', tag: 'Dịu da', organic: true, stock: 40 },
  { id: 'prod-6', name: 'Gel Rửa Mặt Bọt Rau Má', price: 360000, originalPrice: 420000, image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80', category: 'Làm sạch da', description: 'Gel rửa mặt tạo bọt mềm từ rau má, làm sạch sâu mà không gây khô căng, phù hợp cho da nhạy cảm.', ingredients: 'Chiết xuất rau má, amino acid dịu nhẹ, Glycerin', tag: 'Làm dịu', organic: true, stock: 45 },
  { id: 'prod-7', name: 'Nước Tẩy Trang Dầu Dừa Nguyên Chất', price: 290000, originalPrice: 340000, image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80', category: 'Làm sạch da', description: 'Nước tẩy trang gốc dầu dừa hòa tan lớp trang điểm và bã nhờn tức thì, để lại làn da sạch thoáng.', ingredients: 'Dầu dừa ép lạnh, Polysorbate dịu nhẹ, Vitamin E', tag: 'Sạch sâu', organic: true, stock: 50 },
  { id: 'prod-8', name: 'Toner Hoa Hồng Cấp Ẩm Không Cồn', price: 420000, originalPrice: 480000, image_url: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80', category: ' Làm sạch da', description: 'Nước cân bằng không cồn với chiết xuất hoa hồng, cấp ẩm và se khít lỗ chân lông tức thì.', ingredients: 'Nước cất hoa hồng Damask, HA, Panthenol', tag: 'Cân bằng da', organic: true, stock: 33 },
  { id: 'prod-9', name: 'Kem Chống Nắng Vật Lý Thảo Dược SPF 50+', price: 790000, originalPrice: 890000, image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80', category: 'Chống nắng & Dưỡng da', description: 'Kem chống nắng vật lý phổ rộng bảo vệ da tối ưu trước tia UVA/UVB và ánh sáng xanh, nâng tông nhẹ tự nhiên không để lại vệt trắng.', ingredients: 'Zinc Oxide 12%, chiết xuất hoa sen tuyết, tinh dầu hạt tầm xuân, Vitamin E tự nhiên', tag: 'Dịu nhẹ cho da', organic: true, stock: 18 },
  { id: 'prod-10', name: 'Kem Dưỡng Nghệ + Linh Chi Ban Đêm', price: 780000, originalPrice: 880000, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', category: 'Chống nắng & Dưỡng da', description: 'Kem dưỡng ban đêm kết hợp curcumin nghệ và nấm linh chi, phục hồi da tổn thương và làm đều màu da qua đêm.', ingredients: 'Nano curcumin, chiết xuất linh chi, Squalane', tag: 'Phục hồi đêm', organic: true, stock: 20 },
  { id: 'prod-11', name: 'Muối Thảo Dược Ngâm Chân Thải Độc Hoàng Cung', price: 250000, originalPrice: 300000, image_url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80', category: 'Thảo dược ngâm chân & Body', description: 'Muối khoáng hầm kết hợp ngải cứu, quế chi, gừng già và thiên niên kiện giúp kích thích tuần hoàn máu, giải trừ hàn khí, hỗ trợ ngủ ngon giấc.', ingredients: 'Muối hầm biển Đề Gi, ngải cứu khô, gừng gió, quế khâu, thảo quả, tinh dầu tràm gió', tag: 'Thư giãn dưỡng sinh', organic: true, stock: 50 },
  { id: 'prod-12', name: 'Túi Ngâm Thảo Mộc Cổ Vai Gáy', price: 320000, originalPrice: 380000, image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80', category: 'Thảo dược ngâm chân & Body', description: 'Túi chườm thảo mộc giúp giảm đau mỏi cổ vai gáy sau nhiều giờ ngồi máy tính.', ingredients: 'Ngải cứu, hương nhu, long não', tag: 'Giảm đau mỏi', organic: true, stock: 30 },
  { id: 'prod-13', name: 'Body Scrub Cà Phê Đắk Lắk', price: 390000, originalPrice: 450000, image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80', category: 'Chăm sóc Body', description: 'Tẩy tế bào chết body từ cà phê Đắk Lắk và đường nâu, cho da mềm mịn sáng khỏe.', ingredients: 'Bột cà phê Đắk Lắk, đường nâu, dầu dừa ép lạnh', tag: 'Tẩy tế bào chết', organic: true, stock: 26 },
  { id: 'prod-14', name: 'Dầu Gội Bồ Kết Nấu Tươi Thủ Công', price: 320000, originalPrice: 380000, image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80', category: 'Chăm sóc tóc dưỡng sinh', description: 'Nước gội thảo dược cô đặc nấu từ bồ kết nướng than hoa, vỏ bưởi, hương nhu và cỏ mần trầu giúp giảm rụng tóc, sạch gàu và kích thích mọc tóc dày mượt.', ingredients: 'Bồ kết nướng, vỏ bưởi da xanh, cỏ mần trầu, hà thủ ô đỏ, lá sả chanh', tag: 'Thuần chay 100%', organic: true, stock: 35 },
  { id: 'prod-15', name: 'Dầu Xả Vỏ Bưởi Hương Nhu', price: 300000, originalPrice: 350000, image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', category: 'Chăm sóc tóc dưỡng sinh', description: 'Dầu xả thảo dược mượt tóc, giảm xơ rối, lưu hương sả bưởi dịu nhẹ.', ingredients: 'Tinh dầu bưởi, hương nhu, Panthenol', tag: 'Mềm mượt', organic: true, stock: 32 },
  { id: 'prod-16', name: 'Son Dưỡng Môi Mật Ong & Nghệ', price: 180000, originalPrice: 210000, image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80', category: 'Chăm sóc môi', description: 'Son dưỡng môi từ mật ong và nano curcumin, dưỡng ẩm và phục hồi môi khô nứt.', ingredients: 'Sáp ong, mật ong rừng, nano curcumin, dầu dừa', tag: 'Dưỡng ẩm', organic: true, stock: 60 },
  { id: 'prod-17', name: 'Trà Dưỡng Sinh Hoa Cúc Kỷ Tử Hộp 30 Gói', price: 220000, originalPrice: 260000, image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80', category: 'Dưỡng sinh bên trong', description: 'Trà hoa cúc kỷ tử thanh nhiệt, hỗ trợ ngủ ngon, hộp 30 gói lọc tiện lợi.', ingredients: 'Hoa cúc sấy lạnh, kỷ tử, cam thảo', tag: 'Thanh nhiệt', organic: true, stock: 44 },
  { id: 'prod-18', name: 'Cao Gừng Mật Ong Nguyên Chất', price: 260000, originalPrice: 300000, image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80', category: 'Dưỡng sinh bên trong', description: 'Cao gừng mật ong nguyên chất, giữ ấm cơ thể, hỗ trợ tiêu hóa.', ingredients: 'Gừng gió, mật ong rừng', tag: 'Giữ ấm', organic: true, stock: 36 },
  { id: 'prod-19', name: 'Bộ Kit Chăm Sóc Da Thảo Mộc 4 Bước', price: 1490000, originalPrice: 1790000, image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80', category: 'Bộ sản phẩm', description: 'Bộ 4 bước: tẩy trang, sữa rửa mặt, toner và kem dưỡng thảo mộc. Tiết kiệm hơn mua lẻ.', ingredients: 'Nước tẩy trang, gel rửa mặt, toner hoa hồng, kem dưỡng nghệ', tag: 'Tiết kiệm 300k', organic: true, stock: 15 },
  { id: 'prod-20', name: 'Bộ Quà Tặng Dưỡng Sinh Hoàng Cung', price: 2290000, originalPrice: 2690000, image_url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80', category: 'Bộ sản phẩm', description: 'Set quà tặng dưỡng sinh cao cấp: muối ngâm chân, túi chườm, trà và nến thơm thảo mộc.', ingredients: 'Muối thảo dược, túi chườm cổ vai gáy, trà hoa cúc, nến tinh dầu', tag: 'Quà tặng cao cấp', organic: true, stock: 10 },
]

export default function Shop() {
  const { addToCart, totalItems, setIsCartOpen } = useCart()
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default')
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null)

  // Ảnh dự phòng khi Unsplash bị chặn: lần lượt serum -> mask -> sunscreen.
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    if (img.dataset.stage === 'unsplash') { img.src = maskImg; img.dataset.stage = 'mask' }
    else if (img.dataset.stage === 'mask') { img.src = sunscreenImg; img.dataset.stage = 'sunscreen' }
  }

  // Fetch products from Supabase (data thật > DEFAULT_PRODUCTS)
  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && Array.isArray(data) && data.length > 0) {
          const mapped: ProductItem[] = data.filter(isRow).map((item, idx) => ({
            id: typeof item.id === 'string' ? item.id : `db-${idx}`,
            name: typeof item.name === 'string' ? item.name : 'Sản phẩm',
            price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
            image_url: typeof item.image_url === 'string' && item.image_url
              ? item.image_url
              : (idx % 3 === 0 ? serumImg : idx % 3 === 1 ? maskImg : sunscreenImg),
            originalPrice: typeof item.original_price === 'number'
              ? item.original_price
              : (typeof item.original_price === 'string' ? Number(item.original_price) || undefined : undefined),
            category: typeof item.category === 'string' && item.category ? item.category : 'Mỹ phẩm thảo mộc',
            description: typeof item.description === 'string' ? item.description : undefined,
            stock: typeof item.stock === 'number' ? item.stock : Number(item.stock) || 20,
            organic: true,
            tag: (typeof item.stock === 'number' ? item.stock : Number(item.stock) || 0) > 0 ? 'Có sẵn' : 'Hết hàng',
          }))
          setProducts(mapped)
        }
      } catch (err) {
        console.warn('Sử dụng danh mục sản phẩm mặc định:', err)
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

  // Lọc + sắp xếp
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

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm sản phẩm, thành phần, công dụng..."
            className="pl-10 rounded-xl"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-foreground hover:bg-secondary/70'
              }`}
            >
              {cat === 'all' ? 'Tất cả' : cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value === 'price-asc' ? 'price-asc' : e.target.value === 'price-desc' ? 'price-desc' : 'default')}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
          >
            <option value="default">Mặc định</option>
            <option value="price-asc">Giá thấp → cao</option>
            <option value="price-desc">Giá cao → thấp</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShoppingBag className="w-4 h-4" />
          <span>{totalItems} sản phẩm trong giỏ</span>
          {totalItems > 0 && (
            <Button size="sm" onClick={() => setIsCartOpen(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Xem giỏ
            </Button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Filter className="w-8 h-8 mx-auto mb-3 opacity-60" />
          <p>Không tìm thấy sản phẩm phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            const img = p.image_url || p.img || serumImg
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
                    <span className="text-base font-bold text-accent">
                      {p.price.toLocaleString('vi-VN')}đ
                    </span>
                    {p.originalPrice && (
                      <span className="text-xs line-through text-muted-foreground">
                        {p.originalPrice.toLocaleString('vi-VN')}đ
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

      {/* Chi tiết sản phẩm */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  )
}
