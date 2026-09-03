<?php
// Nạp SQL qua /sql endpoint của Supabase (đúng endpoint SQL Editor dùng) + xác minh bằng publishable.
// server/:  php sql-runner.php                       → chạy toàn bộ PASTE_NAY.sql theo blocks
// server/:  php sql-runner.php "SELECT 1"            → chạy 1 câu
$key = trim((string) @file_get_contents(__DIR__ . '/.secret_key'));
$pub = 'sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL';
$ref = 'lydxhltbvsuyrbvulkwe';

function call(string $label, string $url, array $h, array $pl): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_HTTPHEADER => $h,
        CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0, CURLOPT_TIMEOUT => 180,
        CURLOPT_POSTFIELDS => json_encode($pl, JSON_UNESCAPED_UNICODE),
    ]);
    $b = (string) curl_exec($ch); $c = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    printf("%-44s %d %s\n", $label, $c, ($c >= 200 && $c < 300) ? '' : mb_substr(preg_replace('/\s+/', ' ', $b), 0, 150));
    return [$c, $b];
}

if (($argv[1] ?? '') !== '') {
    $sql = $argv[1];
    foreach ([
        ['/sql', "https://$ref.supabase.co/sql", ["apikey: $key", "Authorization: Bearer $key", 'Content-Type: application/json'], ['query' => $sql]],
        ['/pg/query', "https://$ref.supabase.co/pg/query", ["apikey: $key", "Authorization: Bearer $key", 'Content-Type: application/json'], ['query' => $sql]],
        ['mgmt database/query', "https://api.supabase.com/v1/projects/$ref/database/query", ["Authorization: Bearer $key", 'Content-Type: application/json'], ['query' => $sql]],
        ['mgmt sql (instance_id)', "https://api.supabase.com/v1/sql", ["Authorization: Bearer $key", 'Content-Type: application/json'], ['instance_id' => $ref, 'query' => $sql]],
        ['mgmt pg-meta query', "https://api.supabase.com/v1/projects/$ref/pg-meta/query", ["Authorization: Bearer $key", 'Content-Type: application/json'], ['query' => $sql]],
        ['pg-meta (project)', "https://$ref.supabase.co/api/pg-meta/query", ["apikey: $key", "Authorization: Bearer $key", 'Content-Type: application/json'], ['query' => $sql]],
    ] as [$l, $u, $h, $p]) {
        [$c] = call("probe $l", $u, $h, $p);
        if ($c >= 200 && $c < 300) { echo "=> KÊNH OK: $l\n"; exit(0); }
    }
    echo "=> KHÔNG có kênh SQL từ máy local (SQL Editor chạy trong infra internal của Supabase).\n";
    exit(1);
}

$blocks = preg_split('/(?m)^--\s*▸\s*\d+.*$/m', (string) file_get_contents(__DIR__ . '/../client/supabase/migrations/PASTE_NAY.sql'));
$n = 0;
foreach ($blocks as $b) {
    $b = trim($b);
    if ($b === '' || preg_match('/^(--[^\n]*\s*)+$/u', $b)) continue;
    $n++;
    echo "—— block #$n ——\n";
    call("sql#$n", "https://$ref.supabase.co/sql", ["apikey: $key", "Authorization: Bearer $key", 'Content-Type: application/json'], ['query' => $b]);
}
echo "\n--- verify bằng publishable ---\n";
foreach ([
    'popup_configs' => 'popup_configs?select=key&limit=1',
    'blog_posts.author' => 'blog_posts?select=author&limit=1',
    'cart_items.product_name' => 'cart_items?select=product_name&limit=1',
    'orders.customer_address' => 'orders?select=customer_address&limit=1',
] as $l => $q) {
    $ctx = stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false],
        'http' => ['ignore_errors' => true, 'header' => "apikey: $pub\r\nAuthorization: Bearer $pub\r\n"]]);
    $body = @file_get_contents("https://$ref.supabase.co/rest/v1/$q", false, $ctx);
    $code = 0; foreach ($http_response_header ?? [] as $hh) if (preg_match('#^HTTP/\S+\s+(\d{3})#', $hh, $m)) { $code = (int) $m[1]; break; }
    printf("%-28s %s\n", $l, $code >= 200 && $code < 300 ? 'OK' : "FAIL $code");
}
