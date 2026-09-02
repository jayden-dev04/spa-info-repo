# Eva Spa — Dữ liệu ở đâu? (Supabase là nguồn sự thật)

## NẠP 1 LẦN — 2 BƯỚC, KHÔNG CẦN CHẠY TERMINAL NÀO

Tool local `/dev/tool` (chỉ chạy khi `APP_ENV=local`) lo hết migrate + seed.

### Bước 1 — dán key vào form
Mở trình duyệt: **http://127.0.0.1:8000/dev/tool**
(đảm bảo Laravel đang chạy: `cd server && php -S 127.0.0.1:8000 -t public`).
- Copy Secret Key (bắt đầu bằng `sb_secret_…`) từ Supabase Dashboard → Settings → API Keys.
- Dán vào ô trên trang, bấm **Lưu vào .env**. Key chỉ nằm trong `server/.env` máy bạn.

### Bước 2 — bấm nút trên cùng trang đó
Bấm theo thứ tự: **Migrate (schema)** → **Seed (20 SP + 14 blog + popup)** → **Status**.
- Lần bấm Migrate đầu, nếu JSON trả về có `"step":"can_exec_sql"` + `setup_sql`:
  copy nguyên đoạn `setup_sql` (5 dòng, tạo hàm `exec_sql` chỉ service_role dùng) dán vào
  Supabase SQL Editor → Run 1 lần, rồi bấm Migrate lại → Seed → Status.
- Status mong muốn: `secret_key_ok: true`, các `checks` = `"ok"`.

## Bảng đang dùng (public schema)

| Dữ liệu | Bảng Supabase | Code ghi/đọc | Cache offline (chỉ tốc độ, không phải nguồn) |
|---|---|---|---|
| Sản phẩm (Shop + admin ProductsTab) | `products` (có cả `category` TEXT + `category_id` FK) | `Shop.tsx` đọc; `ProductsTab.tsx` CRUD | — |
| Giỏ hàng | `cart_items` (chủ = `session_key` máy khách, hoặc `'u:<uid>'` khi đăng nhập → đồng bộ đa máy; UNIQUE `(session_key, product_id)`) | `CartContext.tsx` | `eva_spa_shopping_cart` |
| Đơn hàng | `orders` (+ `order_items`) | `Checkout.tsx` → `POST /api/orders`; admin OrdersTab; trang `MyOrdersPage`/`OrderDetailPage` | — |
| Lịch hẹn | `appointments` (`service_id` INTEGER khớp `services.id`) | `Booking.tsx` → `POST /api/appointments`; admin AppointmentsTab; `MyAppointmentsPage` | — |
| Bài blog SEO (14 bài) | `blog_posts` | `BlogTab.tsx` (admin) upsert; `Blog.tsx`/`BlogDetail.tsx` đọc | `eva_spa_admin_blog_posts` |
| Popup + banner + coupon | `popup_configs` (key `default`, JSONB) | `PopupTab.tsx` lưu; `PromoPopup.tsx`, banner `App.tsx`, ô coupon `Checkout.tsx` đọc qua `src/lib/siteConfig.ts` | `eva_spa_popup_config` |
| Dịch vụ | `services` | Home/Booking `useActiveServices` (id số); admin ServicesTab | mảng fallback trong code |

localStorage còn lại KHÔNG phải nguồn sự thật: chỉ cache hiển thị tức thì và cờ
tần suất popup (`eva_spa_popup_shown`, `eva_spa_popup_last_shown`) — UI-state riêng máy.

`eva_spa_current_user` (AuthContext) chỉ là cache phiên; nguồn là Supabase Auth +
bảng `users`. Đăng nhập CHỈ Google (`signInWithOAuth`); role KHÔNG chọn ở form —
backend `POST /api/auth/exchange` tra bảng `users` rồi trả về.

## Tài khoản cá nhân (tab/lịch hẹn/đơn)

- Trang bảng: `/account/orders` (Đơn Hàng Của Tôi), `/account/appointments` (Lịch Hẹn Của Tôi)
  — mỗi dòng đơn link sang `/orders/:code` (trang chi tiết).
- Trang chi tiết đơn: `OrderDetailPage` (`/orders/<EVA-…>`) — bảng item + 2 cột Vận Chuyển/Thanh Toán.
- Chưa đăng nhập: trang hiện khối Đăng Nhập; DB lỗi → tự fallback mock (`MOCK_ORDERS`, `MOCK_APPOINTMENTS`
  trong `client/src/lib/orderSeed.ts`). preview mock không cần login: thêm `?dev=1` (chỉ dev build).

## Tái sinh seed blog

`client/src/lib/blogSeeds.ts` là nguồn seed (admin BlogTab khởi tạo, script sinh SQL):
```powershell
cd client && node --experimental-strip-types scripts/seed-blog-posts.mjs --write   # SQL
# server/.tmp-blog-posts.json regenerate:
node --experimental-strip-types -e "import('./src/lib/blogSeeds.ts').then(m=>require('fs').writeFileSync('../server/.tmp-blog-posts.json',JSON.stringify(m.BLOG_SEEDS.map(p=>({slug:p.seoData.slug,title:p.title,category:p.category,excerpt:p.excerpt,content:p.content,image_url:p.featuredImage,views:p.views,read_time:p.readTime,date_label:p.date,author:p.author,meta_title:p.seoData.metaTitle,meta_description:p.seoData.metaDescription,focus_keyword:p.seoData.focusKeyword,published_at:p.status==='published'?new Date().toISOString():null})))))"
```

## Dự phòng không-cần-tool

`client/supabase/migrations/PASTE_NAY.sql` — dán nguyên văn vào SQL Editor nếu
không dùng `/dev/tool` (RLS mở cho anon → SPA đọc/ghi bằng publishable key; sau khi
mở thì không cần key nữa cho phần đọc).
