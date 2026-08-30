# SPA Info Repo - Project Overview & Architecture Guide

This document provides a comprehensive technical overview of the **Eva Spa Fullstack E-Commerce & Appointment Booking Platform** architecture, environment paths, file structure, database schema, and operational commands.

---

## 🏗️ Architecture Overview

The application follows a modern decoupled 3-tier Fullstack Architecture:

```text
[ React 19 + Vite Frontend ]  ==== (REST API) ====>  [ Laravel 12 Backend ]  ==== (PostgREST Client) ====>  [ Supabase PostgreSQL ]
     http://localhost:5173                                http://localhost:8000                                https://lydxhltbvsuyrbvulkwe.supabase.co
```

1. **Frontend (`client/`)**: Single Page Application built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and **shadcn/ui** components.
   - **Cart State**: `CartContext` with LocalStorage sync and Slide-over `CartDrawer`.
   - **Checkout**: Shipping form, COD, and Dynamic **VietQR** (VietinBank - 0364911491 - TRAN TRUNG KIEN).
   - **CMS Admin**: Dashboard with Orders, Products, Appointments, Services, Blogs, Popups, and Staff management.
2. **Backend (`server/`)**: **Laravel 12 (PHP 8.4)** REST API engine handling CORS, CSRF bypass, Order inventory deduction, Supabase auth/data sync, and HTML email invoices.
3. **Database (`supabase/`)**: Cloud **Supabase PostgreSQL** instance with `users`, `products`, `orders`, `order_items`, `services`, `appointments`, and `blogs`.

---

## 📂 Project Directory Structure

```text
spa-info-repo-main/
├── run.bat                          # One-click Windows batch script to launch both FE & BE
├── PROJECT_OVERVIEW.md              # Architecture & API documentation
├── client/                          # React Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── cart/CartDrawer.tsx  # Slide-over shopping cart drawer
│   │   │   ├── shop/ProductDetailModal.tsx # Product quick-view & detail modal
│   │   │   ├── ui/                  # shadcn UI components (Button, Card, Badge, Input, Table, etc.)
│   │   │   └── PromoPopup.tsx       # Marketing promo popup modal
│   │   ├── context/
│   │   │   └── CartContext.tsx      # Global cart state management
│   │   ├── lib/
│   │   │   ├── utils.ts             # Tailwind classnames helper (cn)
│   │   │   └── supabase.ts          # Supabase client singleton
│   │   ├── pages/
│   │   │   ├── Home.tsx             # Spa landing homepage
│   │   │   ├── Booking.tsx          # Appointment booking page
│   │   │   ├── Shop.tsx             # E-commerce herbal cosmetic catalog
│   │   │   ├── Checkout.tsx         # Shipping & VietQR/COD checkout page
│   │   │   ├── OrderSuccess.tsx     # Order confirmation & QR bank transfer view
│   │   │   ├── Blog.tsx             # Spa herbal health & beauty articles
│   │   │   ├── BlogDetail.tsx       # Full blog article reader page (/blog/:slug)
│   │   │   └── admin/               # Admin CMS Dashboard & Management Tabs
│   │   │       ├── Dashboard.tsx
│   │   │       └── components/
│   │   │           ├── AdminSidebar.tsx
│   │   │           ├── OverviewTab.tsx
│   │   │           ├── AppointmentsTab.tsx
│   │   │           ├── OrdersTab.tsx
│   │   │           ├── ProductsTab.tsx
│   │   │           ├── ServicesTab.tsx
│   │   │           ├── BlogTab.tsx
│   │   │           └── PopupTab.tsx
│   │   ├── App.tsx                  # Main Router & Layout definition
│   │   └── index.css                # Tailwind CSS v4 styling
│   └── vite.config.ts               # Vite configuration
└── server/                          # Laravel Backend Application
    ├── app/
    │   ├── Http/Controllers/
    │   │   ├── AppointmentController.php # Appointment booking & guest auth sync
    │   │   └── OrderController.php       # E-Commerce orders, stock deduction & invoices
    │   └── Mail/
    │       ├── AppointmentConfirmed.php  # Appointment email mailable
    │       └── OrderPlaced.php           # Order invoice email mailable
    ├── database/seeders/
    │   ├── seed_services.sql        # Default spa services seeder
    │   └── seed_products.sql        # Default herbal products seeder
    ├── resources/views/emails/      # Luxury Spa HTML email templates
    └── routes/web.php               # API route definitions
```

