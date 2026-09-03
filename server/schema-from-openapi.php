<?php
// In SƠ ĐỒ CỘT đầy đủ của mọi bảng TỪ OpenAPI của PostgREST (đọc được cả bảng rỗng).
// server/: php schema-from-openapi.php
$pub = 'sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL';
$base = 'https://lydxhltbvsuyrbvulkwe.supabase.co';
$ch = curl_init("$base/rest/v1/");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => 0, CURLOPT_HTTPHEADER => ["apikey: $pub", "Authorization: Bearer $pub"]]);
$b = (string) curl_exec($ch); curl_close($ch);
$j = json_decode($b, true);
$defs = $j['definitions'] ?? [];
echo "=== SCHEMA THỰC TẾ (PostgREST OpenAPI) ===\n";
foreach ($defs as $t => $d) {
    $props = array_keys($d['properties'] ?? []);
    printf("%-26s : %s\n", $t, implode(', ', $props));
}
