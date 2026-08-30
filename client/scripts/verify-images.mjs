// Chạy: node scripts/verify-images.mjs
// Tải từng ảnh thật (GET) và ghi file vào .tmp-img-check/ để người dev
// eyeball ảnh CÓ ĐÚNG LOẠI sản phẩm không (HEAD 200 không chứng minh nội dung ảnh).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(__dirname, '../.tmp-img-check')

const MAP = [
  ['prod-01-serum-duong-am', 'photo-1620916566398-39f1143ab7be'],
  ['prod-02-huyet-thanh-dem', 'photo-1620916566398-39f1143ab7be'],
  ['prod-03-serum-vitamin-c', 'photo-1596462502278-27bfdc403348'],
  ['prod-04-mat-na-dat-set', 'photo-1631730359585-38a4935cbec4'],
  ['prod-05-mat-na-rau-ma', 'photo-1596178065887-1198b6148b2b'],
  ['prod-06-gel-rua-mat', 'photo-1556228720-195a672e8a03'],
  ['prod-07-nuoc-tay-trang', 'photo-1556228720-195a672e8a03'],
  ['prod-08-toner-hoa-hong', 'photo-1601049541289-9b1b7bbbfe19'],
  ['prod-09-kem-chong-nang', 'photo-1556228720-195a672e8a03'],
  ['prod-10-kem-duong-nghe', 'photo-1620916566398-39f1143ab7be'],
  ['prod-11-muoi-ngam-chan', 'photo-1515377905703-c4788e51af15'],
  ['prod-12-tui-ngam-vai-gay', 'photo-1544161515-4ab6ce6db874'],
  ['prod-13-body-scrub-cafe', 'photo-1587049352846-4a222e784d38'],
  ['prod-14-dau-goi-bo-ket', 'photo-1535585209827-a15fcdbc4c2d'],
  ['prod-15-dau-xa-voi-buoi', 'photo-1522337360788-8b13dee7a37e'],
  ['prod-16-son-duong-moi', 'photo-1571781926291-c477ebfd024b'],
  ['prod-17-tra-duong-sinh', 'photo-1544787219-7f47ccb76574'],
  ['prod-18-cao-gung-mat-ong', 'photo-1556679343-c7306c1976bc'],
  ['prod-19-bo-kit-4-buoc', 'photo-1596462502278-27bfdc403348'],
  ['prod-20-bo-qua-tang', 'photo-1596178065887-1198b6148b2b'],
]

fs.mkdirSync(OUT, { recursive: true })
for (const [name, id] of MAP) {
  const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&q=70`
  const res = await fetch(url)
  if (!res.ok) { console.log(name, 'FAIL', res.status); continue }
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(path.join(OUT, name + '.jpg'), buf)
  console.log(name, 'saved', buf.length)
}
console.log('OK ->', OUT)
