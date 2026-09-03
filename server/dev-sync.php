<?php
// === Eva Spa — cầu nối dev MỘT LẦN ===
// Cách chạy (trong server/):  php dev-sync.php   (key dán trực tiếp, KHÔNG sửa .env)
//   php dev-sync.php migrate   → chạy các lệnh tạo bảng/cột (tách từ PASTE_NAY.sql) qua HTTP REST — không cần rpc exec_sql
//   php dev-sync.php seed      → 20 sản phẩm + 14 blog + popup (idempotent upsert)
//   php dev-sync.php status    → đếm bảng + đo cột
//   php dev-sync.php all       → migrate + seed + status
// Key: biến môi trường SUPABASE_SECRET_KEY, hoặc file server/.secret_key (dòng đầu), hoặc .env.
// Ưu tiên key sb_secret_ (service role — mới tạo được bảng). Không bao giờ in key.

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cands = array_values(array_filter([
    (string) (getenv('SUPABASE_SECRET_KEY') ?: ''),
    (string) @file_get_contents(__DIR__ . '/.secret_key') ?: '',
    (string) (env('SUPABASE_SECRET_KEY') ?: ''),
]));
$key = '';
foreach ($cands as $c) {
    $c = trim(trim($c), "\"' \t");
    if (str_starts_with($c, 'sb_secret_')) { $key = $c; break; }
}
if ($key === '') {
    fwrite(STDERR, "CHƯA có secret key sb_secret_. 1 trong 3 cách:\n");
    fwrite(STDERR, "  A) PowerShell:  cd server ; \$env:SUPABASE_SECRET_KEY='sb_secret_...' ; php dev-sync.php all\n");
    fwrite(STDERR, "  B) tạo server/.secret_key chứa đúng 1 dòng key (đã gitignore)\n");
    fwrite(STDERR, "  C) SUPABASE_SECRET_KEY=sb_secret_... trong .env\n");
    exit(1);
}
$base = rtrim((string) env('SUPABASE_URL') ?: 'https://lydxhltbvsuyrbvulkwe.supabase.co', '/');
$cmd  = $argv[1] ?? 'all';

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
        CURLOPT_POSTFIELDS => $json === null ? null : json_encode($json, JSON_UNESCAPED_UNICODE),
    ]);
    $body = (string) curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, $body];
}

function step(string $label, int $code, string $body, bool $expect = true): bool
{
    $ok = $code >= 200 && $code < 300;
    printf("%-40s %s %d %s\n", $label, ($ok === $expect) ? 'OK  ' : 'FAIL', $code, $ok ? '' : mb_substr(preg_replace('/\s+/', ' ', $body), 0, 140));
    return $ok === $expect;
}

$H  = ["apikey: $key", "Authorization: Bearer $key", 'Content-Type: application/json'];
$HM = array_merge($H, ['Prefer: return=representation']);

