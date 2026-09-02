<?php
// Chẩn đoán KHÔNG cần extension curl: dùng file_get_contents + allow_url_fopen.
// server/: php chan-doan.php   (mọi FAIL ở đây = schema chưa tạo — khách quan)

echo "=== Eva Spa — chuẩn đoán schema (publishable key, không sửa DB) ===\n";
stream_context_set_default(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]);
$base = 'https://lydxhltbvsuyrbvulkwe.supabase.co';
$key  = 'sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL';

$cases = [
    'products.category'       => '/rest/v1/products?select=category&limit=1',
    'popup_configs'           => '/rest/v1/popup_configs?select=key&limit=1',
    'blog_posts.author'       => '/rest/v1/blog_posts?select=author&limit=1',
    'cart_items.product_name' => '/rest/v1/cart_items?select=product_name&limit=1',
    'orders.notes'            => '/rest/v1/orders?select=notes&limit=1',
    'order_items.quantity'    => '/rest/v1/order_items?select=quantity&limit=1',
];
$bad = 0;
foreach ($cases as $label => $path) {
    $ctx = stream_context_create(['http' => ['ignore_errors' => true, 'header' => "apikey: $key\r\nAuthorization: Bearer $key\r\n"]]);
    $body = @file_get_contents($base . $path, false, $ctx);
    $code = 0;
    foreach ($http_response_header ?? [] as $h) {
        if (preg_match('#^HTTP/\S+\s+(\d{3})#', $h, $m)) { $code = (int) $m[1]; break; }
    }
    $ok = $code >= 200 && $code < 300;
    if (!$ok) $bad++;
    printf("%-28s %s %d %s\n", $label, $ok ? 'OK ' : 'FAIL', $code, $ok ? '' : mb_substr((string) $body, 0, 110));
}
echo $bad ? "\n=> thiếu $bad mục — schema PASTE_NAY chưa ngấm.\n" : "\n=> ĐỦ schema. Chuyển sang seed.\n";
