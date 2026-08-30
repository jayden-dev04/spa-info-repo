-- ============================================================
-- 01_schema: đồng bộ TOÀN BỘ schema public về đúng migration trong repo
--   (idempotent — chạy lại nhiều lần an toàn)
-- Vấn đề thực tế đã kiểm chứng bằng PostgREST (publishable key):
--   products  : thiếu stock/category/original_price/rating
--   orders    : thiếu user_id/customer_* + cột TMĐT (PGRST204 khi insert)
--   appointments: thiếu user_id/customer_*/notes
--   order_items : thiếu price
--   popup_configs: KHÔNG tồn tại (404)
-- CREATE TABLE IF NOT EXISTS KHÔNG bù cột cho bảng đã tồn tại — vì vậy
-- mọi bảng đều có ALTER ... ADD COLUMN IF NOT EXISTS riêng.
-- Chạy: Supabase Dashboard → SQL Editor → dán hết → Run.
-- Thứ tự: 01 → 02 → 03.
-- ============================================================

-- ===================== USERS =====================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  account_source TEXT DEFAULT 'guest_booking',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email           TEXT,
  ADD COLUMN IF NOT EXISTS full_name       TEXT,
  ADD COLUMN IF NOT EXISTS role            TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS account_source  TEXT DEFAULT 'guest_booking',
  ADD COLUMN IF NOT EXISTS avatar_url      TEXT,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT now();

-- ===================== SERVICES =====================
CREATE TABLE IF NOT EXISTS public.services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== PRODUCTS =====================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  stock INTEGER DEFAULT 0,
  category TEXT,
  rating NUMERIC(3, 2),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS original_price    NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS stock             INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category          TEXT,
  ADD COLUMN IF NOT EXISTS rating            NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS image_url         TEXT,
  ADD COLUMN IF NOT EXISTS is_active         BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS description       TEXT,
  ADD COLUMN IF NOT EXISTS price             NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT now();

-- ===================== ORDERS (+ cột TMĐT) =====================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id          UUID,
  ADD COLUMN IF NOT EXISTS customer_name    TEXT,
  ADD COLUMN IF NOT EXISTS customer_email   TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone   TEXT,
  ADD COLUMN IF NOT EXISTS customer_address TEXT,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS shipping_fee     NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method   TEXT DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS notes            TEXT,
  ADD COLUMN IF NOT EXISTS order_code       TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_code_key ON public.orders (order_code);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey') THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===================== ORDER_ITEMS =====================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS quantity INTEGER,
  ADD COLUMN IF NOT EXISTS price    NUMERIC(10, 2);

-- ===================== APPOINTMENTS =====================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  service_id INTEGER REFERENCES public.services(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  appointment_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS user_id        UUID,
  ADD COLUMN IF NOT EXISTS customer_name  TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS notes          TEXT,
  ADD COLUMN IF NOT EXISTS service_id     INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_service_id_fkey') THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id)
      REFERENCES public.services(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_user_id_fkey') THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ===================== BLOG_POSTS =====================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== POPUP_CONFIGS (admin PopupTab) =====================
CREATE TABLE IF NOT EXISTS public.popup_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE DEFAULT 'default',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== RLS: mở cho khách (luồng guest hiện hữu) ==========
ALTER TABLE public.services       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_configs  ENABLE ROW LEVEL SECURITY;

-- An toàn: chính sách chỉ tạo nếu chưa có (không ghi đè policy admin đã đặt).
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['services','products','orders','order_items','appointments','blog_posts','popup_configs'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname = t || '_anon_all') THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)',
        t || '_anon_all', t
      );
    END IF;
  END LOOP;
END $$;

-- ===================== Nạp lại schema cache =====================
NOTIFY pgrst, 'reload schema';
