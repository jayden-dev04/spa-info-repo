-- ============================================================
-- EVA SPA — CHAN_DOAN.sql (CHỈ ĐỌC — KHÔNG sửa gì)
-- Supabase Dashboard → SQL Editor → New → dán toàn bộ → Run.
-- COPY toàn bộ bảng kết quả (nút kết quả → copy) rồi dán vào chat.
-- ============================================================

SELECT '01_popup_configs' AS kiem_tra,
       case when to_regclass('public.popup_configs') is null then 'FAIL-thieu-bang' else 'OK' end AS ket_qua
UNION ALL
SELECT '02_blog_author',
       case when exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='blog_posts' and column_name='author')
            then 'OK' else 'FAIL-thieu-cot' end
UNION ALL
SELECT '03_products_category',
       case when exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='products' and column_name='category')
            then 'OK' else 'FAIL-thieu-cot' end
UNION ALL
SELECT '04_cart_product_name',
       case when exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='cart_items' and column_name='product_name')
            then 'OK' else 'FAIL-thieu-cot' end
UNION ALL
SELECT '05_orders_address',
       case when exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='orders' and column_name='customer_address')
            then 'OK' else 'FAIL-thieu-cot' end
UNION ALL
SELECT '06_appoi_start_time',
       case when exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='appointments' and column_name='start_time')
            then 'OK' else 'FAIL-thieu-cot' end
UNION ALL
SELECT '07_du_lu_tren_db',
       (select count(*) from information_schema.columns
         where table_schema='public'
           and ((table_name='products' and column_name='category')
             or (table_name='blog_posts' and column_name='author')
             or (table_name='cart_items' and column_name='product_name')
             or (table_name='popup_configs' and column_name='key')
             or (table_name='orders' and column_name='customer_address')))::text || ' / 5'
UNION ALL
SELECT '08_project_nay',
       current_database() || ' | ' || current_setting('server_version', true);
