-- ============================================================
-- EVA SPA — PASTE_NAY.sql (BẢN CUỐI — KHỚP CODE 100%, BẰNG CHỨNG ĐO BẰNG OpenAPI)
-- Schema thật (server/schema-from-openapi.php):
--   orders = {id, client_id, status, total_amount, shipping_name, shipping_phone,
--             shipping_address, note, created_at, updated_at}
--   appointments = {id, client_id, staff_id, service_id, promotion_id, appointment_date,
--             start_time, end_time, status, total_price, note, created_at}
--   cart_items = {id, user_id, session_id, product_id, quantity, created_at, updated_at}
--   order_items = {id, order_id, product_id, quantity, unit_price, subtotal}
--   products = {id, category_id FK, name, slug, short_description, description, price,
--             stock_quantity, image_url, is_active, created_at, updated_at}
--   blog_posts CŨ = {id, author_id, title, slug, content, cover_image, status, published_at,
--             created_at, search_vector} → SPA không dùng → DROP+CREATE lại
--   popup_configs CHƯA tồn tại. users view: đọc được (bypass RLS) — KHÔNG đụng.
-- CHIẾN LƯỢC (KHÔNG đổi code app): cột customer_* của orders/appointments = cột THƯỜNG
--   + DEFAULT '' + trigger BEFORE (2 chiều shipping_*/users ↔ customer_*). Postgres CẤM
--   subquery/hàm-non-immutable trong GENERATED → không thể GENERATED cột tra users.
-- CHẠY: Supabase → SQL Editor → New → dán TOÀN BỘ → Run.
-- ============================================================

-- ▸ 0 — danh mục (idempotent)
INSERT INTO public.product_categories (name, slug) VALUES
  ('Serum & Tinh chất','serum-tinh-chat'), ('Mặt nạ thảo mộc','mat-na-thao-moc'),
  ('Làm sạch da','lam-sach-da'), ('Chống nắng & Dưỡng da','chong-nang-duong-da'),
  ('Thảo dược ngâm chân & Body','thao-duoc-ngam-chan'), ('Chăm sóc Body','cham-soc-body'),
  ('Chăm sóc tóc dưỡng sinh','cham-soc-toc'), ('Chăm sóc môi','cham-soc-moi'),
  ('Dưỡng sinh bên trong','duong-sinh-ben-trong'), ('Bộ sản phẩm','bo-san-pham')
ON CONFLICT DO NOTHING;

-- ▸ 1 — popup_configs + seed popup/coupon (khớp PromoPopup + Checkout)
CREATE TABLE IF NOT EXISTS public.popup_configs (
  key TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.popup_configs (key, config) VALUES ('default', '{
  "enabled": true,
  "badge": "ƯU ĐÃI 30'' CHĂM SÓC DA",
  "title": "CHỈ 199.000Đ",
  "subtitle": "Khi đặt kèm bất kỳ liệu trình dưỡng sinh chính",
  "highlightPrice": "199K",
  "imageUrl": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
  "ctaText": "ĐẶT LỊCH NGAY",
  "ctaLink": "/booking",
  "dismissText": "KHÔNG, CẢM ƠN",
  "footnote": "*Giá chưa bao gồm 8% thuế VAT & phí dịch vụ",
  "delaySeconds": 1.5,
  "couponCode": "T7SPRING",
  "couponLabel": "Giảm 10% tối đa 100.000đ"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ▸ 2 — orders: REST POST customer_*/notes + SELECT ilike(customer_email) qua cột thường+trigger 2 chiều
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_code TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10,2) DEFAULT 0;
DO $$
DECLARE c TEXT;
BEGIN
  FOREACH c IN ARRAY ARRAY['customer_name','customer_phone','customer_address','customer_email']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='orders' AND column_name=c) THEN
      EXECUTE format('ALTER TABLE public.orders ADD COLUMN %I TEXT', c);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='orders' AND column_name=c AND is_generated='ALWAYS') THEN
      EXECUTE format('ALTER TABLE public.orders ALTER COLUMN %I DROP EXPRESSION', c);
    END IF;
  END LOOP;
