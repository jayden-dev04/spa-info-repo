<?php
// Liệt kê / xóa user trong Supabase Auth.
//   php supabase-auth-users.php list
//   php supabase-auth-users.php delete <email>
//   php supabase-auth-users.php delete-all --yes
//   php supabase-auth-users.php nuke-sql           (in ra SQL chạy ở SQL Editor)
//
// Hai đường xác thực, script tự thử lần lượt:
//   A) SUPABASE_ACCESS_TOKEN = sbp_...  (Supabase Dashboard → avatar → Account
//      Security → Personal Access Token) → gọi Management API, xóa xác đáng.
//   B) SUPABASE_SECRET_KEY   = service_role JWT → gọi /auth/v1/admin/users.
// Publishable key KHÔNG làm được việc này (GoTrue trả 401 no_authorization).

require __DIR__ . '/vendor/autoload.php';

$env = [];
foreach (file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
    [$k, $v] = explode('=', $line, 2);
    $env[trim($k)] = trim($v);
}

$baseUrl   = rtrim($env['SUPABASE_URL'] ?? '', '/');
$ref       = explode('.', (string) parse_url($baseUrl, PHP_URL_HOST))[0];
$secretKey = $env['SUPABASE_SECRET_KEY'] ?? '';
$accessTok = $env['SUPABASE_ACCESS_TOKEN'] ?? '';

$http = function (string $method, string $url, array $headers, ?array $body = null): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_HTTPHEADER     => $headers,
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    $b = curl_exec($ch); $s = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch); curl_close($ch);
    if ($b === false) return [0, 'curl: ' . $err];
    return [$s, json_decode((string) $b, true) ?? $b];
};

$gotrue = function (string $method, string $path, ?array $body = null) use ($baseUrl, $secretKey, $http) {
    return $http($method, $baseUrl . $path,
        ["apikey: $secretKey", "Authorization: Bearer $secretKey", 'Content-Type: application/json'], $body);
};

// Management API: GET /v1/projects/{ref}/database/query trả về array row
$mgmt = function (string $sql) use ($ref, $accessTok, $http) {
    return $http('POST', "https://api.supabase.com/v1/projects/{$ref}/database/query",
        ["Authorization: Bearer $accessTok", 'Content-Type: application/json'],
        ['query' => $sql]);
};

$cmd = $argv[1] ?? 'list';

// ---------------------------------------------------------------- SQLEditor
if ($cmd === 'nuke-sql') {
    echo <<<SQL
-- Chạy trong Supabase Dashboard → SQL Editor.
-- Xóa TOÀN BỘ tài khoản Auth + hồ sơ public.users.

-- Trigger tự tạo row public.users (xóa để row không mọc lại)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

TRUNCATE TABLE auth.users   RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.users RESTART IDENTITY CASCADE;

SELECT (SELECT count(*) FROM auth.users)   AS auth_users,
       (SELECT count(*) FROM public.users) AS public_users;
SQL;
    exit(0);
}

// ---------------------------------------------------------------------- list
if ($cmd === 'list') {
    if ($accessTok) {
        [$s, $res] = $mgmt('SELECT id, email, created_at FROM auth.users ORDER BY created_at;');
        if ($s === 200) {
            foreach ((array) $res as $u) printf("%s  %s\n", $u['id'] ?? '?', $u['email'] ?? '-');
            printf("Tổng: %d (Management API)\n", is_countable($res) ? count($res) : 0);
            exit(0);
        }
        echo "Management API HTTP $s => " . json_encode($res, JSON_UNESCAPED_UNICODE) . "\n";
    }
    if ($secretKey) {
        [$s, $res] = $gotrue('GET', '/auth/v1/admin/users?page=1&per_page=50');
        if ($s === 200) {
            foreach (($res['users'] ?? []) as $u) printf("%s  %s\n", $u['id'], $u['email'] ?? '-');
            printf("Tổng: %d (GoTrue admin API)\n", count($res['users'] ?? []));
            exit(0);
        }
        echo "GoTrue admin API HTTP $s => " . json_encode($res, JSON_UNESCAPED_UNICODE) . "\n";
    }
    echo "\nKhông có credential hợp lệ.\n";
    echo "  Lấy Personal Access Token (sbp_...) → Supabase Dashboard → avatar góc trái\n";
    echo "  → Account Security → Personal Access Tokens → New access token.\n";
    echo "  Dán vào server/.env: SUPABASE_ACCESS_TOKEN=sbp_xxx\n";
    echo "Hoặc chạy: php supabase-auth-users.php nuke-sql  → dán vào SQL Editor.\n";
    exit(1);
}

// -------------------------------------------------------------------- delete
if ($cmd === 'delete') {
    $email = strtolower($argv[2] ?? '');
    if (!$email) exit("Cách dùng: php supabase-auth-users.php delete <email>\n");
    $q = str_replace("'", "''", $email);
    if ($accessTok) {
        [$s, $res] = $mgmt("DELETE FROM auth.users WHERE lower(email) = '{$q}' RETURNING id, email;");
        echo "Management API HTTP $s => " . json_encode($res, JSON_UNESCAPED_UNICODE) . "\n";
        [$s2, $r2] = $mgmt("DELETE FROM public.users WHERE lower(email) = '{$q}' RETURNING id, email;");
        echo "public.users   HTTP $s2 => " . json_encode($r2, JSON_UNESCAPED_UNICODE) . "\n";
        exit($s === 200 ? 0 : 1);
    }
    echo "Cần SUPABASE_ACCESS_TOKEN (sbp_...). Xem hướng dẫn: php supabase-auth-users.php list\n";
    exit(1);
}

// ------------------------------------------------------------- delete-all
if ($cmd === 'delete-all') {
    if (($argv[2] ?? '') !== '--yes') {
        exit("Sẽ XÓA TOÀN BỘ tài khoản của project {$ref} (auth.users + public.users).\nXác nhận: php supabase-auth-users.php delete-all --yes\n");
    }
    if (!$accessTok) {
        echo "Cần SUPABASE_ACCESS_TOKEN (sbp_...).Xem: php supabase-auth-users.php list\n";
        exit(1);
    }
    [$s, $res] = $mgmt(
        'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;' .
        'DROP TRIGGER IF EXISTS handle_new_user ON auth.users;' .
        'DROP FUNCTION IF EXISTS public.handle_new_user();' .
        'TRUNCATE TABLE auth.users RESTART IDENTITY CASCADE;' .
        'TRUNCATE TABLE public.users RESTART IDENTITY CASCADE;' .
        'SELECT (SELECT count(*) FROM auth.users) AS auth_users, (SELECT count(*) FROM public.users) AS public_users;');
    echo "HTTP $s => " . json_encode($res, JSON_UNESCAPED_UNICODE) . "\n";
    exit($s === 200 ? 0 : 1);
}

echo "Lệnh không rõ: $cmd\n";
