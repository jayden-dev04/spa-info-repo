import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { API_BASE } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ChatMessage = {
  id: string
  session_id: string
  sender: 'customer' | 'admin'
  message: string
  created_at?: string
  _local?: boolean
}

// Chat hỗ trợ trực tuyến (online discussion):
// - Khách chat → lưu vào bảng chat_messages (Supabase) theo session_id (localStorage).
// - Admin trả lời từ Dashboard → khách nhận lại nhờ polling 5s.
// - FALLBACK DEMO: khi Supabase không kết nối được (lớp học/offline), tự trả lời
//   bằng bot mô phỏng để vẫn demo được tính năng "thảo luận trực tiếp".
const SESSION_KEY = 'eva_chat_session_id'

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = 'sess-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

const BOT_REPLIES = [
  'Cảm ơn anh/chị đã liên hệ Eva Spa! Bộ phận CSKH sẽ phản hồi trong ít phút nữa 🌿',
  'Dạ vâng, anh/chị muốn đặt lịch liệu trình nào ạ? Gội đầu dưỡng sinh, chăm sóc da hay massage đá nóng?',
  'Eva Spa mở cửa 8h00 – 21h00 hằng ngày tại Cần Thơ. Anh/chị có thể đặt lịch nhanh ở trang "Đặt lịch" ạ.',
  'Hiện spa đang có ưu đãi freeship cho đơn mỹ phẩm từ 500.000đ. Anh/chị cần tư vấn thêm về sản phẩm không ạ?',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [demoMode, setDemoMode] = useState(false)
  const [aiReplying, setAiReplying] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)
  const sessionId = useRef(getSessionId())
  const bodyRef = useRef<HTMLDivElement>(null)
  const botIdx = useRef(0)

  // Nạp lịch sử từ DB (nếu có) + polling tin nhắn mới của admin
  useEffect(() => {
    if (!open) return
    let alive = true

    // Hỏi backend 1 lần: AI có bật không (không phụ thuộc Supabase)
    fetch(`${API_BASE}/api/ai-chat/status`)
      .then((r) => r.json())
      .then((s) => { if (alive && s?.enabled) setAiEnabled(true) })
      .catch(() => {})

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId.current)
          .order('created_at', { ascending: true })
          .limit(100)
        if (!error && Array.isArray(data) && data.length > 0) {
          if (alive) {
            setDemoMode(false)
            setMessages(data as ChatMessage[])
          }
        } else if (error) {
          // Supabase không truy cập được → demo mode
          if (alive) setDemoMode(true)
        }
      } catch {
        if (alive) setDemoMode(true)
      }
    }
    load()
    const timer = setInterval(load, 5000)
    return () => { alive = false; clearInterval(timer) }
  }, [open])

  // Auto scroll xuống cuối
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  const send = async () => {
    const text = input.trim()
    if (!text || aiReplying) return
    setInput('')

    // Hiển thị tin nhắn khách ngay (local)
    const mine: ChatMessage = {
      id: 'local-' + Date.now(), session_id: sessionId.current,
      sender: 'customer', message: text, _local: true,
    }
    setMessages((prev) => [...prev, mine])

    // === ƯU TIÊN 1: AI thật (backend → LLM) ===
    if (aiEnabled) {
      setAiReplying(true)
      try {
        const history = [...messages, mine]
          .slice(-12)
          .map((m) => ({ role: m.sender, message: m.message }))
        const res = await fetch(`${API_BASE}/api/ai-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
        })
        const data = await res.json()
        setAiReplying(false)
        if (data?.reply) {
          setMessages((prev) => [...prev, {
            id: 'ai-' + Date.now(), session_id: sessionId.current,
            sender: 'admin', message: data.reply, _local: true,
          }])
          return
        }
      } catch {
        setAiReplying(false)
      }
      // AI fail → rơi xuống nhánh DB/demo bên dưới
    }

    // === ƯU TIÊN 2: DB sống → lưu, chờ admin trả lời qua polling ===
    if (!demoMode) {
      try {
        const { error } = await supabase.from('chat_messages').insert({
          session_id: sessionId.current,
          sender: 'customer',
          message: text,
        })
        if (!error) return
      } catch { /* rơi xuống demo */ }
    }

    // === ƯU TIÊN 3: Demo mode — bot mô phỏng ===
    setDemoMode(true)
    setTimeout(() => {
      const reply: ChatMessage = {
        id: 'bot-' + Date.now(), session_id: sessionId.current,
        sender: 'admin', message: BOT_REPLIES[botIdx.current++ % BOT_REPLIES.length], _local: true,
      }
      setMessages((prev) => [...prev, reply])
    }, 900)
  }


  return (
    <>
      {/* Nút nổi */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full p-3.5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          title="Chat hỗ trợ trực tuyến"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Cửa sổ chat */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <div>
                <div className="text-sm font-bold leading-none">Hỗ trợ Eva Spa</div>
                <div className="text-[10px] text-white/70 mt-0.5">
                  {aiEnabled ? `🤖 Trợ lý AI (${aiReplying ? 'đang soạn…' : 'sẵn sàng'})` : demoMode ? 'Chế độ demo (offline)' : 'Đang kết nối — phản hồi trong ít phút'}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-md" title="Đóng">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div ref={bodyRef} className="flex-1 min-h-[260px] max-h-[55vh] overflow-y-auto p-4 space-y-2.5 bg-secondary/30">
            {messages.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-8 space-y-1">
                <MessageCircle className="w-6 h-6 mx-auto opacity-50 mb-1" />
                Xin chào 🌿 Anh/chị cần hỗ trợ gì hôm nay?
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'customer'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-background border border-border text-foreground rounded-bl-sm'
                  }`}
                >
                  {m.message}
                </div>
              </div>
            ))}
            {aiReplying && (
              <div className="flex justify-start">
                <div className="bg-background border border-border text-muted-foreground px-3 py-2 rounded-2xl rounded-bl-sm text-xs">
                  🤖 Trợ lý AI đang soạn<span className="animate-pulse">...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2 bg-card">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Nhập tin nhắn..."
              className="h-9 rounded-xl text-xs"
            />
            <Button size="sm" onClick={send} className="h-9 w-9 p-0 rounded-xl bg-primary hover:bg-primary/90 text-white shrink-0" title="Gửi">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}