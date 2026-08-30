/**
 * NẠP DỮ LIỆU THẬT QUA POSTGREST (không cần service_role, không cần PowerShell).
 * Yêu cầu: đã chạy 20260831000000_sync_schema.sql trong Supabase SQL Editor
 * (RLS + cột) — publishable key đủ ghi nếu policy *_anon_all tồn tại.
 *
 *   cd client
 *   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_KEY=<publishable key> \
 *     node --experimental-strip-types scripts/load-data-to-supabase.mjs
 *
 * Ghi idempotent (upsert): products (20) / popup_configs (default) / blog_posts (14).
 */
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { BLOG_SEEDS } from '../src/lib/blogSeeds.ts'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
if (!url || !key) {
  console.error('Thiếu SUPABASE_URL / SUPABASE_KEY. Ví dụ (PowerShell):')
  console.error('  $env:SUPABASE_URL="https://lydxhltbvsuyrbvulkwe.supabase.co"; $env:SUPABASE_KEY="sb_publishable_..."; node --experimental-strip-types scripts/load-data-to-supabase.mjs')
  process.exit(1)
}
const sb = createClient(url, key)

// ---- products: parse seed_products.sql (không duplicate catalog) ----
const sqlPath = path.resolve(import.meta.dirname, '../../server/database/seeders/seed_products.sql')
const sql = readFileSync(sqlPath, 'utf8')
const tupleRe = /\('((?:[^']|'')*)', '((?:[^']|'')*)', ([\d.]+), (\d+), '((?:[^']|'')*)', '((?:[^']|'')*)'\)/g
const un = (s) => s.replace(/''/g, "'")
const products = [...sql.matchAll(tupleRe)].map((m) => ({
  name: un(m[1]),
  description: un(m[2]),
  price: Number(m[3]),
  stock: Number(m[4]),
  category: un(m[5]),
  image_url: un(m[6]),
  is_active: true,
}))
if (products.length === 0) {
  console.error('Parse seed_products.sql = 0 dòng — file sai format?')
  process.exit(1)
}

const { error: e1 } = await sb.from('products').upsert(products, { onConflict: 'name' })
console.log(e1 ? `products FAIL: ${e1.message}` : `products OK x${products.length}`)

// ---- popup_configs ----
const popup = {
  enabled: true,
  badge: "ƯU ĐÃI 30' CHĂM SÓC DA",
  title: 'CHỈ 199.000Đ',
  subtitle: 'Khi đặt kèm bất kỳ liệu trình dưỡng sinh chính',
  highlightPrice: '199K',
  imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
  ctaText: 'ĐẶT LỊCH NGAY',
  ctaLink: '/booking',
  dismissText: 'KHÔNG, CẢM ƠN',
  footnote: '*Giá chưa bao gồm 8% thuế VAT & phí dịch vụ',
  delaySeconds: 1.5,
  frequency: 'always',
  showOnMobile: true,
  couponCode: 'T7SPRING',
  couponLabel: 'Ưu đãi tháng này: Miễn phí giao hàng toàn quốc cho đơn mỹ phẩm từ 500.000đ',
  couponExpiresAt: '31/08/2026',
}
const { error: e2 } = await sb.from('popup_configs').upsert({ key: 'default', config: popup }, { onConflict: 'key' })
console.log(e2 ? `popup_configs FAIL: ${e2.message}` : 'popup_configs OK')

// ---- blog_posts ----
const posts = BLOG_SEEDS.map((p) => ({
  slug: p.seoData.slug,
  title: p.title,
  category: p.category,
  excerpt: p.excerpt,
  content: p.content,
  image_url: p.featuredImage,
  views: p.views,
  read_time: p.readTime,
  date_label: p.date,
  author: p.author,
  meta_title: p.seoData.metaTitle,
  meta_description: p.seoData.metaDescription,
  focus_keyword: p.seoData.focusKeyword,
  published_at: p.status === 'published' ? new Date().toISOString() : null,
}))
const { error: e3 } = await sb.from('blog_posts').upsert(posts, { onConflict: 'slug' })
console.log(e3 ? `blog_posts FAIL: ${e3.message}` : `blog_posts OK x${posts.length}`)

// kiểm tra
for (const t of ['products', 'blog_posts', 'popup_configs']) {
  const { count } = await sb.from(t).select('*', { count: 'exact', head: true })
  console.log(`  ${t}: ${count} dòng`)
}
if (e1 || e2 || e3) process.exit(1)
