/**
 * Eva Spa — chạy migrate + seed bằng ACCOUNT token (Personal Access Token).
 * Dashboard → avatar góc trái → Account → Tokens → New token → copy (dài, KHÔNG phải sb_secret_).
 *
 *   PowerShell:  cd client ; $env:SUPABASE_ACCESS_TOKEN='DÁN_TOKEN' ; node scripts/full-sync.mjs
 *
 * Không cần secret key, không cần mở SQL Editor.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { BLOG_SEEDS } from '../src/lib/blogSeeds.ts'

const ref = 'lydxhltbvsuyrbvulkwe'
const pub = 'sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL'
const url = `https://${ref}.supabase.co`
const tok = (process.env.SUPABASE_ACCESS_TOKEN || '').trim()
if (!tok) {
  console.error('Thiếu SUPABASE_ACCESS_TOKEN.')
  console.error('Lấy: https://supabase.com/dashboard/account/tokens → New token → copy → chạy lại lệnh với $env:SUPABASE_ACCESS_TOKEN=...')
  process.exit(1)
}
if (tok.startsWith('sb_secret_') || tok.startsWith('sb_publishable_')) {
  console.error('Đây là API key của PROJECT, KHÔNG phải account token. Cần token ở trang ACCOUNT → Tokens (thường dài, không bắt đầu sb_).')
  process.exit(1)
}
const sb = createClient(url, pub)
const log = (t, ok, extra = '') => console.log(`${ok ? 'OK  ' : 'FAIL'} ${t}${extra ? ' ' + extra : ''}`)

// ---- 1) migrate = chạy nguyên PASTE_NAY.sql qua Management API (idem SQL Editor) ----
const sql = readFileSync(path.resolve(import.meta.dirname, '../supabase/migrations/PASTE_NAY.sql'), 'utf8')
const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
  body: JSON.stringify({ query: sql }),
})
const txt = await r.text()
const migOk = r.status >= 200 && r.status < 300
log('migrate PASTE_NAY.sql', migOk, `[${r.status}]${migOk ? '' : ' ' + txt.replace(/\s+/g, ' ').slice(0, 200)}`)
if (!migOk) process.exit(1)

// ---- 2) seed ----
const un = (s) => s.replace(/''/g, "'")
const sqlProd = readFileSync(path.resolve(import.meta.dirname, '../../server/database/seeders/seed_products.sql'), 'utf8')
const tupleRe = /\('((?:[^']|'')*)', '((?:[^']|'')*)', ([\d.]+), (\d+), '((?:[^']|'')*)', '((?:[^']|'')*)'\)/g
const cats = await sb.from('product_categories').select('id,name')
const catMap = {}
for (const c of cats.data || []) catMap[c.name.toLowerCase()] = c.id
const products = [...sqlProd.matchAll(tupleRe)].map((m) => ({
  name: un(m[1]),
  slug: un(m[1]).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
  description: un(m[2]), price: Number(m[3]), stock_quantity: Number(m[4]),
  category: un(m[5]), category_id: catMap[un(m[5]).toLowerCase()] ?? null,
  image_url: un(m[6]), is_active: true,
}))
{
  const { error } = await sb.from('products').upsert(products, { onConflict: 'slug' })
  log(`seed products x${products.length}`, !error, error?.message ?? '')
}
const blogs = BLOG_SEEDS.map((p) => ({
  slug: p.seoData.slug, title: p.title, category: p.category, excerpt: p.excerpt, content: p.content,
  image_url: p.featuredImage, views: p.views ?? 0, read_time: p.readTime, date_label: p.date,
  author: p.author ?? 'Eva Spa', meta_title: p.seoData.metaTitle, meta_description: p.seoData.metaDescription,
  focus_keyword: p.seoData.focusKeyword,
}))
{
  const { error } = await sb.from('blog_posts').upsert(blogs, { onConflict: 'slug' })
  log(`seed blogs x${blogs.length}`, !error, error?.message ?? '')
}
{
  const cfg = {
    enabled: true, badge: "ƯU ĐÃI 30' CHĂM SÓC DA", title: 'CHỈ 199.000Đ',
    subtitle: 'Khi đặt kèm bất kỳ liệu trình dưỡng sinh chính', highlightPrice: '199K',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    ctaText: 'ĐẶT LỊCH NGAY', ctaLink: '/booking', dismissText: 'KHÔNG, CẢM ƠN',
    footnote: '*Giá chưa bao gồm 8% thuế VAT & phí dịch vụ', delaySeconds: 1.5,
    couponCode: 'T7SPRING', couponLabel: 'Giảm 10% tối đa 100.000đ',
  }
  const { error } = await sb.from('popup_configs').upsert({ key: 'default', config: cfg }, { onConflict: 'key' })
  log('seed popup_configs', !error, error?.message ?? '')
}

// ---- 3) đo 6 luồng ----
console.log('\n== 6 luồng (publishable) ==')
const checks = [
  ['Shop products.category', 'products', 'id,name,price,category,stock'],
  ['Blog blog_posts', 'blog_posts', 'slug,title,author'],
  ['Popup popup_configs', 'popup_configs', 'key,config'],
  ['Cart JOIN', 'cart_items', 'quantity,session_key,product_name,price'],
  ['Orders customer_*', 'orders', 'id,order_code,customer_name,customer_email'],
  ['Appointments customer_email', 'appointments', 'id,customer_email,status'],
]
let bad = 0
for (const [label, table, sel] of checks) {
  const { error } = await sb.from(table).select(sel).limit(1)
  log(label, !error, error?.message ?? '')
  if (error) bad++
}
const np = await sb.from('products').select('id', { count: 'exact', head: true })
const nb = await sb.from('blog_posts').select('slug', { count: 'exact', head: true })
console.log(`\nrows: products=${np.count} blogs=${nb.count}`)
console.log(bad === 0 ? '=> ĐỦ 6 LUỒNG dữ liệu thật — chuyển sang browser-verify.' : `=> còn ${bad} luồng FAIL.`)
