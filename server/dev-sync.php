<?php

// cầu nối dev MỘT LẦN — nạp xong 3 bước rồi xóa file này.
// Cách chạy (trong thư mục server/):
//   php dev-sync.php migrate
//   php dev-sync.php seed
// Yêu cầu: SUPABASE_SECRET_KEY trong server/.env là sb_secret_ thật.
// Không bao giờ in key ra.

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$key = (string) (env('SUPABASE_SECRET_KEY') ?: '');
if (!str_starts_with($key, 'sb_secret_')) {
    fwrite(STDERR, "FAIL: server/.env chưa có SUPABASE_SECRET_KEY=*** (Dashboard → Settings → API Keys → Secret key)\n");
    exit(1);
}
$base = rtrim((string) env('SUPABASE_URL'), '/');

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
    ]);
    if ($json !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($json, JSON_UNESCAPED_UNICODE));
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, (string) $body];
}

$h = ['apikey: ' . $key, 'Authorization: Bearer ' . $key, 'Content-Type: application/json'];
$cmd = $argv[1] ?? 'status';

if ($cmd === 'migrate') {
    $file = __DIR__ . '/../client/supabase/migrations/PASTE_NAY.sql';
    $sql = file_get_contents($file);
    // tách theo ';' nhưng tôn trọng $$ ... $$ và '...'
    $stmts = []; $buf = ''; $depth = 0; $len = strlen($sql);
    for ($i = 0; $i < $len; $i++) {
        if (substr($sql, $i, 2) === '$$') { $depth++; $buf .= '$$'; $i++; continue; }
        $c = $sql[$i];
        if ($c === '$') { $buf .= $c; continue; }
        if ($c === ';' && $depth % 2 === 0) { $stmts[] = $buf; $buf = ''; continue; }
        $buf .= $c;
    }
    if (trim($buf) !== '') $stmts[] = $buf;
    $ran = 0; $err = 0;
    foreach ($stmts as $s) {
        $clean = trim(preg_replace('/^\s*--.*$/m', '', $s));
        if ($clean === '') continue;
        [$code, $body] = req('POST', "{$base}/rest/v1/rpc", $h, ['sql' => $s] ?: null);
        // rpc裸 sql không có → dùng endpoint /sql? PostgREST không có. Buộc dùng /rpc/exec_sql nếu có, còn lại báo.
        if ($code === 404) {
            fwrite(STDOUT, "exec_sql RPC chưa tồn tại — dán 1 lần vào SQL Editor:\n" .
                "create or replace function public.exec_sql(sql text) returns void language plpgsql as \$\$ begin execute sql; end \$\$;\n" .
                "revoke all on function public.exec_sql(text) from public, anon, authenticated;\n" .
                "grant execute on function public.exec_sql(text) to service_role;\n");
            exit(2);
        }
        if ($code >= 200 && $code < 300) $ran++;
        elseif (stripos($body, 'already exists') === false) { $err++; fwrite(STDERR, "STMT FAIL {$code}: " . substr($body, 0, 200) . "\n"); }
    }
    echo "migrate: ran={$ran} err={$err}\n";
    exit($err ? 1 : 0);
}

if ($cmd === 'seed') {
    $out = [];
    // products
    $sql = file_get_contents(__DIR__ . '/database/seeders/seed_products.sql');
    $products = [];
    if (preg_match_all("/\('((?:[^']|'')*)', '((?:[^']|'')*)', ([\d.]+), (\d+), '((?:[^']|'')*)', '((?:[^']|'')*)'\)/", $sql, $m, PREG_SET_ORDER)) {
        foreach ($m as $r) {
            $un = fn($v) => str_replace("''", "'", $v);
            $products[] = ['name' => $un($r[1]), 'description' => $un($r[2]), 'price' => (float) $r[3], 'stock' => (int) $r[4], 'category' => $un($r[5]), 'image_url' => $un($r[6]), 'is_active' => true];
        }
    }
    $hh = [...$h, 'Prefer: resolution=merge-duplicates,return=minimal'];
    [$c, $b] = req('POST', "{$base}/rest/v1/products", $hh, $products);
    $out['products'] = $c < 300 ? 'ok x' . count($products) : "FAIL {$c} " . substr($b, 0, 160);

    // blog
    $jf = __DIR__ . '/.tmp-blog-posts.json';
    if (file_exists($jf)) {
        $posts = json_decode(file_get_contents($jf), true);
        [$c, $b] = req('POST', "{$base}/rest/v1/blog_posts", $hh, $posts);
        $out['blog_posts'] = $c < 300 ? 'ok x' . count($posts) : "FAIL {$c} " . substr($b, 0, 160);
    } else $out['blog_posts'] = 'skip (thiếu .tmp-blog-posts.json)';

    // popup
    $popup = [['key' => 'default', 'config' => [
        'enabled' => true, 'badge' => "ƯU ĐÃI 30' CHĂM SÓC DA", 'title' => 'CHỈ 199.000Đ',
        'subtitle' => 'Khi đặt kèm bất kỳ liệu trình dưỡng sinh chính', 'highlightPrice' => '199K',
        'imageUrl' => 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        'ctaText' => 'ĐẶT LỊCH NGAY', 'ctaLink' => '/booking', 'dismissText' => 'KHÔNG, CẢM ƠN',
        'footnote' => '*Giá chưa bao gồm 8% thuế VAT & phí dịch vụ', 'delaySeconds' => 1.5,
        'frequency' => 'always', 'showOnMobile' => true, 'couponCode' => 'T7SPRING',
        'couponLabel' => 'Ưu đãi tháng này: Miễn phí giao hàng toàn quốc cho đơn mỹ phẩm từ 500.000đ',
        'couponExpiresAt' => '31/08/2026',
    ]]];
    [$c, $b] = req('POST', "{$base}/rest/v1/popup_configs", $hh, $popup);
    $out['popup_configs'] = $c < 300 ? 'ok' : "FAIL {$c} " . substr($b, 0, 160);

    foreach ($out as $k => $v) echo "$k: $v\n";
    exit(in_array('skip', array_map(fn($x) => explode(' ', $x)[0], $out), true) || str_contains(implode($out), 'FAIL') ? 1 : 0);
}

if ($cmd === 'status') {
    $ok = ['secret_key_ok' => true];
    foreach (['products' => 'select=category&limit=1', 'popup_configs' => 'select=key&limit=1', 'blog_posts' => 'select=author&limit=1', 'cart_items' => 'select=product_name&limit=1', 'orders' => 'select=notes&limit=1', 'order_items' => 'select=quantity&limit=1'] as $t => $q) {
        [$c, $b] = req('GET', "{$base}/rest/v1/{$t}?{$q}", $h);
        $ok[$t] = $c < 300 ? 'ok' : 'FAIL ' . substr($b, 0, 100);
    }
    print_r($ok);
    exit;
}

echo "cách dùng: php dev-sync.php migrate|seed|status\n";
