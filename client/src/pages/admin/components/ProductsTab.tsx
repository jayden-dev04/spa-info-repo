import { useState, useMemo } from 'react'
import { Plus, Search, Package, Edit2, Trash2, CheckCircle2, AlertTriangle, XCircle, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export interface AdminProduct {
  id: string | number
  name: string
  price: number
  stock: number
  category?: string
  description?: string
  image_url?: string
  is_active?: boolean
  created_at?: string
}

interface ProductsTabProps {
  products: AdminProduct[]
  loading: boolean
  onRefresh: () => void
}

export default function ProductsTab({ products, loading, onRefresh }: ProductsTabProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '20',
    category: 'Serum & Tinh chất',
    description: '',
    image_url: '',
  })

  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ['all', ...Array.from(set)]
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase())
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory
      return matchSearch && matchCat
    })
  }, [products, search, selectedCategory])

  const handleOpenAdd = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      price: '',
      stock: '20',
      category: 'Serum & Tinh chất',
      description: '',
      image_url: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (p: AdminProduct) => {
    setEditingProduct(p)
    setFormData({
      name: p.name || '',
      price: String(p.price || ''),
      stock: String(p.stock || '0'),
      category: p.category || 'Serum & Tinh chất',
      description: p.description || '',
      image_url: p.image_url || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string | number, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success(`Đã xóa sản phẩm "${name}"`)
      onRefresh()
    } catch (err: any) {
      toast.error('Lỗi khi xóa sản phẩm', { description: err.message })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.price) {
      toast.error('Vui lòng điền tên và giá sản phẩm')
      return
    }

    setSubmitting(true)
    const payload = {
      name: formData.name,
      price: Number(formData.price),
      stock: Number(formData.stock) || 0,
      category: formData.category,
      description: formData.description,
      image_url: formData.image_url || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    }

    try {
      if (editingProduct) {
        // Update
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id)

        if (error) throw error
        toast.success(`Cập nhật sản phẩm "${formData.name}" thành công!`)
      } else {
        // Insert
        const { error } = await supabase
          .from('products')
          .insert(payload)

        if (error) throw error
        toast.success(`Thêm mới sản phẩm "${formData.name}" thành công!`)
      }

      setIsModalOpen(false)
      onRefresh()
    } catch (err: any) {
      toast.error('Lỗi lưu sản phẩm', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header & Actions */}
      <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-serif font-bold text-lg">
            <Package className="w-5 h-5 text-accent" />
            <span>Quản Lý Sản Phẩm TMĐT</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Danh sách mỹ phẩm, tinh chất và sản phẩm thảo mộc đang bán trên website
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Sản Phẩm Mới</span>
        </Button>
      </div>

      {/* Filter & Search */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-2xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên sản phẩm, danh mục..."
            className="pl-10 rounded-xl bg-background border-border text-xs"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-accent mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-white font-semibold'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat === 'all' ? 'Tất cả' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid / Table */}
      {loading ? (
        <div className="bg-card p-12 rounded-2xl border border-border text-center text-muted-foreground text-sm">
          <p>Đang tải danh sách sản phẩm...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-card p-12 rounded-2xl border border-dashed border-border text-center space-y-2 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="font-semibold text-foreground">Chưa có sản phẩm nào</p>
          <p className="text-xs">Bấm "Thêm Sản Phẩm Mới" để tạo mặt hàng thảo mộc đầu tiên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
            const isOut = p.stock <= 0
            const isLow = p.stock > 0 && p.stock <= 5

            return (
              <Card key={p.id} className="rounded-2xl border-border/80 hover:shadow-md transition-all overflow-hidden flex flex-col bg-card">
                <div className="relative h-44 w-full bg-secondary/30 overflow-hidden">
                  <img
                    src={p.image_url || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-primary/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {p.category || 'Mỹ phẩm'}
                  </span>

                  {/* Stock status badge */}
                  <span className="absolute top-3 right-3">
                    {isOut ? (
                      <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] py-0.5">
                        <XCircle className="w-3 h-3 mr-1" />
                        Hết hàng
                      </Badge>
                    ) : isLow ? (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] py-0.5">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Còn {p.stock}
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] py-0.5">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Còn {p.stock} món
                      </Badge>
                    )}
                  </span>
                </div>

                <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif font-bold text-sm text-foreground line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {p.description || 'Sản phẩm chiết xuất thảo mộc hữu cơ thiên nhiên.'}
                    </p>
                    <div className="mt-2 text-accent font-bold text-base">
                      {Number(p.price).toLocaleString('vi-VN')}đ
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Tồn kho: <strong className="text-foreground">{p.stock}</strong>
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(p)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(p.id, p.name)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="font-serif font-bold text-lg text-primary">
                {editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="font-semibold text-foreground">Tên sản phẩm *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Tinh Chất Cấp Ẩm Thảo Mộc Danique"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="font-semibold text-foreground">Giá bán (VNĐ) *</Label>
                  <Input
                    id="price"
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="1690000"
                    className="rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stock" className="font-semibold text-foreground">Số lượng tồn kho *</Label>
                  <Input
                    id="stock"
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="25"
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category" className="font-semibold text-foreground">Danh mục</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-primary"
                >
                  <option value="Serum & Tinh chất">Serum & Tinh chất</option>
                  <option value="Mặt nạ thảo mộc">Mặt nạ thảo mộc</option>
                  <option value="Chống nắng & Dưỡng da">Chống nắng & Dưỡng da</option>
                  <option value="Thảo dược ngâm chân & Body">Thảo dược ngâm chân & Body</option>
                  <option value="Chăm sóc tóc dưỡng sinh">Chăm sóc tóc dưỡng sinh</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="image_url" className="font-semibold text-foreground">Link hình ảnh sản phẩm</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="font-semibold text-foreground">Mô tả sản phẩm</Label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả công dụng và các thành phần thảo mộc hữu cơ..."
                  className="w-full rounded-xl border border-input bg-background p-2.5 text-xs focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold px-5 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : editingProduct ? 'Cập Nhật' : 'Tạo Sản Phẩm'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
