# Eva Spa — Dữ liệu ở đâu? (Supabase là nguồn sự thật)

## Bảng đang dùng (public schema)

| Dữ liệu | Bảng Supabase | Code ghi/đọc | Cache offline (chỉ tốc độ, không phải nguồn) |
|---|---|---|---|
| Sản phẩm (Shop + admin ProductsTab) | `products` | `Shop.tsx` đọc; `ProductsTab.tsx` CRUD | — |
| Giỏ hàng | `cart_items` (bảng mới) | `CartContext.tsx` upsert/delete theo `session_key` (khách) hoặc `user_id` (đã đăng nhập) | `eva_spa_shopping_cart` |
| Đơn hàng | `orders` + `order_items` | `Checkout.tsx` → `POST /api/orders` (Laravel) hoặc fallback Supabase; admin `Dashboard.tsx`/OrdersTab đọc | — |
| Lịch hẹn | `appointments` | `Booking.tsx` → `POST /api/appointments`; admin Dashboard/AppointmentsTab đọc | — |
| Bài blog SEO (14 bài) | `blog_posts` | `BlogTab.tsx` (admin) upsert/delete; `Blog.tsx`/`BlogDetail.tsx` đọc | `eva_spa_admin_blog_posts` |
| Popup + banner Ưu đãi tháng này + coupon | `popup_configs` (key `default`, JSONB) | `PopupTab.tsx` lưu; `PromoPopup.tsx`, banner `App.tsx`, ô coupon `Checkout.tsx` đọc qua `src/lib/siteConfig.ts` | `eva_spa_popup_config` |
| Dịch vụ | `services` | Home/Booking hook `useActiveServices`; admin ServicesTab CRUD | — |

localStorage còn lại KHÔNG phải nguồn sự thật: chỉ là cache hiển thị tức thì
(giỏ hàng khi offline, popup khi chưa fetch xong) và cờ tần suất popup
(`eva_spa_popup_shown`, `eva_spa_popup_last_shown`) — các cờ này vốn là
UI-state của riêng máy người xem, không phải dữ liệu dùng chung.

`eva_spa_current_user` (AuthContext) cũng chỉ là cache phiên đăng nhập;
nguồn là Supabase Auth + bảng `users` (role quyết định ở backend
`POST /api/auth/exchange`).

## Nguồn bài blog 14 bài

`client/src/lib/blogSeeds.ts` là bản seed dùng chung (admin BlogTab khởi tạo,
script sinh SQL). Sau khi seed, mọi chỉnh sửa của admin nằm trong
`public.blog_posts`.

## Migration / seed phải chạy (Supabase → SQL Editor, theo thứ tự)

1. `client/supabase/migrations/20260831000000_sync_schema.sql`
   — bù cột lệch cho orders/products/appointments/order_items, tạo
   `popup_configs`, chính sách RLS.
2. `client/supabase/migrations/20260831100000_data_on_supabase.sql`
   — 20 sản phẩm thật, popup_config `default` + coupon `T7SPRING`,
   bảng `cart_items` (RLS).
3. `client/supabase/seeders/seed_blog_posts.sql`
   — 14 bài blog SEO (idempotent, upsert theo slug).
   (Tái sinh: `cd client && node --experimental-strip-types scripts/seed-blog-posts.mjs --write`)
4. `server/database/seeders/seed_services.sql` — 5 liệu trình.

Kiểm tra nhanh sau khi chạy:

```sql
SELECT 'products', count(*) FROM public.products
UNION ALL SELECT 'blog_posts', count(*) FROM public.blog_posts
UNION ALL SELECT 'popup_configs', count(*) FROM public.popup_configs
UNION ALL SELECT 'services', count(*) FROM public.services;
-- kỳ vọng 20 / 14 / 1 / 5
```
