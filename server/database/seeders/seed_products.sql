-- ============================================================
-- SEED: public.products
-- Chạy script này trong Supabase SQL Editor để khởi tạo sản phẩm TMĐT
-- ============================================================

INSERT INTO public.products (name, description, price, stock, category, image_url)
VALUES
  (
    'Tinh Chất Cấp Ẩm Thảo Mộc Danique',
    'Tinh chất cấp ẩm chuyên sâu chứa tế bào gốc thực vật và chiết xuất cam thảo, giúp phục hồi màng ẩm tự nhiên, cho da căng bóng mịn màng.',
    1690000,
    25,
    'Serum & Tinh chất',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'Mặt Nạ Dưỡng Trà Xanh pH Thấp',
    'Mặt nạ đất sét kết hợp bột lá trà xanh non và tràm trà, hút sạch dầu thừa bã nhờn, làm dịu các nốt mụn sưng viêm nhanh chóng.',
    540000,
    40,
    'Mặt nạ thảo mộc',
    'https://images.unsplash.com/photo-1567928815104-b5879a95ec6c?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'Kem Chống Nắng Vật Lý Thảo Dược SPF 50+',
    'Kem chống nắng vật lý phổ rộng bảo vệ da tối ưu trước tia UVA/UVB và ánh sáng xanh, nâng tông nhẹ tự nhiên không để lại vệt trắng.',
    790000,
    18,
    'Chống nắng & Dưỡng da',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'Huyết Thanh Phục Hồi Midnight Glow',
    'Serum tái tạo ban đêm với phức hợp thảo mộc quý hiếm, cải thiện nếp nhăn li ti và tăng sinh collagen cho làn da tươi trẻ rạng ngời.',
    1990000,
    12,
    'Serum & Tinh chất',
    'https://images.unsplash.com/photo-1608248597359-00f72365dfbc?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'Muối Thảo Dược Ngâm Chân Thải Độc Hoàng Cung',
    'Muối khoáng hầm kết hợp ngải cứu, quế chi, gừng già và thiên niên kiện giúp kích thích tuần hoàn máu, giải trừ hàn khí, hỗ trợ ngủ ngon giấc.',
    250000,
    50,
    'Thảo dược ngâm chân & Body',
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'Dầu Gội Bồ Kết Nấu Tươi Thủ Công',
    'Nước gội thảo dược cô đặc nấu từ bồ kết nướng than hoa, vỏ bưởi, hương nhu và cỏ mần trầu giúp giảm rụng tóc, sạch gàu và kích thích mọc tóc dày mượt.',
    320000,
    35,
    'Chăm sóc tóc dưỡng sinh',
    'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80'
  );
