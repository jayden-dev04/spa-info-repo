# Eva Spa — Quy trình chạy migration & seed (làm MỘT lần)

Bạn chỉ cần **2 bước**, mỗi bước copy-paste nguyên file vào
**Supabase Dashboard → SQL Editor → Run**:

## Bước 1 — đồng bộ schema
File: `client/supabase/migrations/20260831000000_sync_schema.sql`

- Idempotent (chạy lại nhiều lần an toàn, không mất dữ liệu).
- Sửa đúng các lỗi `PGRST204` đã kiểm chứng bằng PostgREST:
  - `orders` thiếu `customer_name/email/phone/address`, `shipping_fee`,
    `payment_method`, `notes`, `order_code`, `user_id` → lỗi
    *"Could not find the 'customer_address' column of 'orders'…"*
  - `products` thiếu `stock`, `category`, `original_price`, `rating`
  - `appointments` thiếu `user_id`, `customer_*`, `notes`
  - `order_items` thiếu `price`
  - `popup_configs` chưa tồn tại
- Cuối file có `NOTIFY pgrst, 'reload schema';` → PostgREST nhận cột mới ngay.
- Cuối file tạo policy RLS `*_anon_all` (chỉ khi chưa có policy nào) để
  luồng khách (guest đặt hàng/đặt lịch) ghi được bằng publishable key —
  không ghi đè chính sách RLS bạn đã tự đặt trong Dashboard.

## Bước 2 — nạp dữ liệu thật
Hai file này **tự xóa bảng cũ rồi chèn lại** (idempotent), chạy theo thứ tự:

1. `server/database/seeders/seed_services.sql` → `services` có 5 liệu trình
   (nguồn cho trang chủ "Dịch Vụ Nổi Bật Tại Eva Spa" + dropdown trang Booking
   + tab Dịch Vụ trong admin — tất cả cùng đọc bảng `public.services`).
2. `server/database/seeders/seed_products.sql` → `products` có **20 sản phẩm**,
   mọi `image_url` đã kiểm tra HTTP HEAD = 200
   (`client/scripts/fetch-product-images.mjs`).

## Kiểm tra sau khi chạy (SQL Editor)
```sql
SELECT 'services' t, count(*) FROM public.services
UNION ALL SELECT 'products', count(*) FROM public.products
UNION ALL SELECT 'popup_configs', count(*) FROM public.popup_configs;
-- kỳ vọng: services = 5, products = 20, popup_configs >= 0
```

## Sau đó
- Không cần restart Laravel/Vite. Reload trang web: Shop đọc `products` thật,
  Home/Booking đọc `services` thật, Checkout `POST /api/orders`
  (OrderController) ghi đủ `customer_address` → hết lỗi PGRST204.
- Đặt đơn thật test: nếu vẫn báo thiếu cột, chạy lại lệnh
  `NOTIFY pgrst, 'reload schema';` trong SQL Editor (schema cache).
