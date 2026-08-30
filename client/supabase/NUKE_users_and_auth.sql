# Eva Spa — Xóa toàn bộ public.users + Supabase Authentication
# Chạy file này trong Supabase Dashboard → SQL Editor → New query.
# (Cần quyền owner project. Repo này không có service_role key hợp lệ nên backend
#  không tự gọi /auth/v1/admin được — xem lý do bên dưới.)
#
# Cách gọn: Supabase Dashboard → Project Settings → General → Destroy project
#   rồi tạo project mới, chạy lại 2 file trong client/supabase/migrations/.
# Nếu muốn giữ project (đừng URL, key, provider Google đã cấu hình) → chạy SQL dưới.

-- ============================================================
-- BƯỚC 1. Xóa trigger tự tạo row public.users khi có auth user mới.
--         (Không xóa trigger thì vừa xóa xong, đăng nhập lại là row mọc ra.)
--         Tên trigger có thể khác nhau giữa các bản: xóa hết trigger liên quan.
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================
-- BƯỚC 2. Xóa toàn bộ tài khoản Authentication (bảng hệ thống auth.users).
--         Xóa luôn sessions/refresh_tokens/mfa/identities theo ON DELETE CASCADE.
-- ============================================================
TRUNCATE TABLE auth.users RESTART IDENTITY CASCADE;

-- ============================================================
-- BƯỚC 3. Xóa toàn bộ hồ sơ trong public.users.
--         (Lịch hẹn / đơn hàng tham chiếu email + user id bằng TEXT nên vẫn còn —
--          muốn xóa luôn thì bỏ comment các dòng dưới.)
-- ============================================================
TRUNCATE TABLE public.users RESTART IDENTITY CASCADE;

-- Bỏ comment nếu muốn xóa luôn dữ liệu nghiệp vụ:
-- TRUNCATE TABLE public.appointments RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE public.order_items  RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE public.orders       RESTART IDENTITY CASCADE;

-- ============================================================
-- KIỂM TRA LẠI
-- ============================================================
SELECT count(*) AS auth_users FROM auth.users;
SELECT count(*) AS public_users FROM public.users;

-- ============================================================
-- LƯU Ý SAU KHI XÓA
--   1. Mọi tài khoản (kể cả admin/staff) biến mất. Tài khoản admin/staff đầu tiên
--      phải đăng nhập Google xong, rồi gán role trong public.users:
--        UPDATE public.users SET role = 'admin' WHERE email = 'email-cua-ban@gmail.com';
--      (hoặc thêm email đó vào ADMIN_EMAILS trong
--       server/app/Http/Controllers/AuthController.php — cách này không cần đụng DB).
--   2. Khách đặt lịch dạng guest trước đó (account_source = 'guest_booking') cũng bị
--      xóa tài khoản; lịch hẹn của họ vẫn còn nếu không TRUNCATE appointments.
--   3. vì sao phải chạy bằng Dashboard/SQL Editor: các API xóa user
--      (/auth/v1/admin/users) và TRUNCATE bảng hệ thống yêu cầu service_role key.
--      server/.env hiện chỉ có publishable key (SUPABASE_SECRET_KEY đang trùng
--      publishable key → mọi call admin API trả 401), nên backend không tự làm được.
-- ============================================================
