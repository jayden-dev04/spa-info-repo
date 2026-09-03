/**
 * Eva Spa — chạy HẾT migrate + seed trong MỘT lệnh, CHỈ cần 1 token:
 *   Dashboard (avatar góc trái) → Account → Tokens → New token  (KHÔNG phải project secret key)
 *
 *   $env:SUPABASE_ACCESS_TOKEN='su_token' ; node scripts/full-sync.mjs
 *
 * 1) Management API chạy nguyên PASTE_NAY.sql (tạo bảng/cột/RLS/popup seed).
 * 2) Publishable key upsert 20 sản phẩm + 14 blog + popup (idempotent).
 * 3) Đo 6 luồng khách bằng publishable key.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { BLOG_SEEDS } from '../src/lib/blogSeeds.ts'

const ref = 'lydxhltbvsuyrbvulkwe'
const pub = 'sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL'
const url = `https://${ref}.supabase.co`
const tok = process.env.SUPABASE_ACCESS_TOKEN
if (!tok) {
  console.error('Thiếu SUPABASE_ACCESS_TOKEN → https://supabase.com/dashboard/account/tokens (New token, copy HOẶC dán vào lệnh)')
  process.exit(1)
}
const sb = createClient(url, pub)
const log = (t, ok, extra = '') => console.log(`${ok ? 'OK  ' : 'FAIL'} ${t}${extra ? ' ' + extra : ''}`)

// ---- 1) migrate ----
const sql = readFileSync(path.resolve(import.meta.dirname, '../supabase/migrations/PASTE_NAY.sql'), 'utf8')
const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
  body: JSON.stringify({ query: sql }),
})
const txt = await r.text()
const migOk = r.status >= 200 && r.status < 300
log('migrate PASTE_NAY.sql', migOk, `[${r.status}]${migOk ? '' : ' ' + txt.replace(/\s+/g, ' ').slice(0, 180)}`)
if (!migOk) process.exit(1)
// ép PostgREST nạp lại schema cache
try { await fetch(`https://api.supabase.com/v1/projects/${ref}/restart`, { method: 'POST', headers: { Authorization: `Bearer ${tok}` } }) } catch {}

// ---- 2) seed ----
const un = (s) => s.replace(/''/g, "'")
const sqlProd = readFileSync(path.resolve(import.meta.dirname, '../../server/database/seeders/seed_products.sql'), 'utf8')
const tupleRe = /\('((?:[^']|'')*)', '((?:[^']|'')*)', ([\d.]+), (\d+), '((?:[^']|'')*)', '((?:[^']|'')*)'\)/g
const products = [...sqlProd.matchAll(tupleRe)].map((m) => ({
  name: un(m[1]), description: un(m[2]), price: Number(m[3]), stock: Number(m[4]),
  category: un(m[5]), image_url: un(m[6]), is_active: true,
}))
let { error: e1 } = await sb.from('products').upsert(products, { onConflict: 'name' })
log(`seed products x${products.length}`, !e1, e1?.message ?? '')

const blogs = BLOG_SEEDS.map((p) => ({
  slug: p.seoData.slug, title: p.title, category: p.category, excerpt: p.excerpt, content: p.content,
  image_url: p.featuredImage, views: p.views ?? 0, read_time: p.readTime, date_label: p.date,
  author: p.author ?? 'Eva Spa', meta_title: p.seoData.metaTitle, meta_description: p.seoData.metaDescription,
  focus_keyword: p.seoData.focusKeyword,
}))
let { error: e2 } = await sb.from('blog_posts').upsert(blogs, { onConflict: 'slug' })
log(`seed blogs x${blogs.length}`, !e2, e2?.message ?? '')

// popup: đảm bảo đủ field UI
let { data: pop } = await sb.from('popup_configs').select('config').eq('key', 'default').maybeSingle()
const cfg = {
  enabled: true, badge: "ƯU ĐÃI 30' CHĂM SÓC DA", title: 'CHI 199.000Đ',
  subtitle: 'Khi đặt kèm bất kỳ liệu trình dưỡng sinh chính', highlightPrice: '199K',
  imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
  ctaText: 'ĐẶT LỊCH NGAY', ctaLink: '/booking', dismissText: 'KHÔNG, CẢM ƠN',
  footnote: '*Giá chưa bao gồm 8% thuế VAT & phí dịch vụ', delaySeconds: 1.5,
  couponCode: 'T7SPRING', couponLabel: 'Giảm 10% tối đa 100.000đ', ...(pop?.config ?? {}),
}
cfg.enabled = true; cfg.couponCode = 'T7SPRING'; cfg.couponLabel = 'Giảm 10% tối đa 100.000đ'
const { error: e3 } = await sb.from('popup_configs').upsert({ key: 'default', config: cfg }, { onConflict: 'key' })
log('seed popup_configs', !e3, e3?.message ?? '')

// ---- 3) đo 6 luồng ----
console.log('\n== 6 luồng khách (publishable) ==')
const checks = [
  ['Shop products.category', 'products', 'category'],
  ['Blog blog_posts.author', 'blog_posts', 'author'],
  ['Popup popup_configs', 'popup_configs', 'key'],
  ['Gio cart_items.product_name', 'cart_items', 'product_name'],
  ['Don orders.customer_address', 'orders', 'customer_address'],
  ['Lich appointments.start_time', 'appointments', 'start_time'],
]
let bad = 0
for (const [label, table, col] of checks) {
  const { error } = await sb.from(table).select(col).limit(1)
  log(label, !error, error?.message ?? '')
  if (error) bad++
}
let { count: nProd } = await sb.from('products').select('id', { count: 'exact', head: true })
let { count: nBlog } = await sb.from('blog_posts').select('slug', { count: 'exact', head: true })
console.log(`\nrows: products=${nProd} blogs=${nBlog}`)
console.log(bad === 0 ? '=> ĐỦ 6 LUỒNG dữ liệu thật.' : `=> con ${bad} luong FAIL.`)
