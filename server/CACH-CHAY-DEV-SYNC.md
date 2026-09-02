# === Eva Spa — cầu nối dev MỘT LẦN ===
# KHÔNG bao giờ commit key vào git. Server/.env đã gitignore.
#
# Cách nhanh nhất (KHÔNG cần Dashboard):
#   PowerShell:  cd server ; $env:SUPABASE_SECRET_KEY='sb_secret_...' ; php dev-sync.php all
#   CMD:         cd server && set SUPABASE_SECRET_KEY=sb_secret_... && php dev-sync.php all
# hoặc tạo file server/.secret_key chứa đúng 1 dòng là key (file này cũng gitignore).
#
# Lệnh:
#   php dev-sync.php migrate   → chạy PASTE_NAY.sql qua rpc exec_sql (nếu project có rpc)
#   php dev-sync.php seed      → 20 sản phẩm + 14 blog + popup coupon T7SPRING
#   php dev-sync.php status    → đếm bảng + đo cột
#   php dev-sync.php all       → migrate + seed + status
#
# Nếu migrate báo 'project chưa có rpc exec_sql': dán toàn bộ
# client/supabase/migrations/PASTE_NAY.sql vào Supabase Dashboard → SQL Editor → Run
# (đây chính là 'file migration' mục tiêu cần user chạy). Sau đó: php dev-sync.php seed
