-- ============================================================
-- EVA SPA — 00_RUN_NAY.sql  (chạy file này trước, duy nhất)
-- Supabase Dashboard → SQL Editor → New → paste toàn bộ → Run
--
-- Gồm: schema (bù cột, trigger, bảng popup_configs/blog_posts/
-- cart_items, RLS cho SPA đọc/ghi bằng publishable key)
-- + dữ liệu: popup_config 'default' (coupon T7SPRING).
--
-- SAU KHI chay xong file nay:
--   cd client
--   $env:SUPABASE_URL='https://<ref>.supabase.co'; $env:SUPABASE_KEY='<publishable key>'
--   node --experimental-strip-types scripts/load-data-to-supabase.mjs
--   → nap 20 san pham + 14 bai blog SEO (upsert theo name/slug)
-- ============================================================

-- 1) popup_configs (popup + coupon tháng này)
DROP TABLE IF EXISTS public.popup_configs;
CREATE TABLE public.popup_configs (
  key TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) cart_items: 1 dòng / (chủ sở hữu, sản phẩm).
--    session_key = uuid máy khách HOẶC 'u:<uid>' khi đăng nhập (đồng bộ đa máy).
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

-- 3) appointments: service_id KIỂU SỐ (khớp services.id int; SPA gửi number)
ALTER TABLE public.appointments DROP COLUMN IF EXISTS service_id;
ALTER TABLE public.appointments ADD COLUMN service_id INTEGER;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_time TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_date DATE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

CREATE OR REPLACE FUNCTION public.set_timestamps() RETURNS trigger AS $$
BEGIN
  IF NEW.created_at IS NULL THEN NEW.created_at := now(); END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointments_timestamps ON public.appointments;
CREATE TRIGGER trg_appointments_timestamps BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

-- 4) orders: cột + sinh order_code/total tự động + timestamps
ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'COD';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_code TEXT;

CREATE OR REPLACE FUNCTION public.set_order_defaults() RETURNS trigger AS $$
BEGIN
  IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
    NEW.order_code := 'EVA-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));
  END IF;
  IF NEW.total_amount = 0 THEN
    NEW.total_amount := COALESCE(NEW.subtotal, 0) + COALESCE(NEW.shipping_fee, 0);
  END IF;
  IF NEW.created_at IS NULL THEN NEW.created_at := now(); END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_defaults ON public.orders;
CREATE TRIGGER trg_orders_defaults BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_defaults();
DROP TRIGGER IF EXISTS trg_orders_timestamps ON public.orders;
CREATE TRIGGER trg_orders_timestamps BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();

-- 5) products: id default + is_active
ALTER TABLE public.products ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 6) blog_posts (nếu chưa có)
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

-- 7) RLS: SPA (anon + authenticated) đọc/ghi toàn bộ bảng trên bằng publishable key.
--    Secret Key của Laravel vẫn bypass RLS. Siết lại sau nếu cần (đổi USING (true)).
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

-- 8) popup mặc định (coupon T7SPRING)
INSERT INTO public.popup_configs (key, config) VALUES ('default', '{
  "enabled": true,
  "badge": "ƯU ĐÃI 30'"'" CHĂM SÓC DA",
  "title": "CHỈ 199.000Đ",
  "subtitle": "Khi đặt kèm bất kỳ liệu trình dưỡng sinh chính",
  "highlightPrice": "199K",
  "imageUrl": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
  "ctaText": "ĐẶT LỊCH NGAY",
  "ctaLink": "/booking",
  "dismissText": "KHÔNG, CẢM ƠN",
  "footnote": "*Giá chưa bao gồm 8% thuế VAT & phí dịch vụ",
  "delaySeconds": 1.5,
  "frequency": "always",
  "showOnMobile": true,
  "couponCode": "T7SPRING",
  "couponLabel": "Ưu đãi tháng này: Miễn phí giao hàng toàn quốc cho đơn mỹ phẩm từ 500.000đ",
  "couponExpiresAt": "31/08/2026"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- xác nhận: 4 dòng dưới phải chạy được sau khi Run
-- (nếu SELECT nào báo lỗi nghĩa là bước đó chưa apply)
SELECT 'popup_configs' t, count(*) n FROM public.popup_configs
UNION ALL SELECT 'cart_items', count(*) FROM public.cart_items
UNION ALL SELECT 'blog_posts', count(*) FROM public.blog_posts;
