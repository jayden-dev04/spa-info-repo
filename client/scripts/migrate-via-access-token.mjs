/**
 * Migrate schema = CHẠY TOÀN BỘ PASTE_NAY.sql bằng SUPABASE_ACCESS_TOKEN
 * (Dashboard → Account → Tokens → New token; KHÔNG cần secret key, KHÔNG cần mở SQL Editor).
 *
 *   $env:SUPABASE_ACCESS_TOKEN='...' ; node scripts/migrate-via-access-token.mjs
 *
 * Nguồn SQL duy nhất: client/supabase/migrations/PASTE_NAY.sql
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'

const ref = 'lydxhltbvsuyrbvulkwe'
const tok = process.env.SUPABASE_ACCESS_TOKEN
if (!tok) {
  console.error('Thiếu SUPABASE_ACCESS_TOKEN. Lấy tại: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}
const sqlFile = path.resolve(import.meta.dirname, '../supabase/migrations/PASTE_NAY.sql')
const sql = readFileSync(sqlFile, 'utf8')

const BASE = `https://api.supabase.com/v1/projects/${ref}/database/query`
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }

const r = await fetch(BASE, { method: 'POST', headers: H, body: JSON.stringify({ query: sql }) })
const txt = await r.text()
const ok = r.status >= 200 && r.status < 300
console.log(`${ok ? 'OK' : 'FAIL'} migrate [${r.status}]${ok ? ' (PASTE_NAY.sql da chay qua token)' : ' ' + txt.replace(/\s+/g, ' ').slice(0, 200)}`);

if (!ok) process.exit(1)

// đo lại cột (publishable)
const pub = 'sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL'
const rest = 'https://lydxhltbvsuyrbvulkwe.supabase.co/rest/v1'
for (const [label, q] of [
  ['popup_configs', 'popup_configs?select=key&limit=1'],
  ['blog_posts.author', 'blog_posts?select=author&limit=1'],
  ['products.category', 'products?select=category&limit=1'],
  ['cart_items.product_name', 'cart_items?select=product_name&limit=1'],
]) {
  const x = await fetch(`${rest}/${q}`, { headers: { apikey: pub, Authorization: `Bearer ${pub}` } })
  console.log(`${x.ok ? 'OK ' : 'FAIL'} ${label} [${x.status}]`)
}
console.log('\nTiep theo: cd server && php dev-sync.php seed  (HOẶC: $env:SUPABASE_URL=...; $env:SUPABASE_KEY=<publishable>; node --experimental-strip-types scripts/load-data-to-supabase.mjs)')
