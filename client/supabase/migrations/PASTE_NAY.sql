-- ============================================================
-- EVA SPA — PASTE_NAY.sql (bản gọn 6 đoạn, idempotent)
-- Supabase Dashboard → SQL Editor → New → dán TOÀN BỘ → Run.
-- Nếu báo lỗi: bôi đen từng ▸ ĐOẠN rồi Run riêng.
-- Khi chạy xong: mở http://localhost:8000/dev/tool → bấm Seed → Status.
-- ============================================================

-- ▸ ĐOẠN 1 — popup_configs (popup + coupon T7SPRING)
DROP TABLE IF EXISTS public.popup_configs;
CREATE TABLE public.popup_configs (
  key TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ▸ ĐOẠN 2 — blog_posts (bản cũ thiếu author/meta_* → tạo lại)
DROP TABLE IF EXISTS public.blog_posts;
CREATE TABLE public.blog_posts (
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

-- ▸ ĐOẠN 3 — cart_items (giỏ hàng đồng bộ máy/đa máy)
DROP TABLE IF EXISTS public.cart_items;
CREATE TABLE public.cart_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_key TEXT NOT NULL DEFAULT '',
  user_id UUID,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ▸ ĐOẠN 4 — bù cột cho orders/appointments/products (tên khớp code hiện hành)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'COD';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_code TEXT;
ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service_id INTEGER;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_date DATE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS total_price NUMERIC;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.appointments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.products ALTER COLUMN id SET DEFAULT gen_random_uuid();
DO $$ BEGIN
  UPDATE public.products p SET category = c.name FROM public.product_categories c
   WHERE p.category_id = c.id AND p.category IS NULL;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ▸ ĐOẠN 5 — RLS mở cho SPA (anon + authenticated dùng publishable key)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['appointments','orders','products','popup_configs','services','blog_posts','cart_items','order_items']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "spaweb_all_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "spaweb_all_%s" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ▸ ĐOẠN 6 — xác nhận (phải ra 3 dòng)
SELECT 'popup_configs' AS doi_tuong, count(*) AS so_dong FROM public.popup_configs
UNION ALL SELECT 'blog_posts', count(*) FROM public.blog_posts
UNION ALL SELECT 'cart_items', count(*) FROM public.cart_items;
