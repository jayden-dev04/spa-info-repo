<?php
// === Eva Spa — cầu nối dev MỘT LẦN ===
// Cách chạy (trong server/):  php dev-sync.php   (key dán trực tiếp, KHÔNG sửa .env)
//   php dev-sync.php migrate   → chạy PASTE_NAY.sql + kiểm tra cột
//   php dev-sync.php seed      → nạp 20 SP + 14 blog + popup
//   php dev-sync.php status    → đếm bảng, xác nhận cột
//   php dev-sync.php all       → migrate + seed + status
// Key lấy từ biến môi trường SUPABASE_SECRET_KEY (khuyến nghị), hoặc file server/.secret_key (dòng đầu),
// hoặc SUPABASE_SECRET_KEY trong .env. Ưu tiên key có tiền tố sb_secret_. Không bao giờ in key.

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cands = array_values(array_filter([
    (string) (getenv('SUPABASE_SECRET_KEY') ?: ''),
    (string) @file_get_contents(__DIR__ . '/.secret_key') ?: '',
    (string) (env('SUPABASE_SECRET_KEY') ?: ''),
]));
$key = '';
foreach ($cands as $c) {
    $c = trim(trim($c), "\"' \t");
    if (str_starts_with($c, 'sb_secret_')) { $key = $c; break; }
}
if ($key === '') {
    fwrite(STDERR, "CHƯA có secret key sb_secret_. Làm 1 trong 3 cách:\n");
    fwrite(STDERR, "  A) set env:  cmd:  set SUPABASE_SECRET_KEY=sb_secret_xxx && php dev-sync.php all   (PowerShell: \$env:SUPABASE_SECRET_KEY='sb_secret_xxx'; php dev-sync.php all)\n");
    fwrite(STDERR, "  B) tạo file server/.secret_key chứa đúng 1 dòng là key (file này đã gitignore)\n");
    fwrite(STDERR, "  C) SUPABASE_SECRET_KEY=*** sb_secret_ thật trong .env (dòng 25)\n");
    exit(1);
}
$base = rtrim((string) env('SUPABASE_URL') ?: 'https://lydxhltbvsuyrbvulkwe.supabase.co', '/');
$cmd  = $argv[1] ?? 'all';

function req(string $method, string $url, array $headers, ?array $json = null): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_TIMEOUT => 120,
        CURLOPT_POSTFIELDS => $json === null ? null : json_encode($json, JSON_UNESCAPED_UNICODE),
    ]);
    $body = (string) curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, $body];
}

$headers = ["apikey: $key", "Authorization: Bearer $key", 'Content-Type: application/json', 'Prefer: return=representation'];

function step(string $label, int $code, string $body, bool $expect2xx = true): bool
{
    $ok = $code >= 200 && $code < 300;
    printf("%-38s %s %d %s\n", $label, ($ok === $expect2xx) ? 'OK  ' : 'FAIL', $code, $ok ? '' : mb_substr(preg_replace('/\s+/', ' ', $body), 0, 140));
    return $ok === $expect2xx;
}

