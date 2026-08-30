-- ============================================================
-- 20260831100000_data_on_supabase.sql
-- Đưa MỌI dữ liệu từng nằm ở localStorage/mảng cứng trong code
-- lên Supabase (nguồn sự thật duy nhất):
--   products        : 20 sản phẩm (đã HEAD-check ảnh 200)
--   blog_posts      : 14 bài SEO (title/slug/content HTML/seo/featuredImage)
--   popup_configs   : 1 dòng 'default' (Popup + banner Ưu đãi tháng này + coupon)
--   cart_items      : bảng mới — giỏ hàng theo session key hoặc user_id
-- Idempotent: chạy lại nhiều lần an toàn (upsert theo key/slug/product).
-- CHẠY SAU file 20260831000000_sync_schema.sql.
-- ============================================================

-- ===================== PRODUCTS =====================
-- (sinh từ client/scripts/fetch-product-images.mjs)
INSERT INTO public.products (name, description, price, stock, category, image_url, is_active)
VALUES
  ('Tinh Chất Cấp Ẩm Thảo Mộc Danique', 'Tinh chất cấp ẩm chuyên sâu chứa tế bào gốc thực vật và chiết xuất cam thảo, giúp phục hồi màng ẩm tự nhiên, cho da căng bóng mịn màng.', 1690000, 25, 'Serum & Tinh chất', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', true),
  ('Huyết Thanh Phục Hồi Midnight Glow', 'Serum tái tạo ban đêm với phức hợp thảo mộc quý hiếm, cải thiện nếp nhăn li ti và tăng sinh collagen cho làn da tươi trẻ rạng ngời.', 1990000, 12, 'Serum & Tinh chất', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', true),
  ('Serum Vitamin C Sáng Da Cam Thảo', 'Tinh chất vitamin C dạng ổn định kết hợp cam thảo, làm sáng vùng da xỉn màu và đều màu da mà không gây kích ứng.', 890000, 30, 'Serum & Tinh chất', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80', true),
  ('Mặt Nạ Đất Sét Tràm Trà', 'Mặt nạ đất sét kết hợp tràm trà, hút sạch dầu thừa bã nhờn, làm dịu các nốt mụn sưng viêm nhanh chóng.', 480000, 35, 'Mặt nạ thảo mộc', 'https://images.unsplash.com/photo-1631730359585-38a4935cbec4?auto=format&fit=crop&w=800&q=80', true),
  ('Mặt Nạ Dưỡng Ẩm Rau Má Hoa Cúc', 'Mặt nạ giấy chiết xuất rau má và hoa cúc La Mã, cấp ẩm tức thì và làm dịu da kích ứng sau nắng.', 540000, 40, 'Mặt nạ thảo mộc', 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80', true),
  ('Gel Rửa Mặt Bọt Rau Má', 'Gel rửa mặt tạo bọt dịu nhẹ từ rau má, làm sạch sâu bã nhờn mà không gây khô căng.', 360000, 45, 'Làm sạch da', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80', true),
  ('Nước Tẩy Trang Dầu Dừa Nguyên Chất', 'Nước tẩy trang dầu dừa nguyên chất làm sạch lớp trang điểm và kem chống nắng tức thì.', 290000, 50, 'Làm sạch da', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80', true),
  ('Toner Hoa Hồng Cấp Ẩm Không Cồn', 'Nước cân bằng hoa hồng hữu cơ không cồn, cấp ẩm và se khít lỗ chân lông.', 420000, 33, 'Làm sạch da', 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80', true),
  ('Kem Chống Nắng Vật Lý Thảo Dược SPF 50+', 'Kem chống nắng vật lý khoáng chất kết hợp thảo dược, màn chắn phổ rộng không bết dính.', 790000, 18, 'Chống nắng & Dưỡng da', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80', true),
  ('Kem Dưỡng Nghệ + Linh Chi Ban Đêm', 'Kem đêm nghệ nano và nấm linh chi phục hồi hàng rào da, mờ thâm nám qua đêm.', 780000, 20, 'Chống nắng & Dưỡng da', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', true),
  ('Muối Thảo Dược Ngâm Chân Thải Độc Hoàng Cung', 'Muối hồng Himalaya pha tinh dầu sả, ngải cứu, gừng — ngâm chân thải độc, ngủ ngon.', 250000, 50, 'Thảo dược ngâm chân & Body', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80', true),
  ('Túi Ngâm Thảo Mộc Cổ Vai Gáy', 'Túi chườm thảo dược ngải cứu, muối, gừng — giữ nhiệt sâu giảm đau mỏi cổ vai gáy.', 320000, 30, 'Thảo dược ngâm chân & Body', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80', true),
  ('Body Scrub Cà Phê Đắk Lắk', 'Tẩy da chết body hạt cà phê Đắk Lắk rang xay, da sáng mịn và lưu hương dịu nhẹ.', 390000, 26, 'Chăm sóc Body', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80', true),
  ('Dầu Gội Bồ Kết Nấu Tươi Thủ Công', 'Dầu gội bồ kết nấu tươi không sulfate, sạch gàu, thơm mùi bếp Việt.', 320000, 35, 'Chăm sóc tóc dưỡng sinh', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80', true),
  ('Dầu Xả Vỏ Bưởi Hương Nhu', 'Dầu xả tinh dầu vỏ bưởi và hương nhu, tóc mềm mượt giảm gãy rụng.', 300000, 32, 'Chăm sóc tóc dưỡng sinh', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', true),
  ('Son Dưỡng Môi Mật Ong & Nghệ', 'Son dưỡng mật ong rừng và nano curcumin, dưỡng hồng và phục hồi môi nứt nẻ.', 180000, 60, 'Chăm sóc môi', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80', true),
  ('Trà Dưỡng Sinh Hoa Cúc Kỷ Tử Hộp 30 Gói', 'Trà hoa cúc sấy lạnh phối kỷ tử, thanh nhiệt an thần, hộp 30 gói tiện dụng.', 220000, 44, 'Dưỡng sinh bên trong', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80', true),
  ('Cao Gừng Mật Ong Nguyên Chất', 'Cao gừng mật ong nguyên chất pha nước ấm giữ ấm cơ thể, tốt cho tiêu hóa.', 260000, 36, 'Dưỡng sinh bên trong', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80', true),
  ('Bộ Kit Chăm Sóc Da Thảo Mộc 4 Bước', 'Bộ 4 bước: tẩy trang dầu dừa - gel rửa mặt rau má - toner hoa hồng - serum cấp ẩm.', 1490000, 15, 'Bộ sản phẩm', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80', true),
  ('Bộ Quà Tặng Dưỡng Sinh Hoàng Cung', 'Set quà tặng cao cấp: muối ngâm chân, túi chườm vai gáy, trà dưỡng sinh, cao gừng.', 2290000, 10, 'Bộ sản phẩm', 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80', true)
ON CONFLICT DO NOTHING;

-- ===================== POPUP CONFIGS =====================
INSERT INTO public.popup_configs (key, config)
VALUES ('default', '{
  "enabled": true,
  "badge": "ƯU ĐÃI 30'' CHĂM SÓC DA",
  "title": "CHỈ 199.000Đ",
  "subtitle": "Khi đặt kèm bất kỳ liệu trình dưỡng sinh chính",
  "highlightPrice": "199K",
  "imageUrl": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
  "ctaText": "ĐẶT LỊCH NGAY",
  "ctaLink": "/booking",
  "dismissText": "KHÔNG, CẢM ƠN",
  "footnote": "*Giá chưa bao gồm 8% thuế VAT & phí dịch vụ",
  "delaySeconds": 1.5,
  "frequency": "always",
  "showOnMobile": true,
  "couponCode": "T7SPRING",
  "couponLabel": "Ưu đãi tháng này: Miễn phí giao hàng toàn quốc cho đơn mỹ phẩm từ 500.000đ",
  "couponExpiresAt": "31/08/2026"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET config = EXCLUDED.config, updated_at = now();

-- ===================== CART ITEMS (bảng mới) =====================
-- Giỏ hàng lưu DB: khách vãng lai dùng session_key (UUID tạo phía client),
-- user đã đăng nhập gắn thêm user_id.
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_key TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (session_key, product_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cart_items' AND policyname='cart_items_key_rw') THEN
    EXECUTE 'CREATE POLICY cart_items_key_rw ON public.cart_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)';
END $$;

-- ===================== Nạp lại schema cache =====================
NOTIFY pgrst, 'reload schema';