END $$;
ALTER TABLE public.orders ALTER COLUMN customer_name    SET DEFAULT '';
ALTER TABLE public.orders ALTER COLUMN customer_phone   SET DEFAULT '';
ALTER TABLE public.orders ALTER COLUMN customer_address SET DEFAULT '';
ALTER TABLE public.orders ALTER COLUMN customer_email   SET DEFAULT '';
CREATE OR REPLACE FUNCTION public.orders_sync_names() RETURNS trigger AS $fn$
BEGIN
  -- chiều INSERT(customer_*) → shipping_*
  IF COALESCE(NEW.shipping_name,'')    = '' THEN NEW.shipping_name    := COALESCE(NEW.customer_name,'');    END IF;
  IF COALESCE(NEW.shipping_phone,'')   = '' THEN NEW.shipping_phone   := COALESCE(NEW.customer_phone,'');   END IF;
  IF COALESCE(NEW.shipping_address,'') = '' THEN NEW.shipping_address := COALESCE(NEW.customer_address,''); END IF;
  -- chiều SELECT/đọc: shipping_* → customer_* (kể cả đơn cũ chỉ có shipping_*)
  IF COALESCE(NEW.customer_name,'')    = '' THEN NEW.customer_name    := COALESCE(NEW.shipping_name,'');    END IF;
  IF COALESCE(NEW.customer_phone,'')   = '' THEN NEW.customer_phone   := COALESCE(NEW.shipping_phone,'');   END IF;
  IF COALESCE(NEW.customer_address,'') = '' THEN NEW.customer_address := COALESCE(NEW.shipping_address,''); END IF;
  -- customer_email: INSERT có sẵn thì giữ; không có → tra users theo client_id (lịch hẹn)
  IF COALESCE(NEW.customer_email,'') = '' AND NEW.client_id IS NOT NULL THEN
    NEW.customer_email := COALESCE((SELECT u.email FROM public.users u WHERE u.id = NEW.client_id LIMIT 1), NEW.customer_email);
  END IF;
  -- notes ↔ note
  IF COALESCE(NEW.note,'')  = '' THEN NEW.note  := COALESCE(NEW.notes,''); END IF;
  IF COALESCE(NEW.notes,'') = '' THEN NEW.notes := COALESCE(NEW.note,'');  END IF;
  RETURN NEW;
END $fn$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS orders_sync_names ON public.orders;
CREATE TRIGGER orders_sync_names BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_sync_names();
-- bù một lần cho đơn cũ chỉ có shipping_*:
UPDATE public.orders SET
  customer_name    = COALESCE(NULLIF(customer_name,''),    shipping_name,    ''),
  customer_phone   = COALESCE(NULLIF(customer_phone,''),   shipping_phone,   ''),
  customer_address = COALESCE(NULLIF(customer_address,''), shipping_address, '')
WHERE COALESCE(customer_name,'') = '' OR COALESCE(customer_phone,'') = '' OR COALESCE(customer_address,'') = '';

-- ▸ 3 — appointments: customer_* = cột THƯỜNG + trigger tra users theo client_id.
--     (KHÔNG dùng GENERATED: Postgres báo "cannot use subquery in column generation
--      expression" → rollback TOÀN BỘ file, 6 luồng không bao giờ chạy được.)
--     AppointmentController POST client_id (không gửi customer_*) → trigger bù từ users;
--     SupabaseAppointmentController POST customer_* trực tiếp → trigger giữ nguyên.
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
DO $$
DECLARE c TEXT;
BEGIN
  FOREACH c IN ARRAY ARRAY['customer_name','customer_phone','customer_email']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='appointments' AND column_name=c) THEN
      EXECUTE format('ALTER TABLE public.appointments ADD COLUMN %I TEXT', c);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='appointments' AND column_name=c AND is_generated='ALWAYS') THEN
      EXECUTE format('ALTER TABLE public.appointments ALTER COLUMN %I DROP EXPRESSION', c);
    END IF;
  END LOOP;
END $$;
ALTER TABLE public.appointments ALTER COLUMN customer_name  SET DEFAULT '';
ALTER TABLE public.appointments ALTER COLUMN customer_phone SET DEFAULT '';
ALTER TABLE public.appointments ALTER COLUMN customer_email SET DEFAULT '';
CREATE OR REPLACE FUNCTION public.appointments_sync_names() RETURNS trigger AS $fn$
BEGIN
  IF COALESCE(NEW.customer_email,'') = '' AND NEW.client_id IS NOT NULL THEN
    NEW.customer_email := COALESCE((SELECT u.email     FROM public.users u WHERE u.id = NEW.client_id LIMIT 1), NEW.customer_email);
  END IF;
  IF COALESCE(NEW.customer_name,'') = '' AND NEW.client_id IS NOT NULL THEN
    NEW.customer_name  := COALESCE((SELECT u.full_name FROM public.users u WHERE u.id = NEW.client_id LIMIT 1), NEW.customer_name);
  END IF;
  IF COALESCE(NEW.customer_phone,'') = '' AND NEW.client_id IS NOT NULL THEN
    NEW.customer_phone := COALESCE((SELECT u.phone     FROM public.users u WHERE u.id = NEW.client_id LIMIT 1), NEW.customer_phone);
  END IF;
  -- note ↔ notes (AppointmentController ghi `note`; admin AppointmentsTab/OverviewTab đọc `notes`)
  IF COALESCE(NEW.note,'')  = '' THEN NEW.note  := COALESCE(NEW.notes,''); END IF;
  IF COALESCE(NEW.notes,'') = '' THEN NEW.notes := COALESCE(NEW.note,'');  END IF;
  RETURN NEW;