// ---------- MIGRATE (HTTP /tables API — service role) ----------
if ($cmd === 'migrate' || $cmd === 'all') {
    $mkTable = function (string $name, array $cols, string $pk) use ($base, $H): bool {
        // table đã tồn tại?
        [$c] = req('GET', "$base/rest/v1/$name?select=&limit=1", $H);
        if ($c >= 200 && $c < 300) { echo str_pad("table $name", 40) . " tồn tại — bỏ qua tạo\n"; return true; }
        $payload = ['name' => $name, 'schema' => 'public', 'columns' => [], 'primary_keys' => [$pk]];
        foreach ($cols as $col) {
            $payload['columns'][] = [
                'name' => $col[0], 'type' => $col[1],
                'nullable' => ($col[2] ?? 'YES') === 'YES',
                'default_for_new_columns' => $col[3] ?? null,
            ];
        }
        [$c, $b] = req('POST', "$base/api/v1/pg/tables", $H, $payload);
        // dự phòng: endpoint meta cũ
        if ($c === 404 || $c === 405) { [$c, $b] = req('POST', "$base/rest/v1/tables", $H, $payload); }
        return step("table $name", $c, $b);
    };

    $ok1 = $mkTable('popup_configs', [
        ['key', 'text', 'NO', "'default'"],
        ['config', 'jsonb', 'NO', "'{}'"],
        ['updated_at', 'timestamptz', 'NO', 'now()'],
    ], 'key');

    // blog_posts: thiếu author/meta_* → tạo bảng mới tên blog_posts2 nếu blog_posts cũ thiếu cột
    [$cB] = req('GET', "$base/rest/v1/blog_posts?select=author&limit=1", $H);
    if (!($cB >= 200 && $cB < 300)) {
        $ok2 = $mkTable('blog_posts2', [
            ['slug', 'text', 'NO', null],
            ['title', 'text', 'NO', null],
            ['category', 'text', 'NO', "'Dưỡng Sinh & Trị Liệu'"],
            ['excerpt', 'text', 'YES', null],
            ['content', 'text', 'NO', "''"],
            ['image_url', 'text', 'YES', null],
            ['views', 'int4', 'NO', '0'],
            ['read_time', 'text', 'YES', "'5 phút đọc'"],
            ['date_label', 'text', 'YES', null],
            ['author', 'text', 'YES', "'Eva Spa'"],
            ['meta_title', 'text', 'YES', null],
            ['meta_description', 'text', 'YES', null],
            ['focus_keyword', 'text', 'YES', null],
            ['published_at', 'timestamptz', 'YES', null],
            ['created_at', 'timestamptz', 'NO', 'now()'],
            ['updated_at', 'timestamptz', 'NO', 'now()'],
        ], 'slug');
    } else { $ok2 = true; }

    // cart_items thiếu product_name?
    [$cC] = req('GET', "$base/rest/v1/cart_items?select=product_name&limit=1", $H);
    if (!($cC >= 200 && $cC < 300)) {
        $ok3 = $mkTable('cart_items2', [
            ['id', 'int8', 'NO', "generated always as identity"],
            ['session_key', 'text', 'NO', "''"],
            ['user_id', 'uuid', 'YES', null],
            ['product_id', 'text', 'NO', null],
            ['product_name', 'text', 'NO', null],
            ['price', 'numeric', 'NO', '0'],
            ['image_url', 'text', 'YES', null],
            ['quantity', 'int4', 'NO', '1'],
            ['updated_at', 'timestamptz', 'NO', 'now()'],
        ], 'id');
    } else { $ok3 = true; }

    // thêm cột qua /columns API
    $addCols = function (string $table, array $cols) use ($base, $H): bool {
        $all = true;
        foreach ($cols as $col) {
            $payload = ['name' => $col[0], 'type' => $col[1], 'nullable' => ($col[2] ?? 'YES') === 'YES', 'default_for_new_columns' => $col[3] ?? null];
            [$c, $b] = req('POST', "$base/api/v1/pg/tables/$table/columns", $H, $payload);
            if ($c === 404 || $c === 405) { [$c, $b] = req('POST', "$base/rest/v1/columns?table=eq.$table", $H, [$payload]); }
            $all = step("col $table.$col[0]", $c, $b) && $all;
        }
        return $all;
    };
    $ok4 = $addCols('orders', [
        ['customer_address', 'text'], ['customer_email', 'text'], ['notes', 'text'],
        ['payment_method', 'text', 'YES', "'COD'"], ['shipping_fee', 'numeric', 'YES', '0'], ['order_code', 'text'],
    ]);
    $ok5 = $addCols('appointments', [
        ['service_id', 'int4'], ['start_time', 'time'], ['end_time', 'time'], ['appointment_date', 'date'],
        ['total_price', 'numeric'], ['note', 'text'], ['status', 'text', 'NO', "'pending'"],
    ]);
    $ok6 = $addCols('products', [['category', 'text'], ['is_active', 'bool', 'NO', 'true']]);

    echo "\n--- đo cột sau migrate ---\n";
    foreach ([
        'products.category' => 'products?select=category&limit=1',
        'popup_configs' => 'popup_configs?select=key&limit=1',
        'blog_posts.author' => 'blog_posts?select=author&limit=1',
        'cart_items.product_name' => 'cart_items?select=product_name&limit=1',
        'orders.customer_address' => 'orders?select=customer_address&limit=1',
        'appointments.start_time' => 'appointments?select=start_time&limit=1',
    ] as $label => $q) {
        [$c, $b] = req('GET', "$base/rest/v1/$q", $H);
        step("cot $label", $c, $b);
    }
    if (!($ok1 && $ok2 && $ok3 && $ok4 && $ok5 && $ok6)) {
        echo "\n=> migrate qua API chưa đủ — chạy nốt client/supabase/migrations/PASTE_NAY.sql trong SQL Editor (tạo bảng qua HTTP đôi khi bị dashboard chặn).\n";
    }
}