// ---------- MIGRATE ----------
if ($cmd === 'migrate' || $cmd === 'all') {
    $sqlFile = __DIR__ . '/../client/supabase/migrations/PASTE_NAY.sql';
    $segs = preg_split('/;\s*(?=\n|$)/', (string) file_get_contents($sqlFile), -1, PREG_SPLIT_NO_EMPTY);
    $i = 0; $allOk = true;
    foreach ($segs as $seg) {
        $seg = trim($seg);
        if ($seg === '' || preg_match('/^(--[^\n]*)+$/u', $seg)) continue;
        $i++;
        [$c, $b] = req('POST', "$base/rest/v1/rpc/exec_sql", $headers, ['sql' => $seg . ';']);
        if ($c === 404) { // chưa có rpc exec_sql → thử qua /sql endpoint (Dashboard-only) → hướng dẫn
            fwrite(STDERR, "LƯU Ý: project chưa có rpc 'exec_sql' — migrate phải chạy trong Supabase Dashboard (SQL Editor). Script này chỉ seed được bằng REST nếu schema đã đủ.\n");
            $allOk = false; break;
        }
        $allOk = step("sql#$i", $c, $b) && $allOk;
    }
    // đo cột
    foreach ([
        'products.category' => 'products?select=category&limit=1',
        'popup_configs' => 'popup_configs?select=key&limit=1',
        'blog_posts.author' => 'blog_posts?select=author&limit=1',
        'cart_items.product_name' => 'cart_items?select=product_name&limit=1',
        'orders.customer_address' => 'orders?select=customer_address&limit=1',
        'appointments.start_time' => 'appointments?select=start_time&limit=1',
    ] as $label => $q) {
        [$c, $b] = req('GET', "$base/rest/v1/$q", $headers);
        step("cot $label", $c, $b);
    }
    if (!$allOk) { echo "\n=> migrate chưa xong — chạy PASTE_NAY.sql trong Dashboard rồi chạy lại: php dev-sync.php seed\n"; }
}

// ---------- SEED ----------
if ($cmd === 'seed' || $cmd === 'all') {
    // nguồn: server/seed-products.json (sinh từ seed_products.sql — xem client/scripts/make-seed-json.mjs)
    $rows = json_decode((string) @file_get_contents(__DIR__ . '/seed-products.json'), true) ?: [];
    if ($rows === []) {
        echo "Thiếu server/seed-products.json — bỏ qua seed products (blog+popup vẫn chạy).\n";
    } else {
        [$c, $b] = req('POST', "$base/rest/v1/products?on_conflict=slug", array_merge($headers, ['Prefer: resolution=merge-duplicates,return=minimal']), $rows);
        step('seed products (' . count($rows) . ')', $c, $b);
    }
    $blogs = json_decode((string) @file_get_contents(__DIR__ . '/seed-blogs.json'), true) ?: [];
    if ($blogs !== []) {
        [$c, $b] = req('POST', "$base/rest/v1/blog_posts?on_conflict=slug", array_merge($headers, ['Prefer: resolution=merge-duplicates,return=minimal']), $blogs);
        step('seed blogs (' . count($blogs) . ')', $c, $b);
    }
    $popup = ['key' => 'default', 'config' => [
        'enabled' => true,
        'coupon_code' => 'T7SPRING',
        'headline' => 'Ưu Đãi Tháng Mới Tại Eva Spa',
        'sub' => 'Giảm ngay 15% cho liệu trình Massage Đá Nóng & Facial Collagen khi đặt lịch trước.',
        'cta' => 'Nhập mã T7SPRING giảm 15%',
        'image_url' => 'https://images.unsplash.com/photo-1600334128495-802052fb5e43?w=900&q=80',
    ]];
    [$c, $b] = req('POST', "$base/rest/v1/popup_configs?on_conflict=key", array_merge($headers, ['Prefer: resolution=merge-duplicates,return=representation']), [$popup]);
    step('seed popup_configs', $c, $b);
}

// ---------- STATUS ----------
if ($cmd === 'status' || $cmd === 'all') {
    $tables = ['products', 'blog_posts', 'popup_configs', 'cart_items', 'orders', 'appointments', 'services'];
    foreach ($tables as $t) {
        $ch = curl_init("$base/rest/v1/$t?select=&limit=0&or=id.is.null,id.not.is.null");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_HTTPHEADER => ["apikey: $key", "Authorization: Bearer $key", 'Prefer: count=exact'],
            CURLOPT_HEADER => true,
        ]);
        $raw = (string) curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $hSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);
        $range = '';
        foreach (explode("\r\n", substr($raw, 0, $hSize)) as $h) {
            if (stripos($h, 'content-range:') === 0) $range = trim(substr($h, 14));
        }
        printf("%-16s http=%d rows=%s\n", $t, $code, $range !== '' ? $range : '-');
    }
}
