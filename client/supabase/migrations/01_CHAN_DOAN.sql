-- ============================================================
-- EVA SPA — 01_CHAN_DOAN.sql (CHỈ ĐỌC — KHÔNG sửa gì)
-- Supabase → SQL Editor → New → dán HẾT → Run → COPY bảng kết quả → dán vào chat.
-- Mỗi dòng cho biết PROJECT nào đang mở + thiếu gì.
-- ============================================================
SELECT '01_project'  AS k, current_database() AS v
UNION ALL SELECT '02_popup_configs_co_bang', (to_regclass('public.popup_configs') IS NOT NULL)::text
UNION ALL SELECT '03_blog_posts_author',
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema='public' AND table_name='blog_posts' AND column_name='author')::text
UNION ALL SELECT '04_products_category',
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='category')::text
UNION ALL SELECT '05_cart_product_name',
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cart_items' AND column_name='product_name')::text
UNION ALL SELECT '06_products_dong', (SELECT count(*) FROM public.products)::text;
