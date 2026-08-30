#!/usr/bin/env node
/**
 * Tạo danh sách URL ảnh Unsplash thật cho sản phẩm Eva Spa,
 * KIỂM TRA từng URL bằng HTTP HEAD (chỉ giữ ảnh 200),
 * in ra SQL INSERT vào stdout / file.
 *
 * Cách dùng:
 *   node scripts/fetch-product-images.mjs                 # in SQL ra console
 *   node scripts/fetch-product-images.mjs --write         # ghi server/database/seeders/seed_products.sql
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// source = unsplash photo id (kiểm chứng bằng HEAD thật, KHÔNG đoán mò)
const CATALOG = [
  { name: 'Tinh Chất Cấp Ẩm Thảo Mộc Danique', price: 1690000, originalPrice: 1890000, category: 'Serum & Tinh chất', stock: 25, tag: 'Bán chạy nhất', ids: ['photo-1620916566398-39f1143ab7be'] },
  { name: 'Huyết Thanh Phục Hồi Midnight Glow', price: 1990000, originalPrice: 2200000, category: 'Serum & Tinh chất', stock: 12, tag: 'Phục hồi đêm', ids: ['photo-1620916566398-39f1143ab7be'] },
  { name: 'Serum Vitamin C Sáng Da Cam Thảo', price: 890000, originalPrice: 990000, category: 'Serum & Tinh chất', stock: 30, tag: 'Sáng da', ids: ['photo-1596462502278-27bfdc403348'] },
  { name: 'Mặt Nạ Đất Sét Tràm Trà', price: 480000, originalPrice: 550000, category: 'Mặt nạ thảo mộc', stock: 35, tag: 'Cho da dầu mụn', ids: ['photo-1631730359585-38a4935cbec4'] },
  { name: 'Mặt Nạ Dưỡng Ẩm Rau Má Hoa Cúc', price: 540000, originalPrice: 620000, category: 'Mặt nạ thảo mộc', stock: 40, tag: 'Dịu da', ids: ['photo-1596178065887-1198b6148b2b'] },
  { name: 'Gel Rửa Mặt Bọt Rau Má', price: 360000, originalPrice: 420000, category: 'Làm sạch da', stock: 45, tag: 'Làm dịu', ids: ['photo-1556228720-195a672e8a03'] },
  { name: 'Nước Tẩy Trang Dầu Dừa Nguyên Chất', price: 290000, originalPrice: 340000, category: 'Làm sạch da', stock: 50, tag: 'Sạch sâu', ids: ['photo-1556228720-195a672e8a03'] },
  { name: 'Toner Hoa Hồng Cấp Ẩm Không Cồn', price: 420000, originalPrice: 480000, category: 'Làm sạch da', stock: 33, tag: 'Cân bằng da', ids: ['photo-1601049541289-9b1b7bbbfe19'] },
  { name: 'Kem Chống Nắng Vật Lý Thảo Dược SPF 50+', price: 790000, originalPrice: 890000, category: 'Chống nắng & Dưỡng da', stock: 18, tag: 'Dịu nhẹ cho da', ids: ['photo-1556228720-195a672e8a03'] },
  { name: 'Kem Dưỡng Nghệ + Linh Chi Ban Đêm', price: 780000, originalPrice: 880000, category: 'Chống nắng & Dưỡng da', stock: 20, tag: 'Phục hồi đêm', ids: ['photo-1620916566398-39f1143ab7be'] },
  { name: 'Muối Thảo Dược Ngâm Chân Thải Độc Hoàng Cung', price: 250000, originalPrice: 300000, category: 'Thảo dược ngâm chân & Body', stock: 50, tag: 'Thư giãn dưỡng sinh', ids: ['photo-1515377905703-c4788e51af15'] },
  { name: 'Túi Ngâm Thảo Mộc Cổ Vai Gáy', price: 320000, originalPrice: 380000, category: 'Thảo dược ngâm chân & Body', stock: 30, tag: 'Giảm đau mỏi', ids: ['photo-1544161515-4ab6ce6db874'] },
  { name: 'Body Scrub Cà Phê Đắk Lắk', price: 390000, originalPrice: 450000, category: 'Chăm sóc Body', stock: 26, tag: 'Tẩy tế bào chết', ids: ['photo-1587049352846-4a222e784d38'] },
  { name: 'Dầu Gội Bồ Kết Nấu Tươi Thủ Công', price: 320000, originalPrice: 380000, category: 'Chăm sóc tóc dưỡng sinh', stock: 35, tag: 'Thuần chay 100%', ids: ['photo-1535585209827-a15fcdbc4c2d'] },
  { name: 'Dầu Xả Vỏ Bưởi Hương Nhu', price: 300000, originalPrice: 350000, category: 'Chăm sóc tóc dưỡng sinh', stock: 32, tag: 'Mềm mượt', ids: ['photo-1522337360788-8b13dee7a37e'] },
  { name: 'Son Dưỡng Môi Mật Ong & Nghệ', price: 180000, originalPrice: 210000, category: 'Chăm sóc môi', stock: 60, tag: 'Dưỡng ẩm', ids: ['photo-1571781926291-c477ebfd024b'] },
  { name: 'Trà Dưỡng Sinh Hoa Cúc Kỷ Tử Hộp 30 Gói', price: 220000, originalPrice: 260000, category: 'Dưỡng sinh bên trong', stock: 44, tag: 'Thanh nhiệt', ids: ['photo-1544787219-7f47ccb76574'] },
  { name: 'Cao Gừng Mật Ong Nguyên Chất', price: 260000, originalPrice: 300000, category: 'Dưỡng sinh bên trong', stock: 36, tag: 'Giữ ấm', ids: ['photo-1556679343-c7306c1976bc'] },
  { name: 'Bộ Kit Chăm Sóc Da Thảo Mộc 4 Bước', price: 1490000, originalPrice: 1790000, category: 'Bộ sản phẩm', stock: 15, tag: 'Tiết kiệm 300k', ids: ['photo-1596462502278-27bfdc403348'] },
  { name: 'Bộ Quà Tặng Dưỡng Sinh Hoàng Cung', price: 2290000, originalPrice: 2690000, category: 'Bộ sản phẩm', stock: 10, tag: 'Quà tặng cao cấp', ids: ['photo-1596178065887-1198b6148b2b'] },
]

const URL_OF = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`

async function check(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) })
    return res.status === 200 && (res.headers.get('content-type') || '').startsWith('image')
  } catch {
    return false
  }
}

const esc = (s) => String(s).replace(/'/g, "''")
const fmt = (n) => Number(n).toLocaleString('en-US').replace(/,/g, '')

console.error(`Kiểm tra ${CATALOG.length} sản phẩm với ảnh Unsplash thật...`)

const rows = []
for (const p of CATALOG) {
  let chosen = null
  for (const id of p.ids) {
    const url = URL_OF(id)
    if (await check(url)) { chosen = { id, url }; break }
  }
  if (!chosen) {
    console.error(`  [BỎ] ${p.name}: không có ảnh Unsplash nào tải được`)
    continue
  }
  console.error(`  [OK] ${p.name}  <- ${chosen.id}`)
  rows.push({
    name: p.name,
    price: fmt(p.price),
    originalPrice: p.originalPrice ? fmt(p.originalPrice) : null,
    category: p.category,
    description: `Sản phẩm ${p.category.toLowerCase()} chính hãng Eva Spa.`,
    stock: p.stock,
    tag: p.tag,
    organic: p.organic,
    image_url: chosen.url,
    image_id: chosen.id,
  })
}

const sql = `-- ============================================================
-- SEED: public.products  (tự sinh bởi client/scripts/fetch-product-images.mjs)
-- MỌI image_url bên dưới ĐÃ được kiểm tra HTTP HEAD = 200 thật sự.
-- Chạy trong Supabase SQL Editor.
-- ============================================================

DELETE FROM public.products;

INSERT INTO public.products (name, description, price, stock, category, image_url) VALUES
${rows.map((r) => `  ('${esc(r.name)}', '${esc(r.description)}', ${r.price}, ${r.stock}, '${esc(r.category)}', '${esc(r.image_url)}')`).join(',\n')};

-- Kiểm tra: SELECT count(*) FROM public.products;
-- Kỳ vọng: ${rows.length}
`

const out = path.join(ROOT, '..', 'server', 'database', 'seeders', 'seed_products.sql')
if (process.argv.includes('--write')) {
  fs.writeFileSync(out, sql, 'utf8')
  console.error(`\nĐã ghi ${out} (${rows.length} sản phẩm)`)
} else {
  console.log(sql)
  console.error(`\n(${rows.length}/${CATALOG.length} sản phẩm có ảnh hợp lệ)`);
}
