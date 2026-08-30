-- ============================================================
-- Migration: đồng bộ public.orders với schema khai trong repo
-- + bổ sung cột TMĐT (2026-08-31)
-- Bối cảnh: bảng `orders` TRÊN SUPABASE ĐÃ BỊ LỆCH — thực tế chỉ còn
--   id, total_amount, status, created_at (đo trực tiếp bằng PostgREST:
--   mọi cột customer_* trả 400/42703). `CREATE TABLE IF NOT EXISTS`
--   trong migration gốc KHÔNG tự bù cột cho bảng đã tồn tại → chạy lại
--   migration gốc là KHÔNG ĐỦ. File này dùng ALTER ... ADD COLUMN IF NOT
--   EXISTS cho toàn bộ cột, chạy idempotent.
-- Chạy: Supabase → SQL Editor → dán toàn bộ → Run.
-- ============================================================

ALTER TABLE public.orders
  -- cột bắt buộc theo 20260809000000_create_spa_ecommerce_tables.sql
  ADD COLUMN IF NOT EXISTS user_id         UUID,
  ADD COLUMN IF NOT EXISTS customer_name   TEXT,
  ADD COLUMN IF NOT EXISTS customer_email  TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone  TEXT,
  ADD COLUMN IF NOT EXISTS customer_address TEXT,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT now(),
  -- cột TMĐT mới cho đơn Giỏ hàng (Checkout.tsx / OrderController::store)
  ADD COLUMN IF NOT EXISTS shipping_fee    NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method  TEXT DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS notes           TEXT,
  ADD COLUMN IF NOT EXISTS order_code      TEXT;

-- customer_name/customer_email có dữ liệu NULL cũ → DEFAULT an toàn
ALTER TABLE public.orders
  ALTER COLUMN customer_name SET DEFAULT '',
  ALTER COLUMN customer_email SET DEFAULT '';

-- order_code UNIQUE (fallback insert của client cần upsert-safe)
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_code_key ON public.orders (order_code);

-- FK user_id -> public.users chỉ gắn khi chưa tồn tại (an toàn idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Bắt buộc PostgREST nạp lại schema cache (khắc phục PGRST204/PGRST205)
NOTIFY pgrst, 'reload schema';

-- KIỂM TRA SAU KHI CHẠY (phải trả về đủ 13 cột):
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='orders'
--   ORDER BY ordinal_position;
--
-- Sau đó seed sản phẩm (count phải = 20):
--   chạy server/database/seeders/seed_products.sql
