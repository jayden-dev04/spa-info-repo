<?php
// === Eva Spa — chạy TẤT CẢ migrate + seed + đo, CHỈ CẦN tài khoản Supabase login
//     (KHÔNG cần secret key, KHÔNG cần token, KHÔNG cần mở SQL Editor).
//
//   server/:  php dev-sync.php login <email> <mat-khau>   # 1 lần, token lưu .auth.json (gitignore)
//   server/:  php dev-sync.php all                         # migrate + seed + status
//   server/:  php dev-sync.php whoami                      # xác nhận đang login tài khoản nào
//
// Cơ chế: đăng nhập Supabase Dashboard → Management API POST
// /v1/projects/{ref}/database/query = y hệt nút Run trong SQL Editor.

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$ref  = (string) (env('SUPABASE_PROJECT_REF') ?: 'lydxhltbvsuyrbvulkwe');
$base = rtrim((string) env('SUPABASE_URL') ?: "https://$ref.supabase.co", '/');
$authFile = __DIR__ . '/.auth.json';
$cmd = $argv[1] ?? 'all';

function req(string $method, string $url, array $headers, ?string $raw = null, ?array $json = null): array
{
    if ($json !== null) { $raw = json_encode($json, JSON_UNESCAPED_UNICODE); $headers[] = 'Content-Type: application/json'; }
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headers,
        CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0, CURLOPT_TIMEOUT => 180,
        CURLOPT_POSTFIELDS => $raw,
    ]);
    $body = (string) curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, $body];
}
function step(string $label, int $code, string $body, bool $expect = true): bool
{
    $ok = $code >= 200 && $code < 300;
    printf("%-42s %s %d %s\n", $label, ($ok === $expect) ? 'OK  ' : 'FAIL', $code, $ok ? '' : mb_substr(preg_replace('/\s+/', ' ', $body), 0, 160));
    return $ok === $expect;
}

// ---------- LOGIN (GoTrue on api project) ----------
if ($cmd === 'login') {
    $email = $argv[2] ?? ''; $pass = $argv[3] ?? '';
    if ($email === '' || $pass === '') { fwrite(STDERR, "dung: php dev-sync.php login <email> <mat-khau>\n"); exit(1); }
    [$c, $b] = req('POST', "https://$ref.supabase.co/auth/v1/token?grant_type=password", [
        'apikey: sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL', 'Content-Type: application/json',
    ], null, ['email' => $email, 'password' => $pass]);
    if (!step('auth token', $c, $b)) exit(1);
    $j = json_decode($b, true);
    file_put_contents($authFile, json_encode(['access_token' => $j['access_token'] ?? '', 'refresh_token' => $j['refresh_token'] ?? '', 'email' => $email, 'exp' => time() + ($j['expires_in'] ?? 3600)]));
    echo "da luu token (email: $email)\n";
    exit(0);
}

function accessToken(): string
{
    global $authFile;
    if (!is_file($authFile)) return '';
    $j = json_decode((string) file_get_contents($authFile), true) ?: [];
    return (string) ($j['access_token'] ?? '');
}

if ($cmd === 'whoami') {
    $tok = accessToken();
    if ($tok === '') { echo "chua login\n"; exit(1); }
    [$c, $b] = req('GET', "https://$ref.supabase.co/auth/v1/user", ["apikey: sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL", "Authorization: Bearer $tok"]);
    step('auth/v1/user', $c, $b);
    exit(0);
}

// ---------- Query runner: ưu tiên Management API (account token), dự phòng GoTrue token ----------
$runSql = function (string $label, string $sql, ?string $tok = null) use ($ref): array {
    $tok = $tok ?? accessToken();
    if ($tok === '') { return [0, 'CHUA LOGIN — chay: php dev-sync.php login <email> <mat-khau>']; }
    return req('POST', "https://api.supabase.com/v1/projects/$ref/database/query", ["Authorization: Bearer $tok"], null, ['query' => $sql]);
};

$PUB = 'sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL';
$pubH = ["apikey: $PUB", "Authorization: Bearer $PUB", 'Content-Type: application/json'];

// ---------- MIGRATE ----------
if ($cmd === 'migrate' || $cmd === 'all') {
    $sqlFile = __DIR__ . '/../client/supabase/migrations/PASTE_NAY.sql';
    $sql = (string) file_get_contents($sqlFile);
    // tách statement an toàn: theo ; cuối dòng, bỏ comment
    $segs = preg_split('/;\s*(?=\r?\n|$)/', $sql, -1, PREG_SPLIT_NO_EMPTY);
    $allOk = true; $i = 0;
    foreach ($segs as $seg) {
        $seg = trim($seg);
        if ($seg === '' || preg_match('/^(--[^\n]*\s*)+$/u', $seg)) continue;
        $i++;
        [$c, $b] = $runSql("sql#$i", $seg . ';');
        $allOk = step("migrate#$i", $c, $b) && $allOk;
    }
    echo "\n--- đo cột ---\n";
    foreach ([
        'popup_configs' => 'popup_configs?select=key&limit=1',
        'blog_posts.author' => 'blog_posts?select=author&limit=1',
        'products.category' => 'products?select=category&limit=1',
        'cart_items.product_name' => 'cart_items?select=product_name&limit=1',
        'orders.customer_address' => 'orders?select=customer_address&limit=1',
        'appointments.start_time' => 'appointments?select=start_time&limit=1',
    ] as $label => $q) {
        [$c, $b] = req('GET', "$base/rest/v1/$q", $pubH);
        step("cot $label", $c, $b);
    }
    if (!$allOk) echo "\n=> nuong chay tay PASTE_NAY.sql (Dashboard SQL Editor) rồi: php dev-sync.php seed\n";
}

// ---------- SEED (publishable — RLS đã mở sau migrate) ----------
if ($cmd === 'seed' || $cmd === 'all') {
    $rows = json_decode((string) @file_get_contents(__DIR__ . '/seed-products.json'), true) ?: [];
    if ($rows === []) {
        echo "Thiếu seed-products.json → cd client && node --experimental-strip-types scripts/make-seed-json.mjs\n";
    } else {
        [$c, $b] = req('POST', "$base/rest/v1/products?on_conflict=name", array_merge($pubH, ['Prefer: resolution=merge-duplicates,return=minimal']), $rows);
        step('seed products (' . count($rows) . ')', $c, $b);
    }
    $blogs = json_decode((string) @file_get_contents(__DIR__ . '/seed-blogs.json'), true) ?: [];
    if ($blogs !== []) {
        [$c, $b] = req('POST', "$base/rest/v1/blog_posts?on_conflict=slug", array_merge($pubH, ['Prefer: resolution=merge-duplicates,return=minimal']), $blogs);
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
    [$c, $b] = req('POST', "$base/rest/v1/popup_configs?on_conflict=key", array_merge($pubH, ['Prefer: resolution=merge-duplicates,return=representation']), [$popup]);
    step('seed popup_configs', $c, $b);
}

// ---------- STATUS ----------
if ($cmd === 'status' || $cmd === 'all') {
    foreach (['products', 'blog_posts', 'popup_configs', 'cart_items', 'orders', 'appointments', 'services'] as $t) {
        $ch = curl_init("$base/rest/v1/$t?select=&limit=0");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_HTTPHEADER => array_merge($pubH, ['Prefer: count=exact']), CURLOPT_HEADER => true,
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
