<?php
// === Eva Spa — một mối duy nhất: key, migrate, seed, đo. KHÔNG in key. ===
// server/: php dev-sync.php all        (migrate+seed+status)
//   key = server/.secret_key (dòng đầu, gitignore) HOẶC env SUPABASE_SECRET_KEY.
// migrate = chạy PASTE_NAY.sql theo blocks, MỖI block thử:
//   1) rpc exec_sql        (yêu cầu đã tạo fn một lần — xem CACH-CHAY-DEV-SYNC.md)
//   2) Management API /database/query (cần account token, KHÔNG phải secret key)
//   3) báo FAIL kèm HTTP + body → user Run block đó trong SQL Editor.
// seed = publishable upsert 20 SP + 14 blog + popup.

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$ref = (string) (env('SUPABASE_PROJECT_REF') ?: 'lydxhltbvsuyrbvulkwe');
$base = rtrim((string) env('SUPABASE_URL') ?: "https://$ref.supabase.co", '/');
$PUB = (string) (env('SUPABASE_PUBLISHABLE_KEY') ?: 'sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL');
$cmd = $argv[1] ?? 'all';

$key = '';
foreach ([@file_get_contents(__DIR__ . '/.secret_key'), getenv('SUPABASE_SECRET_KEY') ?: '', env('SUPABASE_SECRET_KEY') ?: ''] as $c) {
    $c = trim(trim((string) $c), "\"' \t");
    if ($c !== '') { $key = $c; break; }
}
if ($key === '') {
    fwrite(STDERR, "CHƯA có key — tạo server/.secret_key chứa đúng 1 dòng (sb_secret_... hoặc sb_publishable_...).\n");
    exit(1);
}
$secret = str_starts_with($key, 'sb_secret_');
echo ($secret ? '[key: service-role OK]' : '[key: publishable — REST ghi được nhờ RLS, NHƯNG KHÔNG chạy được SQL; mọi block migrate sẽ FAIL → Run trong Dashboard]') . "\n";

function req(string $m, string $u, array $h, ?array $json = null): array
{
    $ch = curl_init($u);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_CUSTOMREQUEST => $m, CURLOPT_HTTPHEADER => $h,
        CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0, CURLOPT_TIMEOUT => 180,
        CURLOPT_POSTFIELDS => $json === null ? null : json_encode($json, JSON_UNESCAPED_UNICODE),
    ]);
    $b = (string) curl_exec($ch); $c = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    return [$c, $b];
}
function step(string $label, int $c, string $b, bool $expect = true): bool
{
    $ok = $c >= 200 && $c < 300;
    printf("%-46s %s %d %s\n", $label, ($ok === $expect) ? 'OK  ' : 'FAIL', $c, $ok ? '' : mb_substr(preg_replace('/\s+/', ' ', $b), 0, 140));
    return $ok === $expect;
}

$kh = ["apikey: $key", "Authorization: Bearer $key", 'Content-Type: application/json'];
$pubH = ["apikey: $PUB", "Authorization: Bearer $PUB", 'Content-Type: application/json'];

// ---- migrate ----
if ($cmd === 'migrate' || $cmd === 'all') {
    $blocks = preg_split('/(?m)^--\s*▸\s*\d+.*$/m', (string) file_get_contents(__DIR__ . '/../client/supabase/migrations/PASTE_NAY.sql'));
    $i = 0; $bad = 0;
    foreach ($blocks as $b) {
        $b = trim($b);
        if ($b === '' || preg_match('/^(--[^\n]*\s*)+$/u', $b)) continue;
        $i++;
        $sql = $b . ';';
        // 1) rpc exec_sql
        [$c, $body] = $secret ? req('POST', "$base/rest/v1/rpc/exec_sql", $kh, ['sql' => $sql]) : [0, 'khong co secret key'];
        if (!($c >= 200 && $c < 300)) {
            // 2) Management API (account token — secret key SẼ 401, thử cho chắc)
            [$c2, $body2] = req('POST', "https://api.supabase.com/v1/projects/$ref/database/query",
                ["Authorization: Bearer $key", 'Content-Type: application/json'], ['query' => $sql]);
            if ($c2 >= 200 && $c2 < 300) { [$c, $body] = [$c2, $body2]; }
            else { $c = $c2; $body = "exec_sql: $body || mgmt: $body2"; }
        }
        if (!step("block#$i", $c, $body)) $bad++;
    }
    echo $bad ? "\n=> $bad block FAIL: dán ĐÚNG các block đó vào SQL Editor (Dashboard). Lưu ý 2 lỗi kinh điển:\n"
             . "   - exec_sql 404 = fn chưa tạo; mgmt 401 = project secret key KHÔNG phải account token.\n"
             . "   - Nếu chạy đúng mà đo cột vẫn FAIL → nhiều khả năng dán/Run ở SAI PROJECT. Chạy 01_CHAN_DOAN.sql để xác nhận project.\n"
          : "\n=> migrate sạch.\n";
    echo "\n--- đo cột (publishable) ---\n";
    foreach ([
        'popup_configs' => 'popup_configs?select=key&limit=1',
        'blog_posts.author' => 'blog_posts?select=author&limit=1',
        'products.category' => 'products?select=category&limit=1',
        'cart_items.product_name' => 'cart_items?select=product_name&limit=1',
        'orders.customer_address' => 'orders?select=customer_address&limit=1',
        'orders.customer_email' => 'orders?select=customer_email&limit=1',
        'appointments.customer_email' => 'appointments?select=customer_email&limit=1',
    ] as $label => $q) { [$c, $body] = req('GET', "$base/rest/v1/$q", $pubH); step("cot $label", $c, $body); }
}

