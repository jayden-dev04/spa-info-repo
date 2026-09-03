/**
 * Migrate schema bằng SUPABASE_ACCESS_TOKEN (Personal Access Token, sans_secret_...)
 * — token NÀY user lấy tại https://supabase.com/dashboard/account/tokens (dễ hơn secret key project).
 * Không sửa code app — chỉ gọi Management API tạo bảng/cột y hệt PASTE_NAY.sql.
 *
 *   $env:SUPABASE_ACCESS_TOKEN='sans_secret_...' ; node scripts/migrate-via-access-token.mjs
 *
 * Ref: https://supabase.com/docs/reference/api/introduction
 */
const ref = 'lydxhltbvsuyrbvulkwe'
const tok = process.env.SUPABASE_ACCESS_TOKEN
if (!tok) {
  console.error('Thiếu SUPABASE_ACCESS_TOKEN (Dashboard → Account → Tokens → New token).')
  process.exit(1)
}
const BASE = `https://api.supabase.com/v1/projects/${ref}/database/query`
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }

const q = async (label, sql) => {
  const r = await fetch(BASE, { method: 'POST', headers: H, body: JSON.stringify({ query: sql }) })
  const txt = await r.text()
  const ok = r.status >= 200 && r.status < 300
  console.log(`${ok ? 'OK ' : 'FAIL'} ${label} [${r.status}]${ok ? '' : ' ' + txt.replace(/\s+/g, ' ').slice(0, 120)}`)
  return ok
}

const steps = [
  ['popup_configs', `DROP TABLE IF EXISTS public.popup_configs; CREATE TABLE public.popup_configs (key TEXT PRIMARY KEY DEFAULT 'default', config JSONB NOT NULL DEFAULT '{}'::jsonb, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`],
  ['blog_posts', `DROP TABLE IF EXISTS public.blog_posts; CREATE TABLE public.blog_posts (slug TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Dưỡng Sinh & Trị Liệu', excerpt TEXT, content TEXT NOT NULL DEFAULT '', image_url TEXT, views INTEGER NOT NULL DEFAULT 0, read_time TEXT DEFAULT '5 phút đọc', date_label TEXT, author TEXT DEFAULT 'Eva Spa', meta_title TEXT, meta_description TEXT, focus_keyword TEXT, published_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`],
  ['cart_items', `DROP TABLE IF EXISTS public.cart_items; CREATE TABLE public.cart_items (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, session_key TEXT NOT NULL DEFAULT '', user_id UUID, product_id TEXT NOT NULL, product_name TEXT NOT NULL, price NUMERIC NOT NULL DEFAULT 0, image_url TEXT, quantity INTEGER NOT NULL DEFAULT 1, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`],
  ['orders-cols', `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_address TEXT; ADD COLUMN IF NOT EXISTS customer_email TEXT; ADD COLUMN IF NOT EXISTS notes TEXT; ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'COD'; ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC DEFAULT 0; ADD COLUMN IF NOT EXISTS order_code TEXT;`],
  ['appointments-cols', `ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service_id INTEGER; ADD COLUMN IF NOT EXISTS start_time TIME; ADD COLUMN IF NOT EXISTS end_time TIME; ADD COLUMN IF NOT EXISTS appointment_date DATE; ADD COLUMN IF NOT EXISTS total_price NUMERIC; ADD COLUMN IF NOT EXISTS note TEXT; ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';`],
  ['products-cols', `ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT; ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;`],
  ['rls', `DO $$ DECLARE t TEXT; BEGIN FOREACH t IN ARRAY ARRAY['appointments','orders','products','popup_configs','services','blog_posts','cart_items','order_items'] LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t); EXECUTE format('DROP POLICY IF EXISTS "spaweb_all_%s" ON public.%I', t, t); EXECUTE format('CREATE POLICY "spaweb_all_%s" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t, t); END LOOP; END $$;`],
]

let allOk = true
for (const [label, sql] of steps) allOk = (await q(label, sql)) && allOk
console.log(allOk ? '\n=> migrate xong. Chay: cd server && php dev-sync.php seed (can sb_secret_) HOẶC node client/scripts/load-data-to-supabase.mjs (publishable du).' : '\n=> co buoc FAIL — xem log trên.')
