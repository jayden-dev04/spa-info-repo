# Eva Spa — Dữ liệu ở đâu? (Supabase là nguồn sự thật)

## Chạy một lần (bắt buộc trước khi test)

1. Supabase Dashboard → **SQL Editor** → New → paste toàn bộ
   `client/supabase/migrations/00_RUN_NAY.sql` → Run.
2. Nạp dữ liệu (20 sản phẩm + 14 bài blog + popup coupon):
   ```powershell
   cd client
   $env:SUPABASE_URL='https://lydxhltbvsuyrbvulkwe.supabase.co'
   $env:SUPABASE_KEY='<publishable key>'   # sb_publishable_... trong .env
   node --experimental-strip-types scripts/load-data-to-supabase.mjs
   ```
   Script in `products OK x20`, `blog_posts OK x14`, `popup_configs OK`.
3. Server `.env` phải có `SUPABASE_SECRET_KEY` (sb_secret_…) — backend Laravel
   dùng nó bypass RLS khi tạo user/appointments/orders. `server/.env.example`
   đã có mục hướng dẫn.

## Bảng đang dùng (public schema)

| Dữ liệu | Bảng Supabase | Code ghi/đọc | Cache offline (chỉ tốc độ, không phải nguồn) |
|---|---|---|---|
| Sản phẩm (Shop + admin ProductsTab) | `products` | `Shop.tsx` đọc; `ProductsTab.tsx` CRUD | — |
| Giỏ hàng | `cart_items` (chủ = `session_key` uuid máy khách, hoặc `'u:<uid>'` khi đăng nhập → đồng bộ đa máy; upsert theo UNIQUE `(session_key, product_id)`) | `CartContext.tsx` | `eva_spa_shopping_cart` |
| Đơn hàng | `orders` + `order_items` (trigger sinh `order_code`, `total_amount`, timestamps) | `Checkout.tsx` → `POST /api/orders` (Laravel); admin OrdersTab đọc | — |
| Lịch hẹn | `appointments` (`service_id` INTEGER khớp `services.id`; trigger timestamps) | `Booking.tsx` → `POST /api/appointments` (Laravel validate `service_id integer`); admin AppointmentsTab đọc | — |
| Bài blog SEO (14 bài) | `blog_posts` | `BlogTab.tsx` (admin) upsert/delete; `Blog.tsx`/`BlogDetail.tsx` đọc | `eva_spa_admin_blog_posts` |
| Popup + banner Ưu đãi tháng này + coupon | `popup_configs` (key `default`, JSONB) | `PopupTab.tsx` lưu; `PromoPopup.tsx`, banner `App.tsx`, ô coupon `Checkout.tsx` đọc qua `src/lib/siteConfig.ts` | `eva_spa_popup_config` |
| Dịch vụ | `services` | Home/Booking hook `useActiveServices` (id số); admin ServicesTab CRUD | mảng fallback trong code |

localStorage còn lại KHÔNG phải nguồn sự thật: chỉ cache hiển thị tức thì và cờ
tần suất popup (`eva_spa_popup_shown`, `eva_spa_popup_last_shown`) — UI-state riêng máy.

`eva_spa_current_user` (AuthContext) chỉ là cache phiên; nguồn là Supabase Auth +
bảng `users`. Đăng nhập CHỈ Google (`signInWithOAuth`); role KHÔNG chọn ở form —
backend `POST /api/auth/exchange` tra bảng `users` rồi trả về.

## Tái sinh seed blog

`client/src/lib/blogSeeds.ts` là bản seed dùng chung (admin BlogTab khởi tạo,
script sinh SQL). Sau khi seed, mọi chỉnh sửa của admin nằm trong `public.blog_posts`.
```powershell
cd client && node --experimental-strip-types scripts/seed-blog-posts.mjs --write
```

Kiểm tra nhanh:
```sql
SELECT 'products' t, count(*) n FROM public.products
UNION ALL SELECT 'blog_posts', count(*) FROM public.blog_posts
UNION ALL SELECT 'popup_configs', count(*) FROM public.popup_configs
UNION ALL SELECT 'services', count(*) FROM public.services;
-- kỳ vọng 20 / 14 / 1 / 5
```
