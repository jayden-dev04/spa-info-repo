// ============================================
// EVA SPA — CHÂN ĐOÁN (CHỈ ĐỌC, không sửa gì)
// Supabase → SQL Editor → New query → Ctrl+A xóa hết → dán HẾT file này → Run
// COPY bảng kết quả → dán vào chat cho tôi.
// ============================================
WITH t AS (
  SELECT 'popup_configs' AS bang, count(*)::int AS co_duong
    FROM information_schema.tables
   WHERE table_schema='public' AND table_name='popup_configs'
)
SELECT 'popup_configs' AS doi_tuong,
  (SELECT co_duong FROM t) AS co_bang,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema='public' AND table_name='products' AND column_name='category')::int AS cot_category,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema='public' AND table_name='blog_posts' AND column_name='author')::int AS cot_author,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cart_items' AND column_name='product_name')::int AS cot_cart_name,
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders' AND column_name='customer_address')::int AS cot_addr,
  (SELECT current_database()) AS project
UNION ALL
SELECT 'du_lieu_hien_tai',
  (SELECT count(*) FROM public.products),
  (SELECT count(*) FROM public.blog_posts),
  (SELECT count(*) FROM public.cart_items),
  (SELECT count(*) FROM public.orders),
  (SELECT count(*) FROM public.appointments);
