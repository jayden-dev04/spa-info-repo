<?php
// Một lần: bật Google OAuth trong Supabase Auth (cần service_role / secret key).
// Chạy:  php enable-google-oauth.php  [client_id] [client_secret]
// creds cũng đọc được từ server/.google_oauth.local (CLIENT_ID= / CLIENT_SECRET=)
//
// Lưu ý: SUPABASE_SECRET_KEY trong .env phải là SECRET KEY thật (sb_secret_... hoặc
// service_role JWT). Publishable key sẽ bị GoTrue từ chối (401/403).

require __DIR__ . '/vendor/autoload.php';

$load = function (string $file): array {
    if (!is_file($file)) return [];
    $out = [];
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        if (!str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $out[trim($k)] = trim($v);
    }
    return $out;
};

$local = $load(__DIR__ . '/.google_oauth.local');
$env   = $load(__DIR__ . '/.env');

$baseUrl = $env['SUPABASE_URL'] ?? getenv('SUPABASE_URL');
$secret  = $env['SUPABASE_SECRET_KEY'] ?? (getenv('SUPABASE_SECRET_KEY') ?: '');

$clientId = $argv[1] ?? ($local['CLIENT_ID'] ?? '');
$secretGoogle = $argv[2] ?? ($local['CLIENT_SECRET'] ?? '');

if (!$baseUrl || !$secret || !$clientId || !$secretGoogle) {
    exit("Thiếu dữ liệu: SUPABASE_URL / SUPABASE_SECRET_KEY / CLIENT_ID / CLIENT_SECRET\n");
}

if (!str_starts_with($secret, 'sb_secret_') && !str_starts_with($secret, 'eyJ')) {
    echo "CẢNH BÁO: SUPABASE_SECRET_KEY không có dạng secret key (sb_secret_.../JWT).\n";
    echo "         Supabase Dashboard → Settings → API Keys → Replace credentials\n";
    echo "         (hoặc Create new) để lấy SECRET KEY, rồi dán vào server/.env\n\n";
}

$redirect = rtrim($baseUrl, '/') . '/auth/v1/callback';

$ch = curl_init("{$baseUrl}/auth/v1/admin/config");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST  => 'PUT',
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => 0,
    CURLOPT_HTTPHEADER     => [
        'apikey: ' . $secret,
        'Authorization: Bearer ' . $secret,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'external' => [
            'google' => [
                'enabled'      => true,
                'client_id'    => $clientId,
                'secret'       => $secretGoogle,
                'redirect_uri' => $redirect,
                'url'          => 'https://accounts.google.com',
            ],
        ],
    ]),
]);
$body = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP $status\n$body\n";

if ($status >= 200 && $status < 300) {
    // Xác nhận lại bằng settings (public endpoint)
    $verify = curl_init("{$baseUrl}/auth/v1/settings");
    curl_setopt_array($verify, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_HTTPHEADER     => ['apikey: ' . $key],
    ]);
    $sb = curl_exec($verify);
    curl_close($verify);
    $settings = json_decode((string) $sb, true);
    $googleOn = $settings['external']['google'] ?? null;
    echo $googleOn ? "\ngoogle trong Supabase settings: enabled\n" : "\nVẪN CHƯA bật google trong settings\n";
    echo "Redirect URI phía Google Cloud phải là:\n  {$redirect}\n";
    echo "Thêm 2 URL này vào Supabase → Authentication → URL Configuration → Redirect URLs:\n";
    echo "  http://localhost:5173/auth/callback\n  http://127.0.0.1:5173/auth/callback\n";
}