// ---- seed ----
if ($cmd === 'seed' || $cmd === 'all') {
    $rows = json_decode((string) @file_get_contents(__DIR__ . '/seed-products.json'), true) ?: [];
    if ($rows === []) {
        echo "Thiếu seed-products.json — chạy: cd client && node --experimental-strip-types scripts/make-seed-json.mjs\n";
    } else {
        // products trên DB THẬT cần category_id (FK) → map tên category → id
        [$cc, $cb] = req('GET', "$base/rest/v1/product_categories?select=id,name", $pubH);
        $map = []; foreach ((json_decode($cb, true) ?: []) as $r) { $map[mb_strtolower($r['name'])] = $r['id']; }
        $rows = array_map(function ($r) use ($map) {
            $r['category_id'] = $map[mb_strtolower($r['category'] ?? '')] ?? null;
            unset($r['category']);
            return $r;
        }, $rows);
        [$c, $b] = req('POST', "$base/rest/v1/products?on_conflict=slug",
            array_merge($pubH, ['Prefer: resolution=merge-duplicates,return=minimal']), $rows);
        step('seed products (' . count($rows) . ')', $c, $b);
    }
    $blogs = json_decode((string) @file_get_contents(__DIR__ . '/seed-blogs.json'), true) ?: [];
    if ($blogs !== []) {
        [$c, $b] = req('POST', "$base/rest/v1/blog_posts?on_conflict=slug",
            array_merge($pubH, ['Prefer: resolution=merge-duplicates,return=minimal']), $blogs);
        step('seed blogs (' . count($blogs) . ')', $c, $b);
    }
    $popup = ['key' => 'default', 'config' => [
        'enabled' => true, 'badge' => "ƯU ĐÃI 30' CHĂM SÓC DA", 'title' => 'CHỈ 199.000Đ',
        'subtitle' => 'Khi đặt kèm bất kỳ liệu trình dưỡng sinh chính', 'highlightPrice' => '199K',
        'imageUrl' => 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        'ctaText' => 'ĐẶT LỊCH NGAY', 'ctaLink' => '/booking', 'dismissText' => 'KHÔNG, CẢM ƠN',
        'footnote' => '*Giá chưa bao gồm 8% thuế VAT & phí dịch vụ', 'delaySeconds' => 1.5,
        'couponCode' => 'T7SPRING', 'couponLabel' => 'Giảm 10% tối đa 100.000đ',
    ]];
    [$c, $b] = req('POST', "$base/rest/v1/popup_configs?on_conflict=key",
        array_merge($pubH, ['Prefer: resolution=merge-duplicates,return=representation']), [$popup]);
    step('seed popup_configs', $c, $b);
}

// ---- status ----
if ($cmd === 'status' || $cmd === 'all') {
    echo "\n--- đếm bảng (publishable) ---\n";
    foreach (['products', 'blog_posts', 'popup_configs', 'cart_items', 'orders', 'appointments', 'services', 'product_categories'] as $t) {
        $ch = curl_init("$base/rest/v1/$t?select=&limit=0");
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_HTTPHEADER => array_merge($pubH, ['Prefer: count=exact']), CURLOPT_HEADER => true]);
        $raw = (string) curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $hSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE); curl_close($ch);
        $range = '';
        foreach (explode("\r\n", substr($raw, 0, $hSize)) as $h) if (stripos($h, 'content-range:') === 0) $range = trim(substr($h, 14));
        printf("%-20s http=%d rows=%s\n", $t, $code, $range !== '' ? $range : '-');
    }
}
