-- ============================================================
-- EVA SPA — CHAN_DOAN.sql (CHỈ ĐỌC — KHÔNG sửa gì)
-- Supabase Dashboard → SQL Editor → New → dán TOÀN BỘ → Run.
-- Bôi đen bảng kết quả → Ctrl+C → dán vào chat cho tôi.
-- ============================================================

SELECT '01_popup_configs_ton_tai' AS kiem_tra,
       case when to_regclass('public.popup_configs') is null then 'FAIL' else 'OK' end AS ket_qua
UNION ALL
SELECT '02_blog_posts_author',
       case when exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='blog_posts' and column_name='author')
            then 'OK' else 'FAIL' end
UNION ALL
SELECT '03_products_category',
       case when exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='products' and column_name='category')
            then 'OK' else 'FAIL' end
UNION ALL
SELECT '04_cart_product_name',
       case when exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='cart_items' and column_name='product_name')
            then 'OK' else 'FAIL' end
UNION ALL
SELECT '05_orders_address',
       case when exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='orders' and column_name='customer_address')
            then 'OK' else 'FAIL' end
UNION ALL
SELECT '06_project_nay_la', current_database();