END $fn$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS appointments_sync_names ON public.appointments;
CREATE TRIGGER appointments_sync_names BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.appointments_sync_names();
-- bù một lần cho lịch hẹn cũ đã có client_id nhưng customer_* còn trống:
UPDATE public.appointments SET customer_email = customer_email
 WHERE client_id IS NOT NULL AND COALESCE(customer_email,'') = '';

-- ▸ 4 — cart_items: thêm cột code đang dùng (session_key/product_name/price/image_url/updated_at)
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS session_key TEXT;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.cart_items ALTER COLUMN session_id SET DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_session_product_uniq ON public.cart_items (session_key, product_id);
CREATE INDEX IF NOT EXISTS cart_items_user_idx ON public.cart_items (user_id);

-- ▸ 5 — products: category TEXT (trigger mirror từ category_id) + stock ↔ stock_quantity
--     trigger 2 chiều. (KHÔNG GENERATED: ProductsTab .update({stock}) sẽ báo
--     "column stock can only be updated to DEFAULT" → sửa/xóa sản phẩm admin lỗi 400;
--     OrderController trừ stock_quantity → stock phải theo.)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_uniq ON public.products (slug);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='products' AND column_name='stock') THEN
    ALTER TABLE public.products ADD COLUMN stock INTEGER DEFAULT 0;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='products' AND column_name='stock' AND is_generated='ALWAYS') THEN
    ALTER TABLE public.products ALTER COLUMN stock DROP EXPRESSION;
  END IF;
END $$;
ALTER TABLE public.products ALTER COLUMN stock SET DEFAULT 0;
ALTER TABLE public.products ALTER COLUMN stock_quantity SET DEFAULT 0;
CREATE OR REPLACE FUNCTION public.products_sync_stock() RETURNS trigger AS $fn$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.stock IS DISTINCT FROM OLD.stock
       AND (NEW.stock_quantity IS NULL OR NEW.stock_quantity = OLD.stock_quantity) THEN
      NEW.stock_quantity := NEW.stock;                      -- admin sửa `stock` (ProductsTab)
    ELSIF NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity THEN
      NEW.stock := NEW.stock_quantity;                      -- server/seed sửa `stock_quantity`
    ELSE
      NEW.stock := COALESCE(NEW.stock, NEW.stock_quantity, 0);
    END IF;
  ELSE
    -- INSERT: 2 cột đều có DEFAULT 0 nên không phân biệt NULL — dùng giá trị 0 để nhận diện
    -- phía nào được gửi (seed full-sync chỉ gửi stock_quantity; ProductsTab chỉ gửi stock).
    IF COALESCE(NEW.stock, 0) = 0 AND COALESCE(NEW.stock_quantity, 0) <> 0 THEN
      NEW.stock := NEW.stock_quantity;                      -- seed chỉ gửi stock_quantity
    ELSIF COALESCE(NEW.stock_quantity, 0) = 0 AND COALESCE(NEW.stock, 0) <> 0 THEN
      NEW.stock_quantity := NEW.stock;                      -- admin chỉ gửi stock
    END IF;
  END IF;
  RETURN NEW;
END $fn$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS products_sync_stock ON public.products;
CREATE TRIGGER products_sync_stock BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_sync_stock();
UPDATE public.products SET stock = COALESCE(stock_quantity, 0)
 WHERE COALESCE(stock,0) = 0 AND COALESCE(stock_quantity,0) <> 0;
CREATE OR REPLACE FUNCTION public.products_mirror_category() RETURNS trigger AS $fn$
BEGIN
  NEW.category := COALESCE((SELECT c.name FROM public.product_categories c WHERE c.id = NEW.category_id), NEW.category, 'Mỹ phẩm thảo mộc');
  RETURN NEW;
END $fn$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS products_mirror_category ON public.products;
CREATE TRIGGER products_mirror_category BEFORE INSERT OR UPDATE OF category_id ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_mirror_category();
UPDATE public.products p SET category = c.name
 FROM public.product_categories c WHERE p.category_id = c.id AND COALESCE(p.category,'') = '';

-- ▸ 6 — blog_posts: xoá bản cũ (id,author_id,search_vector — SPA không dùng) → tạo lại
--     đúng cấu trúc BlogTab/Blog/BlogDetail.
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
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ▸ 7 — RLS mở cho SPA (CHỈ bảng public — users view hệ thống không đụng)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['appointments','orders','products','popup_configs','services','blog_posts','cart_items','order_items','product_categories']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "spaweb_all_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "spaweb_all_%s" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;
NOTIFY pgrst, 'reload schema';

-- ▸ 8 — xác nhận
SELECT 'popup_configs' AS doi_tuong, count(*) AS so_dong FROM public.popup_configs
UNION ALL SELECT 'blog_posts', count(*) FROM public.blog_posts
UNION ALL SELECT 'products', count(*) FROM public.products
UNION ALL SELECT 'product_categories', count(*) FROM public.product_categories;
