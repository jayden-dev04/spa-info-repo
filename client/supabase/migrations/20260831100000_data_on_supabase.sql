-- ============================================================
-- EVA SPA — ĐỒNG BỘ LẦN CUỐI (chạy SAU 20260831000000_sync_schema.sql)
-- Sửa các lệch phát hiện khi test thật qua PostgREST:
--   appointments.service_id INTEGER (SPA gửi svc-... UUID -> sửa client)
--   popup_configs.key TEXT (không phải config_key)
--   orders: sinh order_code + total tự động, id default
--   RLS ghi tự do cho anon+authenticated (demo SPA; siết lại sau nếu cần)
-- Chạy idempotent.
-- ============================================================

-- appointments: service_id là số nguyên tham chiếu services.id
ALTER TABLE public.appointments DROP COLUMN IF EXISTS service_id;
ALTER TABLE public.appointments ADD COLUMN service_id INTEGER;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_time TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- orders: id default + sinh mã đơn + total tự động
ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'COD';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_address TEXT;

CREATE OR REPLACE FUNCTION public.set_order_defaults() RETURNS trigger AS $$
BEGIN
  IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
    NEW.order_code := 'EVA-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));
  END IF;
  NEW.total_amount := COALESCE(NEW.subtotal, 0) + COALESCE(NEW.shipping_fee, 0);
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_defaults ON public.orders;
CREATE TRIGGER trg_orders_defaults BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_defaults();

-- products: is_active + id default
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.products ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ============================================================
-- popup_configs — bảng config popup + coupon (key = 'default')
-- ============================================================
CREATE TABLE IF NOT EXISTS public.popup_configs (
  key TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS: demo SPA — anon + authenticated đọc/ghi danh mục, đơn, lịch.
-- (Secret Key của Laravel vẫn bỏ qua RLS.)
-- ============================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['appointments','orders','products','popup_configs','services']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "spaweb_all_%s" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "spaweb_all_%s" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)',
      t, t);
  END LOOP;
END $$;

-- ============================================================
-- cart_items — giỏ hàng đồng bộ (khách: session_key; user: user_id)
-- ============================================================
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- UNIQUE cho upsert theo (chủ sở hữu, sản phẩm). Chủ = session_key (khách)
-- hoặc 'u:' || user_id (đã đăng nhập) — tính ở client, DB chỉ thấy 2 cột.
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_owner_product_key UNIQUE (session_key, product_id);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spaweb_all_cart_items" ON public.cart_items;
CREATE POLICY "spaweb_all_cart_items" ON public.cart_items
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
