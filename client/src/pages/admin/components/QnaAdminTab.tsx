import { useState, useEffect, useCallback } from 'react'
import { HelpCircle, RefreshCw, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type QnaRow = {
  id: string
  name?: string
  email?: string
  question: string
  answer?: string
  status: 'pending' | 'answered'
  created_at?: string
  answered_at?: string
}

// Tab quản lý Hỏi–Đáp: xem câu hỏi pending, trả lời → status 'answered' (hiện công khai trên trang chủ)
export default function QnaAdminTab() {
  const [items, setItems] = useState<QnaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'answered'>('pending')
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('qna')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (!error && Array.isArray(data)) setItems(data as QnaRow[])
      else toast.error('Không tải được câu hỏi', { description: error?.message || 'DB chưa có bảng qna — chạy migration 20261001000000' })
    } catch (e: any) {
      toast.error('Lỗi kết nối: ' + e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const answer = async (id: string) => {
    const text = (drafts[id] || '').trim()
    if (!text) return
    try {
      const { error } = await supabase
        .from('qna')
        .update({ answer: text, status: 'answered', answered_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      toast.success('Đã trả lời — câu hỏi hiển thị công khai trên trang chủ')
      setDrafts((prev) => ({ ...prev, [id]: '' }))
      load()
    } catch (e: any) {
      toast.error('Lỗi gửi trả lời: ' + e.message)
    }
  }

  const shown = items.filter((i) => i.status === filter)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Quản lý Hỏi – Đáp</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border overflow-hidden text-xs">
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-2 font-semibold ${filter === 'pending' ? 'bg-amber-500 text-white' : 'bg-card hover:bg-secondary'}`}
            >
              Chờ trả lời ({items.filter((i) => i.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('answered')}
              className={`px-3 py-2 font-semibold ${filter === 'answered' ? 'bg-emerald-600 text-white' : 'bg-card hover:bg-secondary'}`}
            >
              Đã trả lời ({items.filter((i) => i.status === 'answered').length})
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="rounded-xl">
            <RefreshCw className="w-3.5 h-3.5" /> Tải lại
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">Đang tải...</div>
      ) : shown.length === 0 ? (
        <div className="text-sm text-muted-foreground py-10 text-center border border-dashed border-border rounded-2xl">
          Không có câu hỏi nào ở mục này.
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{item.question}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {item.name || 'Khách ẩn danh'}
                    {item.email ? ` · ${item.email}` : ''}
                    {item.created_at ? ` · ${new Date(item.created_at).toLocaleString('vi-VN')}` : ''}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                  item.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {item.status === 'pending' ? 'Chờ trả lời' : 'Đã trả lời'}
                </span>
              </div>

              {item.status === 'answered' && item.answer ? (
                <div className="bg-secondary/40 rounded-xl p-3 text-sm text-muted-foreground border border-border/60">
                  <span className="font-semibold text-primary">Trả lời: </span>{item.answer}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={drafts[item.id] || ''}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && answer(item.id)}
                    placeholder="Nhập câu trả lời..."
                    className="h-10 rounded-xl text-sm"
                  />
                  <Button onClick={() => answer(item.id)} className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-4 shrink-0">
                    <Send className="w-4 h-4" /> Trả lời
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
