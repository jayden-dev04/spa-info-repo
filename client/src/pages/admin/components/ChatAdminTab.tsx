import { useState, useEffect, useRef, useCallback } from 'react'
import { MessagesSquare, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ChatMessage = {
  id: string
  session_id: string
  sender: 'customer' | 'admin'
  message: string
  created_at?: string
}

// Tab Chat hỗ trợ: admin chọn session (khách đang chat) và trả lời trực tiếp.
// Khách nhận phản hồi nhờ polling 5s ở ChatWidget.
export default function ChatAdminTab() {
  const [sessions, setSessions] = useState<string[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)

  const loadSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('session_id, created_at')
        .order('created_at', { ascending: false })
        .limit(200)
      if (!error && Array.isArray(data)) {
        const seen: string[] = []
        const set = new Set<string>()
        for (const row of data as any[]) {
          if (!set.has(row.session_id)) { set.add(row.session_id); seen.push(row.session_id) }
        }
        setSessions(seen)
        if (!activeSession && seen.length > 0) setActiveSession(seen[0])
      }
    } catch { /* supabase offline */ }
  }, [activeSession])

  const loadMessages = useCallback(async (sid: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sid)
        .order('created_at', { ascending: true })
        .limit(100)
      if (!error && Array.isArray(data)) setMessages(data as ChatMessage[])
    } catch { /* offline */ }
  }, [])

  useEffect(() => { loadSessions() }, [loadSessions])
  useEffect(() => {
    if (!activeSession) return
    loadMessages(activeSession)
    const t = setInterval(() => { loadSessions(); loadMessages(activeSession) }, 5000)
    return () => clearInterval(t)
  }, [activeSession, loadSessions, loadMessages])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || !activeSession) return
    setInput('')
    try {
      const { error } = await supabase.from('chat_messages').insert({
        session_id: activeSession,
        sender: 'admin',
        message: text,
      })
      if (error) throw error
      loadMessages(activeSession)
    } catch (e: any) {
      toast.error('Không gửi được (DB offline?): ' + e.message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <MessagesSquare className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Chat Hỗ Trợ Trực Tuyến</h2>
      </div>

      {sessions.length === 0 ? (
        <div className="text-sm text-muted-foreground py-10 text-center border border-dashed border-border rounded-2xl">
          Chưa có phiên chat nào. Khách chat từ widget góc phải website sẽ xuất hiện tại đây.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 items-stretch">
          {/* Danh sách phiên */}
          <div className="bg-card border border-border rounded-2xl p-2 space-y-1 max-h-[60vh] overflow-y-auto">
            {sessions.map((sid) => (
              <button
                key={sid}
                onClick={() => setActiveSession(sid)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors ${
                  activeSession === sid ? 'bg-primary text-white font-semibold' : 'hover:bg-secondary'
                }`}
              >
                <div className="truncate">Phiên {sid.slice(0, 16)}…</div>
              </button>
            ))}
          </div>

          {/* Khung chat */}
          <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
            <div ref={bodyRef} className="flex-1 min-h-[300px] max-h-[55vh] overflow-y-auto p-4 space-y-2.5 bg-secondary/30">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'admin'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-background border border-border rounded-bl-sm'
                  }`}>
                    {m.message}
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-10">Chưa có tin nhắn trong phiên này.</div>
              )}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Trả lời khách..."
                className="h-9 rounded-xl text-xs"
              />
              <Button size="sm" onClick={send} className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-white px-4 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