---

## 🔌 API Endpoints Reference

Base Backend URL: `http://localhost:8000`

| Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API Health & status endpoint | None |
| `POST` | `/api/appointments` | Tạo lịch hẹn mới (Tự động tạo user Supabase Auth & gửi mail) | `{ customer_name, customer_phone, customer_email, appointment_date, service_id, notes }` |
| `GET` | `/api/appointments` | Lấy danh sách lịch hẹn cho Admin | `?status=pending` (optional) |
| `PATCH` | `/api/appointments/{id}` | Admin duyệt/hủy lịch hẹn (gửi mail thông báo khách) | `{ status: "confirmed"/"completed"/"cancelled" }` |
| `POST` | `/api/orders` | Khách đặt hàng từ giỏ hàng (trừ tồn kho & gửi hóa đơn) | `{ customer_name, customer_phone, customer_email, customer_address, total_amount, payment_method, items }` |
| `GET` | `/api/orders` | Lấy danh sách đơn hàng kèm chi tiết món | `?status=pending` (optional) |
| `PATCH` | `/api/orders/{id}` | Admin đổi trạng thái đơn hàng (gửi mail thông báo giao hàng) | `{ status: "shipped"/"completed"/"cancelled" }` |
| `POST` | `/api/auth/exchange` | Backend kiểm tra role SAU khi client đăng nhập Google (role duy nhất do server quyết định) | `{ access_token }` → `{ success, user: { id, email, fullName, role } }` |

## 🔐 Đăng nhập & Phân quyền (chỉ Google)

- Frontend **chỉ còn một nút đăng nhập: Google** (`supabase.auth.signInWithOAuth({ provider: 'google' })`). Không còn form email/mật khẩu, không còn tab chọn role.
- `AuthModal.tsx` redirect về `http://localhost:5173/auth/callback` → `AuthCallback.tsx` chờ supabase-js đổi `?code=` lấy session.
- `AuthContext.tsx` gửi `access_token` lên `POST /api/auth/exchange`. **Backend** (`AuthController::exchange`) xác thực token với Supabase `/auth/v1/user`, tra `role` trong bảng `users` theo `uuid`, rồi đối chiếu `ADMIN_EMAILS` / `STAFF_EMAILS` — client không tự khai role.
- Route `/admin` được `AdminPortalRoute` chặn: role != `admin|staff` → chuyển về `/account`.
- **Vì sao role nằm ở `public.users` chứ không phải Authentication?** `auth.users` (bảng hệ thống của GoTrue, không sửa trực tiếp) chỉ lưu danh tính + `raw_user_meta_data`. `raw_user_meta_data` do chính client đổi được (`supabase.auth.updateUser({ data: { role: 'admin' } })`) nên không dùng làm nguồn quyền hạn. `public.users` là bảng application-level của mình (`id` = auth uid, `email`, `role`, `account_source`) — backend (`adminHeaders()` = key có quyền service_role) đọc qua PostgREST `select=role,account_source&or=(id.eq.<uid>,email.eq.<email>)`, ưu tiên row không phải `guest_booking`. Đây cũng chính là bảng mà `AppointmentController` và trigger `handle_new_user()` đang ghi.
- Muốn đổi ai là admin/staff: sửa role trong `public.users` (Supabase → Table Editor), hoặc thêm email vào `ADMIN_EMAILS` / `STAFF_EMAILS` trong `server/app/Http/Controllers/AuthController.php`.
- Xóa toàn bộ tài khoản (cả `auth.users` lẫn `public.users`): chạy `client/supabase/NUKE_users_and_auth.sql` trong Supabase → SQL Editor. Phải chạy ở Dashboard vì cần service_role key; `SUPABASE_SECRET_KEY` trong `server/.env` hiện là publishable key nên mọi call admin API trả 401.

### Bật provider Google trong Supabase (làm MỘT lần)

Supabase hiện trả `external.google = false` → nút Google sẽ lỗi tới khi bật provider.

