<?php
// Bật Google + đặt Site URL / Redirect URLs trong Supabase.
// Dùng: php set-google-redirects.php
// (tham số: "grant_type=client_credentials&client_id=...&client_secret=..." nếu muốn tự lấy token)
//
// Cần SUPABASE_SERVICE_ROLE_KEY (JWT cũ, vẫn dùng được với /auth/v1/admin/*)
// hoặc SUPABASE_ACCESS_TOKEN (sbp_...) nếu bạn muốn đi đường Management API.

require __DIR__ . '/vendor/autoload.php';

$load = function (string $file): array {
    if (!is_file($file)) return [];
    $out = [];
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $out[trim($k)] = trim($v);
    }
    return $out;
};

$env   = $load(__DIR__ . '/.env');
$local = $load(__DIR__ . '/.google_oauth.local');

$baseUrl = $env['SUPABASE_URL'] ?? '';
// ưu tiên: service_role key (JWT) → secret key → access token
$key = $env['SUPABASE_SERVICE_ROLE_KEY'] ?? ($env['SUPABASE_SECRET_KEY'] ?? '');
$access = $local['SUPABASE_ACCESS_TOKEN'] ?? ($env['SUPABASE_ACCESS_TOKEN'] ?? '');
$ref = $local['SUPABASE_REF'] ?? ($env['SUPABASE_REF'] ?? parse_url($baseUrl, PHP_URL_HOST));
$ref = explode('.', (string) $ref)[0];

$redirects = [
    'http://localhost:5173/auth/callback',
    'http://127.0.0.1:5173/auth/callback',
];

$payload = [
    'external' => ['google' => [
        'enabled'      => true,
        'client_id'    => $local['CLIENT_ID'] ?? '',
        'secret'       => $local['CLIENT_SECRET'] ?? '',
        'redirect_uri' => rtrim($baseUrl, '/') . '/auth/v1/callback',
        'url'          => 'https://accounts.google.com',
    ]],
    'site_url'            => 'http://localhost:5173',
    'additional_redirect_urls' => ['gotrue_url' => $redirects],
];

// Cách 1: GoTrue admin API (/auth/v1/admin/config = PUT config, không phải PATCH)
if ($key) {
    $ch = curl_init("{$baseUrl}/auth/v1/admin/config");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => 'PUT',
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_HTTPHEADER     => ["apikey: $key", "Authorization: Bearer $key", 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => json_encode($payload),
    ]);
    $b = curl_exec($ch); $s = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    echo "GoTrue admin/config  HTTP $s\n" . substr((string) $b, 0, 400) . "\n\n";
    if ($s >= 200 && $s < 300) { echo "OK qua GoTrue.\n"; exit; }
}

// Cách 2: Supabase Management API (cần sbp_ access token)
if ($access) {
    $ch = curl_init("https://api.supabase.com/v1/projects/{$ref}/config/auth");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => 'PATCH',
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_HTTPHEADER     => ["Authorization: Bearer $access", 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => json_encode([
            'external_google_enabled'           => true,
            'external_google_client_id'         => $local['CLIENT_ID'] ?? '',
            'external_google_secret'            => $local['CLIENT_SECRET'] ?? '',
            'external_google_redirect_uri'      => rtrim($baseUrl, '/') . '/auth/v1/callback',
            'external_google_url'               => 'https://accounts.google.com',
            'site_url'                          => 'http://localhost:5173',
            'additional_redirect_urls'          => $redirects,
        ]),
    ]);
    $b = curl_exec($ch); $s = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    echo "Management API  HTTP $s\n" . substr((string) $b, 0, 600) . "\n";
    exit;
}

echo "Thiếu credential: cần SUPABASE_SERVICE_ROLE_KEY (JWT) hoặc SUPABASE_ACCESS_TOKEN (sbp_...).\n";
