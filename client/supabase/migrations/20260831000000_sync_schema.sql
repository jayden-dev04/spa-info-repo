-- ============================================================
-- Đồng bộ schema SUPABASE về đúng 2 migration trong repo
--   1) client/supabase/migrations/20260803000000_create_users_table.sql
--   2) client/supabase/migrations/20260809000000_create_spa_ecommerce_tables.sql
-- (idempotent — chạy lại nhiều lần an toàn)
-- Bối cảnh: DB thật đã lệch — bảng products thiếu stock/category/
-- original_price/rating; bảng orders thiếu toàn bộ customer_*...
-- CREATE TABLE IF NOT EXISTS không tự bù cột cho bảng đã tồn tại.
-- Chạy: Supabase → SQL Editor → dán hết → Run. Xong tiếp tục chạy
-- client/supabase/migrations/20260830000000_add_columns_to_orders.sql
-- và server/database/seeders/seed_products.sql.
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
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
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

ALTER TABLE public.orders
  ALTER COLUMN customer_name  SET DEFAULT '',
  ALTER COLUMN customer_email SET DEFAULT '';

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

-- ===================== APPOINTMENTS =====================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  service_id INTEGER REFERENCES public.services(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== Nạp lại schema cache =====================
NOTIFY pgrst, 'reload schema';

-- KIỂM TRA SAU KHI CHẠY:
--   SELECT table_name, column_name FROM information_schema.columns
--   WHERE table_schema='public' AND table_name IN ('products','orders')
--   ORDER BY table_name, ordinal_position;
-- Rồi chạy server/database/seeders/seed_products.sql (count = 20).
