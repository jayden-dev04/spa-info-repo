-- ============================================================
-- EVA SPA — PASTE TOÀN BỘ FILE NÀY VÀO SQL EDITOR → RUN.
-- Supabase Dashboard → SQL Editor → New query → xóa mẫu → dán → Run.
-- Idempotent. Không sửa gì. Chạy 1 lần.
-- ============================================================

-- 0) ĐỒNG BỘ SCHEMA HIỆN TẠI (products có category_id, không có category TEXT;
--    orders: total; appointments: start_time/end_time/total_price/note)
--    → thêm cột/text để client + Laravel hiện hành chạy ĐÚNG với tên cột cũ.

-- products: có cả category TEXT (client gửi 'category') + giữ category_id
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- nếu có product_categories, đổ tên category vào cột text cho các dòng cũ
UPDATE public.products p SET category = c.name
  FROM public.product_categories c
 WHERE p.category_id = c.id AND p.category IS NULL;

-- orders
ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'COD';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_code TEXT;

-- appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_date DATE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_time TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- timestamps tự động
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

-- 1) popup_configs
DROP TABLE IF EXISTS public.popup_configs;
CREATE TABLE public.popup_configs (
  key TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) blog_posts
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

-- 3) cart_items: 1 dòng /(chủ, sp). Chủ = session_key máy khách hoặc 'u:<uid>' khi đăng nhập
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
ALTER TABLE public.cart_items
  ADD CONSTRAINT cart_items_owner_product_key UNIQUE (session_key, product_id);

-- 4) RLS cho SPA (anon + authenticated) — publishable key đọc/ghi được
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['appointments','orders','products','popup_configs','services','blog_posts','cart_items']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "spaweb_all_%s" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "spaweb_all_%s" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)',
      t, t);
  END LOOP;
END $$;

-- 5) popup mặc định (coupon T7SPRING)
INSERT INTO public.popup_configs (key, config) VALUES ('default', '{"enabled":true,"badge":"UU DOI 30 CHAM SOC DA","title":"CHI 199.000D","subtitle":"Khi dat kem bat ky lieu trinh duong sinh chinh","highlightPrice":"199K","imageUrl":"https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80","ctaText":"DAT LICH NGAY","ctaLink":"/booking","dismissText":"KHONG, CAM ON","footnote":"*Gia chua gom 8% thue VAT & phi dich vu","delaySeconds":1.5,"frequency":"always","showOnMobile":true,"couponCode":"T7SPRING","couponLabel":"Uu dai thang nay: Mien phi giao hang toan quoc cho don my pham tu 500.000d","couponExpiresAt":"31/08/2026"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5b) ĐƠN HÀNG QUA LARAVEL: orders.notes + bảng order_items
--     (OrderController ghi order_items(order_id, product_id, quantity, price))
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS public.order_items (
  order_id UUID,
  product_id UUID,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spaweb_all_order_items" ON public.order_items;
CREATE POLICY "spaweb_all_order_items" ON public.order_items
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- XÁC NHẬN: Run xong phải thấy bảng 4 dòng, KHÔNG lỗi đỏ
SELECT 'popup_configs' t, count(*) n FROM public.popup_configs
UNION ALL SELECT 'blog_posts', count(*) FROM public.blog_posts
UNION ALL SELECT 'cart_items', count(*) FROM public.cart_items
UNION ALL SELECT 'products_category', count(*) FROM public.products WHERE category IS NOT NULL;