1. `SUPABASE_URL` → **Settings → API Keys**: lấy **SECRET key** (`sb_secret_...`), dán vào `SUPABASE_SECRET_KEY` trong `server/.env`.
   (Hiện key này đang trùng publishable key nên mọi call admin API đang 401.)
2. Chạy:
   ```cmd
   cd server
   php enable-google-oauth.php
   ```
   Script đọc `client_id` / `client_secret` từ `server/.google_oauth.local` (đã gitignore) và gọi
   `PUT /auth/v1/admin/config`.
3. Google Cloud → Credentials → OAuth client: thêm redirect URI
   `https://lydxhltbvsuyrbvulkwe.supabase.co/auth/v1/callback`.
4. Supabase → Authentication → **URL Configuration** → Redirect URLs:
   `http://localhost:5173/auth/callback`, `http://127.0.0.1:5173/auth/callback`
   (và `Site URL` = `http://localhost:5173`).
5. Google Cloud → Authorized JavaScript origins: `http://localhost:5173`, `http://127.0.0.1:5173`.

Vite chạy `host: true` nên cả `localhost:5173` lẫn `127.0.0.1:5173` đều mở được.

---

## 💳 Cấu Hình Thanh Toán VietQR
- **Ngân hàng**: VietinBank (Việt Nam Công Thương)
- **Số tài khoản**: `0364911491`
- **Chủ tài khoản**: `TRAN TRUNG KIEN`
- **VietQR QuickLink Format**: `https://img.vietqr.io/image/VietinBank-0364911491-compact2.png?amount={AMOUNT}&addInfo={ORDER_CODE}&accountName=TRAN%20TRUNG%20KIEN`

### Lỗi "Could not find the column 'orders.customer_address' ..."

Sập nguồn: **schema DB thật trên Supabase đã bị lệch** so với migration khai trong repo
(`client/supabase/migrations/20260809000000_create_spa_ecommerce_tables.sql`).
Kiểm chứng trực tiếp bằng PostgREST (publishable key): bảng `orders` thật CHỈ còn các cột
`id, total_amount, status, created_at`; toàn bộ `customer_name, customer_email, customer_phone,
customer_address, shipping_fee, payment_method, notes, order_code` đều trả `400/42703`.
`OrderController::store` ghi đúng 6 cột theo migration → bị PostgREST từ chối, và message lỗi
từ PostgREST (`... does not exist`) mới là dòng hiện ra trong toast đỏ khi bấm Đặt hàng
(KHÔNG phải banner tự vẽ).

Cách sửa (làm MỘT lần, theo thứ tự — KHÔNG phải lỗi code client/server):

1. Mở Supabase → **SQL Editor**, chạy `client/supabase/migrations/20260831000000_sync_schema.sql`
   — file idempotent đồng bộ TOÀN BỘ bảng (products thiếu `stock`/`category`/`original_price`/`rating`,
   orders thiếu `customer_*` + cột TMĐT...). `CREATE TABLE IF NOT EXISTS` trong migration gốc
   KHÔNG tự bù cột cho bảng đã tồn tại nên chạy lại nó là không đủ. File cuối cùng có sẵn
   `NOTIFY pgrst, 'reload schema';` (khắc phục `PGRST204/PGRST205`).
   (Hoặc gọn hơn: chạy riêng `20260830000000_add_columns_to_orders.sql` nếu chỉ cần bảng `orders`.)
2. Chạy `server/database/seeders/seed_products.sql` (count phải = 20).
3. `services` phải có 5 dòng — đã kiểm chứng trực tiếp `Content-Range: 0-0/5`
   (giá khớp `Booking.tsx` và `serviceMap` trong `AppointmentController`).

---

## 🚀 Commands & Development Scripts

### Launch Everything (One-Click)
Run the root batch file:
```cmd
run.bat
```

### Manual Commands
- **Start React Frontend**:
  ```cmd
  cd client
  npm run dev
  ```
- **Build React Frontend**:
  ```cmd
  cd client
  npm run build
  ```
- **Start Laravel Backend**:
  ```cmd
  cd server
  php -S localhost:8000 -t public
  ```
