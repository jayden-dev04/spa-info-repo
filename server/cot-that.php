<?php
// Kiểm tra TÍNH SẴN SÀNG của luồng khách theo schema THỰC TẾ trên DB (không đoán).
// server/: php kiem-tra-thuc-te.php   — in danh sách cột thật mỗi bảng.
$pub = 'sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL';
$base = 'https://lydxhltbvsuyrbvulkwe.supabase.co';
$h = ["apikey: $pub", "Authorization: Bearer $pub"];
foreach (['products','orders','order_items','appointments','cart_items','blog_posts','services'] as $t) {
    $ctx = stream_context_create(['ssl'=>['verify_peer'=>false,'verify_peer_name'=>false],
        'http'=>['ignore_errors'=>true,'header'=>implode("\r\n",$h)."\r\n"]]);
    // GET *,limit=1 → đọc key của row đầu = tên cột thật
    $b = @file_get_contents("$base/rest/v1/$t?select=*&limit=1", false, $ctx);
    $j = json_decode((string)$b, true);
    $cols = (is_array($j) && isset($j[0])) ? array_keys($j[0]) : ['<rong/loi: '.substr((string)$b,0,60).'>'];
    printf("%-14s : %s\n", $t, implode(', ', $cols));
}
