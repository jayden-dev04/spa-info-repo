-- ============================================================
-- SEED: public.products  (tự sinh bởi client/scripts/fetch-product-images.mjs)
-- MỌI image_url bên dưới ĐÃ được kiểm tra HTTP HEAD = 200 thật sự.
-- Chạy trong Supabase SQL Editor.
-- ============================================================

DELETE FROM public.products;

INSERT INTO public.products (name, description, price, stock, category, image_url) VALUES
  ('Tinh Chất Cấp Ẩm Thảo Mộc Danique', 'Sản phẩm serum & tinh chất chính hãng Eva Spa.', 1690000, 25, 'Serum & Tinh chất', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'),
  ('Huyết Thanh Phục Hồi Midnight Glow', 'Sản phẩm serum & tinh chất chính hãng Eva Spa.', 1990000, 12, 'Serum & Tinh chất', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'),
  ('Serum Vitamin C Sáng Da Cam Thảo', 'Sản phẩm serum & tinh chất chính hãng Eva Spa.', 890000, 30, 'Serum & Tinh chất', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80'),
  ('Mặt Nạ Đất Sét Tràm Trà', 'Sản phẩm mặt nạ thảo mộc chính hãng Eva Spa.', 480000, 35, 'Mặt nạ thảo mộc', 'https://images.unsplash.com/photo-1631730359585-38a4935cbec4?auto=format&fit=crop&w=800&q=80'),
  ('Mặt Nạ Dưỡng Ẩm Rau Má Hoa Cúc', 'Sản phẩm mặt nạ thảo mộc chính hãng Eva Spa.', 540000, 40, 'Mặt nạ thảo mộc', 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80'),
  ('Gel Rửa Mặt Bọt Rau Má', 'Sản phẩm làm sạch da chính hãng Eva Spa.', 360000, 45, 'Làm sạch da', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'),
  ('Nước Tẩy Trang Dầu Dừa Nguyên Chất', 'Sản phẩm làm sạch da chính hãng Eva Spa.', 290000, 50, 'Làm sạch da', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'),
  ('Toner Hoa Hồng Cấp Ẩm Không Cồn', 'Sản phẩm làm sạch da chính hãng Eva Spa.', 420000, 33, 'Làm sạch da', 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80'),
  ('Kem Chống Nắng Vật Lý Thảo Dược SPF 50+', 'Sản phẩm chống nắng & dưỡng da chính hãng Eva Spa.', 790000, 18, 'Chống nắng & Dưỡng da', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'),
  ('Kem Dưỡng Nghệ + Linh Chi Ban Đêm', 'Sản phẩm chống nắng & dưỡng da chính hãng Eva Spa.', 780000, 20, 'Chống nắng & Dưỡng da', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'),
  ('Muối Thảo Dược Ngâm Chân Thải Độc Hoàng Cung', 'Sản phẩm thảo dược ngâm chân & body chính hãng Eva Spa.', 250000, 50, 'Thảo dược ngâm chân & Body', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80'),
  ('Túi Ngâm Thảo Mộc Cổ Vai Gáy', 'Sản phẩm thảo dược ngâm chân & body chính hãng Eva Spa.', 320000, 30, 'Thảo dược ngâm chân & Body', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80'),
  ('Body Scrub Cà Phê Đắk Lắk', 'Sản phẩm chăm sóc body chính hãng Eva Spa.', 390000, 26, 'Chăm sóc Body', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80'),
  ('Dầu Gội Bồ Kết Nấu Tươi Thủ Công', 'Sản phẩm chăm sóc tóc dưỡng sinh chính hãng Eva Spa.', 320000, 35, 'Chăm sóc tóc dưỡng sinh', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80'),
  ('Dầu Xả Vỏ Bưởi Hương Nhu', 'Sản phẩm chăm sóc tóc dưỡng sinh chính hãng Eva Spa.', 300000, 32, 'Chăm sóc tóc dưỡng sinh', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'),
  ('Son Dưỡng Môi Mật Ong & Nghệ', 'Sản phẩm chăm sóc môi chính hãng Eva Spa.', 180000, 60, 'Chăm sóc môi', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80'),
  ('Trà Dưỡng Sinh Hoa Cúc Kỷ Tử Hộp 30 Gói', 'Sản phẩm dưỡng sinh bên trong chính hãng Eva Spa.', 220000, 44, 'Dưỡng sinh bên trong', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80'),
  ('Cao Gừng Mật Ong Nguyên Chất', 'Sản phẩm dưỡng sinh bên trong chính hãng Eva Spa.', 260000, 36, 'Dưỡng sinh bên trong', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80'),
  ('Bộ Kit Chăm Sóc Da Thảo Mộc 4 Bước', 'Sản phẩm bộ sản phẩm chính hãng Eva Spa.', 1490000, 15, 'Bộ sản phẩm', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80'),
  ('Bộ Quà Tặng Dưỡng Sinh Hoàng Cung', 'Sản phẩm bộ sản phẩm chính hãng Eva Spa.', 2290000, 10, 'Bộ sản phẩm', 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80');

-- Kiểm tra: SELECT count(*) FROM public.products;
-- Kỳ vọng: 20
