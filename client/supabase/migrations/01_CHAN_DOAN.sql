-- Chẩn đoán nhanh: dán cả file vào SQL Editor → Run.
-- Xem cột ket_qua: dòng nào FAIL chính là chỗ script cũ chết.
select 'popup_configs' as doi_tuong,
       case when to_regclass('public.popup_configs') is not null then 'OK' else 'FAIL-chua-ton-tai' end as ket_qua
union all
select 'blog_posts',
       case when to_regclass('public.blog_posts') is not null then 'OK' else 'FAIL-chua-ton-tai' end
union all
select 'cart_items',
       case when to_regclass('public.cart_items') is not null then 'OK' else 'FAIL-chua-ton-tai' end
union all
select 'order_items',
       case when to_regclass('public.order_items') is not null then 'OK' else 'FAIL-chua-ton-tai' end
union all
select 'products.category',
       case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='category') then 'OK' else 'FAIL-thieu-cot' end
union all
select 'cart_items.product_name',
       case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='cart_items' and column_name='product_name') then 'OK' else 'FAIL-thieu-cot' end
union all
select 'blog_posts.author',
       case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='blog_posts' and column_name='author') then 'OK' else 'FAIL-thieu-cot' end;
