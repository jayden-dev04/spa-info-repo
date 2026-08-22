-- ============================================================
-- SEED: public.services
-- Chạy script này trong Supabase SQL Editor
-- ID sẽ tự động gán 1→5 theo thứ tự INSERT (int4 auto-increment)
-- Phải khớp với serviceMap trong AppointmentController.php
-- ============================================================

INSERT INTO public.services (name, short_description, price, duration_minutes, is_active)
VALUES
  (
    'Gội Đầu Dưỡng Sinh Thảo Dược (60–75 phút)',
    'Liệu trình gội đầu với thảo dược tự nhiên, thư giãn và phục hồi da đầu toàn diện.',
    199000,
    70,
    true
  ),
  (
    'Chăm Sóc & Phục Hồi Da Thảo Mộc (75 phút)',
    'Phục hồi và dưỡng ẩm chuyên sâu cho da mặt với thảo mộc thiên nhiên lành tính.',
    350000,
    75,
    true
  ),
  (
    'Massage Body Đá Nóng Himalaya (90 phút)',
    'Massage toàn thân với đá nóng Himalaya, giải tỏa căng thẳng và đau nhức cơ bắp.',
    420000,
    90,
    true
  ),
  (
    'Combo Thư Giãn Toàn Diện: Gội Đầu + Massage Body',
    'Trọn gói thư giãn kết hợp gội đầu dưỡng sinh và massage body, tiết kiệm hơn mua lẻ.',
    550000,
    135,
    true
  ),
  (
    'Xông Hơi Thảo Dược Hoàng Cung & Ngâm Chân',
    'Xông hơi với thảo dược hoàng cung kết hợp ngâm chân, thanh lọc và thư giãn cơ thể.',
    150000,
    45,
    true
  );

-- Verify: kiểm tra ID đúng thứ tự 1→5
-- SELECT id, name, price, duration_minutes FROM public.services ORDER BY id;
