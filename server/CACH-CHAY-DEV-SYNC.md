# === Eva Spa — cầu nối dev MỘT LẦN ===
# KHÔNG bao giờ commit key vào git. Server/.env + server/.secret_key đã gitignore.
#
# Bước 0 — bảo đảm seed JSON mới nhất (20 sản phẩm + 14 blog, nguồn chuẩn):
#   cd client
#   node --experimental-strip-types scripts/make-seed-json.mjs
#
# Bước 1 — đưa key service-role (sb_secret_...) vào, 1 trong 3 cách:
#   A) PowerShell:  cd server ; $env:SUPABASE_SECRET_KEY='sb_secret_...' ; php dev-sync.php all
#   B) CMD:         cd server && set SUPABASE_SECRET_KEY=sb_secret_... && php dev-sync.php all
#   C) tạo file server/.secret_key chứa đúng 1 dòng là key (đã gitignore) → php dev-sync.php all
#
# dev-sync.php all = migrate (tạo bảng/cột qua HTTP API — KHÔNG cần SQL Editor)
#                  + seed (20 SP + 14 blog + popup coupon)
#                  + status (đếm bảng + đo cột).
# Key lấy tại: https://supabase.com/dashboard/project/lydxhltbvsuyrbvulkwe/settings/api → Secret key → Copy
#
# Nếu HTTP migrate bị dashboard chặn 1 phần: dán client/supabase/migrations/PASTE_NAY.sql
# vào SQL Editor → Run (đó chính là 'file migration' mục tiêu), rồi chạy: php dev-sync.php seed
