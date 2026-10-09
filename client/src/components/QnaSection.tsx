import { useState, useEffect } from 'react'
import { HelpCircle, Send, MessageSquareQuote, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type QnaRow = {
  id: string
  name?: string
  question: string
  answer?: string
  status: string
  created_at?: string
}

// Diễn đàn Hỏi – Đáp (offline Q&A):
// - Khách gửi câu hỏi → lưu bảng qna (status 'pending').
// - Admin trả lời từ Dashboard → câu hỏi chuyển 'answered' và hiển thị công khai.
// - FALLBACK DEMO: khi Supabase offline, dùng danh sách Q&A mẫu + lưu câu hỏi mới vào localStorage.
const DEMO_QNA: QnaRow[] = [
  {
    id: 'demo-1', name: 'Thu Hà', status: 'answered',
    question: 'Gội đầu dưỡng sinh thảo dược có phù hợp với người đang bị rụng tóc nhiều không ạ?',
    answer: 'Dạ có ạ! Nước gội bồ kết nấu tươi kết hợp bài massage ấn huyệt giúp giảm gàu, kích thích mọc tóc. Với tình trạng rụng tóc, chị nên duy trì liệu trình 2 tuần/lần trong 2 tháng để thấy rõ hiệu quả.',
    created_at: '2026-09-20T09:00:00Z',
  },
  {
    id: 'demo-2', name: 'Minh Trí', status: 'answered',
    question: 'Spa có nhận đặt lịch buổi tối không? Mình chỉ rảnh sau 19h.',
    answer: 'Dạ có ạ! Eva Spa mở cửa đến 21h00 hằng ngày, anh có thể chọn khung giờ 19h00 hoặc 20h00 khi đặt lịch trên website. Nên đặt trước 1 ngày để spa chuẩn bị phòng liệu trình.',
    created_at: '2026-09-24T14:30:00Z',
  },
  {
    id: 'demo-3', name: 'Lan Anh', status: 'answered',
    question: 'Mỹ phẩm thảo mộc bên mình có được kiểm nghiệm da liễu không, da mình nhạy cảm?',
    answer: 'Dạ toàn bộ sản phẩm đều chiết xuất thảo mộc tự nhiên, không paraben, đã thử nghiệm độ an toàn trên da nhạy cảm. Với da quá nhạy cảm, chị nên thử trước ở vùng da tay trong 24h trước khi dùng trên mặt ạ.',
    created_at: '2026-09-28T08:15:00Z',
  },
]

const PENDING_KEY = 'eva_qna_pending_local'

export default function QnaSection() {
  const [items, setItems] = useState<QnaRow[]>(DEMO_QNA)
  const [name, setName] = useState('')
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [sentOk, setSentOk] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [dbOk, setDbOk] = useState<boolean | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('qna')
          .select('*')
          .eq('status', 'answered')
          .order('answered_at', { ascending: false })
          .limit(20)
        if (!error && Array.isArray(data) && data.length > 0) {
          setDbOk(true)
          setItems(data as QnaRow[])
        } else if (error) {
          setDbOk(false)
          loadLocalPending()
        }
      } catch {
        setDbOk(false)
        loadLocalPending()
      }
    }
    function loadLocalPending() {
      try {
        const local = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]') as QnaRow[]
        if (local.length > 0) setItems([...local, ...DEMO_QNA])
      } catch { /* ignore */ }
    }
    load()
  }, [])

  const submit = async () => {
    const q = question.trim()
    if (!q) return
    setSending(true)
    setSentOk('')
    const row: QnaRow = {
      id: 'local-' + Date.now(),
      name: name.trim() || 'Khách ẩn danh',
      question: q,
      status: 'pending',
      created_at: new Date().toISOString(),
    }
    try {
      const { error } = await supabase.from('qna').insert({
        name: row.name, question: q, status: 'pending',
      })
      if (error) throw error
      setSentOk('Câu hỏi đã được gửi! Bác thuật viên Eva Spa sẽ trả lời trong 24h.')
    } catch {
      // Offline → lưu local để demo, admin tab vẫn thấy khi restore DB
      const local = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]') as QnaRow[]
      localStorage.setItem(PENDING_KEY, JSON.stringify([...local, row]))
      setItems((prev) => [row, ...prev])
      setSentOk('Chế độ offline: câu hỏi được lưu tạm. Khi kết nối database, câu hỏi sẽ đồng bộ lên hệ thống.')
    }
    setQuestion('')
    setName('')
    setSending(false)
  }

  return (
    <section id="qna" className="py-20 bg-secondary/50 border-y border-border">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-accent font-semibold text-xs tracking-wider uppercase">
            <HelpCircle className="w-4 h-4" />
            <span>Diễn đàn hỏi &amp; đáp</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primary">Bạn Có Thắc Mắc? Chúng Tôi Giải Đáp</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gửi câu hỏi về liệu trình, sản phẩm hoặc đặt lịch — đội ngũ Eva Spa sẽ trả lời trong vòng 24 giờ.
            {dbOk === false && <span className="block text-xs mt-2 text-amber-700">(Chế độ demo offline — câu hỏi lưu tạm trên máy)</span>}
          </p>
        </div>

        {/* Form gửi câu hỏi */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-10 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-3 mb-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên của bạn (không bắt buộc)"
              className="h-11 rounded-xl"
            />
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Câu hỏi của bạn về liệu trình, sản phẩm, đặt lịch..."
              className="h-11 rounded-xl"
            />
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {sentOk || 'Câu trả lời sẽ hiển thị công khai tại đây để mọi khách hàng cùng tham khảo.'}
            </span>
            <Button
              onClick={submit}
              disabled={sending || !question.trim()}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl h-11 px-6"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Gửi câu hỏi
            </Button>
          </div>
        </div>

        {/* Danh sách Q&A đã trả lời */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
            <MessageSquareQuote className="w-4 h-4 text-primary" />
            {items.length} câu hỏi đã được giải đáp
          </div>
          {items.map((item) => {
            const open = expanded === item.id
            return (
              <div key={item.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpanded(open ? null : item.id)}
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-secondary/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground leading-snug">{item.question}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {item.name || 'Khách ẩn danh'} · {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : ''}
                    </div>
                  </div>
                  {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
                </button>
                {open && item.answer && (
                  <div className="px-5 pb-5 pt-1 border-t border-border/60 bg-secondary/20">
                    <div className="text-xs font-semibold text-primary uppercase tracking-wide mt-3 mb-1.5">Eva Spa trả lời:</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
