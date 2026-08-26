# SPA Info Repo - Project Overview & Architecture Guide

This document provides a comprehensive technical overview of the **Eva Spa Fullstack E-Commerce & Appointment Booking Platform** architecture, environment paths, file structure, database schema, and operational commands.

---

## 🏗️ Architecture Overview

The application follows a modern decoupled 3-tier Fullstack Architecture:

```text
[ React 19 + Vite Frontend ]  ==== (REST API) ====>  [ Laravel 12 Backend ]  ==== (PostgREST Client) ====>  [ Supabase PostgreSQL ]
     http://localhost:5173                                http://127.0.0.1:8000                                https://lydxhltbvsuyrbvulkwe.supabase.co
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

Base Backend URL: `http://127.0.0.1:8000`

| Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API Health & status endpoint | None |
| `POST` | `/api/appointments` | Tạo lịch hẹn mới (Tự động tạo user Supabase Auth & gửi mail) | `{ customer_name, customer_phone, customer_email, appointment_date, service_id, notes }` |
| `GET` | `/api/appointments` | Lấy danh sách lịch hẹn cho Admin | `?status=pending` (optional) |
| `PATCH` | `/api/appointments/{id}` | Admin duyệt/hủy lịch hẹn (gửi mail thông báo khách) | `{ status: "confirmed"/"completed"/"cancelled" }` |
| `POST` | `/api/orders` | Khách đặt hàng từ giỏ hàng (trừ tồn kho & gửi hóa đơn) | `{ customer_name, customer_phone, customer_email, customer_address, total_amount, payment_method, items }` |
| `GET` | `/api/orders` | Lấy danh sách đơn hàng kèm chi tiết món | `?status=pending` (optional) |
| `PATCH` | `/api/orders/{id}` | Admin đổi trạng thái đơn hàng (gửi mail thông báo giao hàng) | `{ status: "shipped"/"completed"/"cancelled" }` |

---

## 💳 Cấu Hình Thanh Toán VietQR
- **Ngân hàng**: VietinBank (Việt Nam Công Thương)
- **Số tài khoản**: `0364911491`
- **Chủ tài khoản**: `TRAN TRUNG KIEN`
- **VietQR QuickLink Format**: `https://img.vietqr.io/image/VietinBank-0364911491-compact2.png?amount={AMOUNT}&addInfo={ORDER_CODE}&accountName=TRAN%20TRUNG%20KIEN`

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
  php -S 127.0.0.1:8000 -t public
  ```
