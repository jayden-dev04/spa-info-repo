-- ============================================================
-- EVA SPA — RUN THIS FIRST IN SUPABASE SQL EDITOR
-- (Dashboard → SQL Editor → New → paste → Run)
--
-- Bù cột / cột sinh tự động / RLS policy cho các bảng ĐÃ TỒN TẠI
-- để Laravel backend + SPA dùng được mà KHÔNG cần service_role key:
--   orders         : thêm payment_method, coupon_code
--   products       : thêm is_active, DEFAULT id
--   appointments   : trigger sinh created_at, policy cho anon đặt lịch
--   blog_posts     : (tạo nếu chưa có — xem seed_blog_posts.sql)
-- Chạy idempotent (IF NOT EXISTS), chạy lại được nhiều lần.
-- ============================================================

-- orders: 2 cột Laravel + SPA ghi
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'COD';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- products: admin toggle + insert không cần id
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.products ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- appointments: frontend gửi appointment_date (date) — chắc chắn cột tồn tại + dạng date
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_date DATE;
ALTER TABLE public.appointments ALTER COLUMN appointment_date TYPE DATE USING appointment_date::date;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- created_at/updated_at tự động cho appointments + orders (SPA/Laravel không phải gửi)
CREATE OR REPLACE FUNCTION public.set_timestamps() RETURNS trigger AS $$
BEGIN
  IF NEW.created_at IS NULL THEN NEW.created_at := now(); END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointments_timestamps ON public.appointments;
CREATE TRIGGER trg_appointments_timestamps BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();
DROP TRIGGER IF EXISTS trg_orders_timestamps ON public.orders;
CREATE TRIGGER trg_orders_timestamps BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

-- ============================================================
-- BẢNG MỚI: popup_configs (cấu hình popup + coupon tháng này)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.popup_configs (
  key TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- BẢNG MỚI: blog_posts (bài blog SEO — admin chỉnh sửa)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Dưỡng Sinh & Trị Liệu',
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  read_time TEXT DEFAULT '5 phút đọc',
  date_label TEXT,
  author TEXT DEFAULT 'Eva Spa',
  meta_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS: khách vãng lai (anon) được ĐẶT LỊCH + ĐƠN HÀNG + ĐỌC DANH MỤC.
-- Admin ghi qua Laravel (Secret Key bỏ qua RLS) hoặc từ Dashboard.
-- Nếu muốn khóa chặt hơn sau này: đổi 'anon' thành 'authenticated'.
-- ============================================================
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_appointments" ON public.appointments;
CREATE POLICY "anon_insert_appointments" ON public.appointments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_appointments" ON public.appointments;
CREATE POLICY "anon_read_appointments" ON public.appointments
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON public.orders;
CREATE POLICY "anon_insert_orders" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_orders" ON public.orders;
CREATE POLICY "anon_read_orders" ON public.orders
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_read_products" ON public.products;
CREATE POLICY "anon_read_products" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_write_products" ON public.products;
CREATE POLICY "anon_write_products" ON public.products
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_blog" ON public.blog_posts;
CREATE POLICY "anon_read_blog" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_write_blog" ON public.blog_posts;
CREATE POLICY "anon_write_blog" ON public.blog_posts
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_popup" ON public.popup_configs;
CREATE POLICY "anon_read_popup" ON public.popup_configs
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_write_popup" ON public.popup_configs;
CREATE POLICY "anon_write_popup" ON public.popup_configs
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_services" ON public.services;
CREATE POLICY "anon_read_services" ON public.services
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_write_services" ON public.services;
CREATE POLICY "anon_write_services" ON public.services
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- BẢNG MỚI: cart_items (giỏ hàng đồng bộ giữa các máy)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_key TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (COALESCE(session_key, ''), product_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_session_cart" ON public.cart_items;
CREATE POLICY "own_session_cart" ON public.cart_items
  FOR ALL TO anon, authenticated
  USING ((session_key IS NOT NULL AND auth.uid() IS NULL) OR (auth.uid() = user_id))
  WITH CHECK ((session_key IS NOT NULL AND auth.uid() IS NULL) OR (auth.uid() = user_id));