// ---------- SEED ----------
if ($cmd === 'seed' || $cmd === 'all') {
    $rows = json_decode((string) @file_get_contents(__DIR__ . '/seed-products.json'), true) ?: [];
    if ($rows === []) {
        echo "Thiếu server/seed-products.json — chạy: cd client && node --experimental-strip-types scripts/make-seed-json.mjs\n";
    } else {
        [$c, $b] = req('POST', "$base/rest/v1/products?on_conflict=name", array_merge($H, ['Prefer: resolution=merge-duplicates,return=minimal']), $rows);
        step('seed products (' . count($rows) . ')', $c, $b);
    }
    $blogs = json_decode((string) @file_get_contents(__DIR__ . '/seed-blogs.json'), true) ?: [];
    if ($blogs !== []) {
        // blog_posts2 nếu bản cũ thiếu cột
        [$cB] = req('GET', "$base/rest/v1/blog_posts?select=author&limit=1", $H);
        $tbl = ($cB >= 200 && $cB < 300) ? 'blog_posts' : 'blog_posts2';
        [$c, $b] = req('POST', "$base/rest/v1/$tbl?on_conflict=slug", array_merge($H, ['Prefer: resolution=merge-duplicates,return=minimal']), $blogs);
        step("seed blogs -> $tbl (" . count($blogs) . ')', $c, $b);
    }
    $popup = ['key' => 'default', 'config' => [
        'enabled' => true,
        'badge' => "ƯU ĐÃI 30' CHĂM SÓC DA",
        'title' => 'CHỈ 199.000Đ',
        'subtitle' => 'Khi đặt kèm bất kỳ liệu trình dưỡng sinh chính',
        'highlightPrice' => '199K',
        'imageUrl' => 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        'ctaText' => 'ĐẶT LỊCH NGAY',
        'ctaLink' => '/booking',
        'dismissText' => 'KHÔNG, CẢM ƠN',
        'footnote' => '*Giá chưa bao gồm 8% thuế VAT & phí dịch vụ',
        'delaySeconds' => 1.5,
        'couponCode' => 'T7SPRING',
        'couponLabel' => 'Giảm 10% tối đa 100.000đ',
    ]];
    [$c, $b] = req('POST', "$base/rest/v1/popup_configs?on_conflict=key", array_merge($H, ['Prefer: resolution=merge-duplicates,return=representation']), [$popup]);
    step('seed popup_configs', $c, $b);
}

// ---------- STATUS ----------
if ($cmd === 'status' || $cmd === 'all') {
    foreach (['products', 'blog_posts', 'blog_posts2', 'popup_configs', 'cart_items', 'cart_items2', 'orders', 'appointments', 'services'] as $t) {
        $ch = curl_init("$base/rest/v1/$t?select=&limit=0");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_HTTPHEADER => ["apikey: $key", "Authorization: Bearer $key", 'Prefer: count=exact'],
            CURLOPT_HEADER => true,
            CURLOPT_NOBODY => false,
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
