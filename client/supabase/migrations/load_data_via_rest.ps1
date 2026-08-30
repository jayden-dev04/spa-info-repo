-- ============================================================
-- NẠP DỮ LIỆU QUA POSTGREST (KHÔNG CẦN service_role)
-- Dành cho: products / popup_configs / blog_posts / cart_items
-- YÊU CẦU: đã chạy 20260831000000_sync_schema.sql (RLS + cột) rồi.
-- publishable key ĐỦ nếu chính sách RLS cho phép (migrations đã tạo *_anon_all).
--
-- Chạy:
--   cd client/supabase/migrations
--   $env:SUPABASE_URL='https://<ref>.supabase.co'; $env:SUPABASE_KEY='<publishable key>'
--   powershell -ExecutionPolicy Bypass -File .\load_data_via_rest.ps1
-- ============================================================
$ErrorActionPreference = 'Stop'
if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_KEY) {
  Write-Error "Set SUPABASE_URL and SUPABASE_KEY env vars first."
}

function Post-Json($endpoint, $body, $label) {
  $res = Invoke-RestMethod -Uri "$env:SUPABASE_URL/rest/v1/$endpoint" `
    -Method Post -Headers @{ apikey = $env:SUPABASE_KEY; Authorization = "Bearer $env:SUPABASE_KEY"; "Content-Type" = "application/json"; Prefer = "resolution=merge-duplicates" } `
    -Body $body
  Write-Host "OK $label"
}

# 1) products: INSERT ... từ file SQL? REST không nhận SQL -> dùng CSV-to-JSON:
#    đọc từ seed_products.sql bằng cách parse các dòng VALUES.
$sql = Get-Content -Raw "$PSScriptRoot\..\..\..\server\database\seeders\seed_products.sql" -Encoding UTF8
$rows = [regex]::Matches($sql, "\('(?:[^']|'')*',\s*'(?:[^']|'')*',\s*[\d.]+,\s*\d+,\s*'(?:[^']|'')*',\s*'(?:[^']|'')*'(?![^)]*\))")
if ($rows.Count -lt 20) { Write-Warning "Parse products = $($rows.Count) (kỳ vọng 20) — nếu 0 hãy chạy seed_products.sql trong SQL Editor." }
else {
  $arr = foreach ($m in $rows) {
    $vals = [regex]::Matches("($($m.Value))", "'(?:[^']|'')*'|[\d.]+") | ForEach-Object { $_.Value.Trim("'").Replace("''", "'") }
    [pscustomobject]@{ name = $vals[0]; description = $vals[1]; price = [decimal]$vals[2]; stock = [int]$vals[3]; category = $vals[4]; image_url = $vals[5]; is_active = $true }
  }
  Post-Json "products" (ConvertTo-Json $arr -Depth 4 -Compress) "products x $($arr.Count)"
}

# 2) popup_configs (mặc định coupon T7SPRING)
$cfg = @{
  enabled = $true; badge = "ƯU ĐÃI 30' CHĂM SÓC DA"; title = "CHỈ 199.000Đ"
  subtitle = "Khi đặt kèm bất kỳ liệu trình dưỡng sinh chính"; highlightPrice = "199K"
  imageUrl = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
  ctaText = "ĐẶT LỊCH NGAY"; ctaLink = "/booking"; dismissText = "KHÔNG, CẢM ƠN"
  footnote = "*Giá chưa bao gồm 8% thuế VAT & phí dịch vụ"; delaySeconds = 1.5
  frequency = "always"; showOnMobile = $true; couponCode = "T7SPRING"
  couponLabel = "Ưu đãi tháng này: Miễn phí giao hàng toàn quốc cho đơn mỹ phẩm từ 500.000đ"
  couponExpiresAt = "31/08/2026"
}
Post-Json "popup_configs" (ConvertTo-Json @( @{ key = 'default'; config = $cfg } ) -Depth 5 -Compress) "popup_configs default"

# 3) blog_posts: parse seed_blog_posts.sql
$blogSql = Get-Content -Raw "$PSScriptRoot\..\seeders\seed_blog_posts.sql" -Encoding UTF8
$blocks = [regex]::Matches($blogSql, "\(\s*\n\s*'([^']*)',\s*\n\s*'([^']*)',\s*\n\s*'([^']*)',\s*\n\s*'([^']*)',\s*\n\s*'([^']*)',\s*\n\s*'([^']*)',\s*\n\s*(\d+),\s*\n\s*'([^']*)',\s*\n\s*'([^']*)',\s*\n\s*'([^']*)',\s*\n\s*'([^']*)',\s*\n\s*'([^']*)',\s*\n\s*'([^']*)',\s*\n\s*CASE WHEN '([^']*)' = 'published' THEN now\(\) ELSE NULL END\s*\n\s*\)")
if ($blocks.Count -eq 0) { Write-Warning "Không parse được blog blocks (0) — chạy seed_blog_posts.sql trong SQL Editor." }
else {
  $posts = foreach ($m in $blocks) {
    $g = $m.Groups
    [pscustomobject]@{
      slug = $g[1].Value.Replace("''","'"); title = $g[2].Value.Replace("''","'"); category = $g[3].Value.Replace("''","'")
      excerpt = $g[4].Value.Replace("''","'"); content = $g[5].Value.Replace("''","'"); image_url = $g[6].Value.Replace("''","'")
      views = [int]$g[7].Value; read_time = $g[8].Value; date_label = $g[9].Value; author = $g[10].Value
      meta_title = $g[11].Value.Replace("''","'"); meta_description = $g[12].Value.Replace("''","'"); focus_keyword = $g[13].Value.Replace("''","'")
      published_at = if ($g[14].Value -eq 'published') { (Get-Date).ToUniversalTime().ToString('o') } else { $null }
    }
  }
  Post-Json "blog_posts" (ConvertTo-Json $posts -Depth 4 -Compress) "blog_posts x $($posts.Count)"
}

# 4) cart_items: chỉ tạo bảng đã có — không seed.
Invoke-RestMethod -Uri "$env:SUPABASE_URL/rest/v1/rpc" -Method Post | Out-Null 2>$null
Write-Host "XONG. Kiểm tra: GET /rest/v1/products?select=count (header Prefer: count=exact)"
