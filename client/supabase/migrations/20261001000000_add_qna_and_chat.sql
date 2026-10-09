-- ============================================================
-- Migration: tạo bảng Q&A (qna) và chat_messages
-- Bối cảnh: form Hỏi-Đáp khách hàng + chatbox hỗ trợ trực tuyến.
-- Cả 2 bảng: RLS ENABLE + policy 'anon all' (copy style
-- PASTE_NAY.sql: FOR ALL TO anon, authenticated USING/WITH CHECK true).
-- Chạy: Supabase → SQL Editor → dán toàn bộ → Run.
-- ============================================================

-- Q&A: khách gửi câu hỏi, admin trả lời
CREATE TABLE IF NOT EXISTS public.qna (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT,
  email       TEXT,
  question    TEXT NOT NULL,
  answer      TEXT,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  answered_at TIMESTAMPTZ
);

-- Chat messages: lịch sử chat customer ↔ admin theo session
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  sender     TEXT NOT NULL CHECK (sender IN ('customer', 'admin')),
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- RLS ENABLE + policy 'anon all' (style PASTE_NAY.sql)
-- ------------------------------------------------------------
ALTER TABLE public.qna ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_qna" ON public.qna;
CREATE POLICY "anon_all_qna" ON public.qna
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_chat_messages" ON public.chat_messages;
CREATE POLICY "anon_all_chat_messages" ON public.chat_messages
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Index hỗ trợ query theo session (chat) và status (qna)
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON public.chat_messages (session_id, created_at);
CREATE INDEX IF NOT EXISTS qna_status_idx ON public.qna (status, created_at DESC);

-- Bắt buộc PostgREST nạp lại schema cache (khắc phục PGRST204/PGRST205)
NOTIFY pgrst, 'reload schema';

-- KIỂM TRA SAU KHI CHẠY:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema='public' AND table_name IN ('qna','chat_messages');
--   -- phải trả về đủ 2 dòng
--
--   SELECT policy_name FROM pg_policies
--   WHERE schemaname='public' AND tablename IN ('qna','chat_messages');
--   -- phải thấy anon_all_qna và anon_all_chat_messages
