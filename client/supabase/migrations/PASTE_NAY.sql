// DAN TRUC TIEP vao Supabase SQL Editor — KHONG can Secret key, KHONG can Dashboard.
// Paste toan bo → Run. Tao bang + cot + RLS + du lieu mau 1 lan.
// Sau khi chay xong: mo http://localhost:8000/dev/tool → bam Seed → Status.
//
// —— popup_configs ——
DROP TABLE IF EXISTS public.popup_configs;
CREATE TABLE public.popup_configs (
  key TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.popup_configs (key, config) VALUES ('default', '{
  "enabled": true,
  "badge": "UU ĐAI 30 CHAM SOC DA",
  "title": "CHI 199.000Đ",
  "subtitle": "Khi dat kem bat ky lieu trinh duong sinh chinh",
  "highlightPrice": "199K",
  "imageUrl": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
  "ctaText": "DAT LICH NGAY",
  "ctaLink": "/booking",
  "dismissText": "KHONG, CAM ON",
  "footnote": "*Gia chua gom 8% thue VAT & phi dich vu",
  "delaySeconds": 1.5,
  "couponCode": "T7SPRING",
  "couponLabel": "Giam 10% toi da 100.000d"
}'::jsonb);

// —— blog_posts ——
DROP TABLE IF EXISTS public.blog_posts;
CREATE TABLE public.blog_posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Duong Sinh & Tri Lieu',
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  read_time TEXT DEFAULT '5 phut doc',
  date_label TEXT,
  author TEXT DEFAULT 'Eva Spa',
  meta_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

// —— cart_items ——
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

// —— cot con thieu ——
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'COD';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_code TEXT;

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service_id INTEGER;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_date DATE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS total_price NUMERIC;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- —— RLS mo cho SPA (anon + authenticated dung publishable key) ——
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

-- —— xac nhan (3 dong) ——
SELECT 'popup_configs' AS t, count(*) AS n FROM public.popup_configs
UNION ALL SELECT 'blog_posts', count(*) FROM public.blog_posts
UNION ALL SELECT 'cart_items', count(*) FROM public.cart_items;
