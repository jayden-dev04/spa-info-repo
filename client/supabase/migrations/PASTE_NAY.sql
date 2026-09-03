-- ============================================================
-- EVA SPA — PASTE_NAY.sql (BẢN CUỐI — KHỚP CODE 100%, BẰNG CHỨNG ĐO BẰNG OpenAPI)
-- Schema thật:  orders{client_id,shipping_name,shipping_phone,shipping_address,note,...}
--   appointments{client_id,service_id,appointment_date,start_time,end_time,status,total_price,note}
--   cart_items{id,user_id,session_id,product_id,quantity}; order_items{unit_price,subtotal}
--   products{category_id FK}; blog_posts CŨ {id,author_id,search_vector,...} (SPA ko dùng);
--   popup_configs CHƯA tồn tại. ĐÃ đủ: product_categories(10), services, users, activity_logs.
-- CHIẾN LƯỢC: KHÔNG sửa code — cột customer_* của orders/appointments là GENERATED
--   (orders: từ shipping_*; appointments: tra users theo client_id). RLS: chỉ bảng public
--   (users là view hệ thống → KHÔNG đụng).  Blog: DROP+CREATE lại theo BlogTab.
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

-- ▸ 2 — orders: thêm cột + customer_* GENERATED từ shipping_* (code không đổi tên cột)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_code TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10,2) DEFAULT 0;
DO $$ BEGIN
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT GENERATED ALWAYS AS (shipping_name) STORED;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT GENERATED ALWAYS AS (shipping_phone) STORED;
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_address TEXT GENERATED ALWAYS AS (shipping_address) STORED;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='orders' AND column_name='customer_email') THEN
    ALTER TABLE public.orders ADD COLUMN customer_email TEXT
      GENERATED ALWAYS AS ((SELECT u.email FROM public.users u WHERE u.id = orders.client_id LIMIT 1)) STORED;
  END IF;
END $$;

-- ▸ 3 — appointments: customer_* GENERATED tra users theo client_id (AppointmentController
--     lưu client_id = UUID user Supabase vừa tạo → email/name/phone đọc được lại)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='appointments' AND column_name='customer_email') THEN
    ALTER TABLE public.appointments ADD COLUMN customer_email TEXT
      GENERATED ALWAYS AS ((SELECT u.email FROM public.users u WHERE u.id = appointments.client_id LIMIT 1)) STORED;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='appointments' AND column_name='customer_name') THEN
    ALTER TABLE public.appointments ADD COLUMN customer_name TEXT
      GENERATED ALWAYS AS ((SELECT u.full_name FROM public.users u WHERE u.id = appointments.client_id LIMIT 1)) STORED;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='appointments' AND column_name='customer_phone') THEN
    ALTER TABLE public.appointments ADD COLUMN customer_phone TEXT
      GENERATED ALWAYS AS ((SELECT u.phone FROM public.users u WHERE u.id = appointments.client_id LIMIT 1)) STORED;
  END IF;
END $$;

-- ▸ 4 — cart_items: thêm cột code đang dùng (session_key/product_name/price/image_url/updated_at)
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS session_key TEXT;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.cart_items ALTER COLUMN session_id SET DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_session_product_uniq ON public.cart_items (session_key, product_id);
CREATE INDEX IF NOT EXISTS cart_items_user_idx ON public.cart_items (user_id);

-- ▸ 5 — products: category TEXT (giữ category_id FK) + slug UNIQ (seed idempotent)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_uniq ON public.products (slug);
DO $$ BEGIN
  UPDATE public.products p SET category = c.name
   FROM public.product_categories c WHERE p.category_id = c.id AND p.category IS NULL;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

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

-- ▸ 7 — RLS mở cho SPA: CHỈ bảng public (view `users` hệ thống không đụng tới)
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
