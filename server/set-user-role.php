<?php
// Gán role admin/staff cho một email trong public.users (backend tự làm,
// chạy: php set-user-role.php <email> [admin|staff|user])
// Cần service_role key — xem CẢNH BÁO bên dưới nếu 401.

require __DIR__ . '/vendor/autoload.php';
$env = [];
foreach (file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
    [$k, $v] = explode('=', $line, 2);
    $env[trim($k)] = trim($v);
}

$baseUrl = rtrim($env['SUPABASE_URL'] ?? '', '/');
$key     = $env['SUPABASE_SERVICE_ROLE_KEY'] ?: ($env['SUPABASE_SECRET_KEY'] ?? '');

$email = $argv[1] ?? '';
$role  = in_array($argv[2] ?? 'admin', ['admin', 'staff', 'user'], true) ? ($argv[2] ?? 'admin') : 'admin';

if (!$baseUrl || !$key || !$email) {
    exit("Cách dùng: php set-user-role.php <email> [admin|staff|user]\n");
}

// 1. Row đã tồn tại trong public.users?
$find = curl_init("{$baseUrl}/rest/v1/users?select=id,email,role&email=eq." . rawurlencode($email) . '&limit=2');
curl_setopt_array($find, [CURLOPT_RETURNTRANSFER => true, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0,
    CURLOPT_HTTPHEADER => ["apikey: $key", "Authorization: Bearer $key"]]);
$b = curl_exec($find); $s = curl_getinfo($find, CURLINFO_HTTP_CODE); curl_close($find);
$rows = json_decode((string) $b, true);

echo "Tìm row: HTTP $s => " . json_encode($rows, JSON_UNESCAPED_UNICODE) . "\n";

$payload = ['role' => $role, 'updated_at' => gmdate('c')];

if (is_array($rows) && count($rows) > 0) {
    // 2a. UPDATE row theo email
    $ch = curl_init("{$baseUrl}/rest/v1/users?email=eq." . rawurlencode($email));
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_HTTPHEADER => ["apikey: $key", "Authorization: Bearer $key", 'Content-Type: application/json', 'Prefer: return=representation'],
        CURLOPT_POSTFIELDS => json_encode($payload)]);
    $b = curl_exec($ch); $s = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    echo "UPDATE: HTTP $s => " . substr((string) $b, 0, 400) . "\n";
} else {
    // 2b. Chưa có row (khách chưa từng đăng nhập/đặt lịch) → chèn trước.
    //     Khi user đăng nhập Google thật, public.users.id phải = auth uid —
    //     row chèn tay có id ngẫu nhiên nên backend vẫn nhận quyền qua ADMIN_EMAILS.
    $ch = curl_init("{$baseUrl}/rest/v1/users");
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
        CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_HTTPHEADER => ["apikey: $key", "Authorization: Bearer $key", 'Content-Type: application/json', 'Prefer: return=representation,resolution=merge-duplicates'],
        CURLOPT_POSTFIELDS => json_encode(array_merge($payload, ['email' => $email, 'account_source' => 'staff_directory']))]);
    $b = curl_exec($ch); $s = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    echo "INSERT: HTTP $s => " . substr((string) $b, 0, 400) . "\n";
    echo "\nGHI CHÚ: hàng này chưa tồn tại trong public.users (user chưa từng đăng nhập Google/đặt lịch).\n";
    echo "         Cách chắc chắn nhất vẫn là để email trong ADMIN_EMAILS ở AuthController.php\n";
    echo "         (không cần row DB, không cần key).\n";
}
