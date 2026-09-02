<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Tooling nội bộ máy dev (chỉ APP_ENV=local).
 * User dán secret key vào form 1 lần → key chỉ nằm trong server/.env,
 * không hiển thị lại, không gửi ra ngoài. Từ đó Laravel dùng key bypass RLS:
 * chạy SQL qua RPC exec_sql + seed dữ liệu.
 */
class DevToolController extends Controller
{
    private function guard(): ?\Illuminate\Http\JsonResponse
    {
        if (env('APP_ENV') !== 'local') {
            return response()->json(['ok' => false, 'error' => 'chỉ chạy được ở APP_ENV=local'], 403);
        }
        return null;
    }

    private function key(): string
    {
        return (string) (env('SUPABASE_SECRET_KEY') ?: '');
    }

    private function isSecret(): bool
    {
        return str_starts_with($this->key(), 'sb_secret_');
    }

    private function putEnv(string $name, string $value): void
    {
        $path = base_path('.env');
        $lines = file_exists($path) ? file($path, FILE_IGNORE_NEW_LINES) : [];
        $found = false;
        foreach ($lines as $i => $line) {
            if (preg_match('/^' . preg_quote($name, '/') . '=/', $line)) {
                $lines[$i] = $name . '=' . $value;
                $found = true;
            }
        }
        if (!$found) $lines[] = $name . '=' . $value;
        file_put_contents($path, implode("\n", $lines) . "\n");
        putenv($name . '=' . $value);
        $_ENV[$name] = $value;
    }

    /** Form dán key + các nút chạy migrate/seed/status (chỉ local, không auto-POST). */
    public function form()
    {
        if ($resp = $this->guard()) return $resp;
        $state = $this->isSecret() ? 'ok' : 'warn';
        $stateText = $this->isSecret() ? 'đã có secret key hợp lệ' : 'secret key chưa hợp lệ';
        return response(<<<HTML
<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Dev Tool — Eva Spa</title>
<style>body{font-family:system-ui;max-width:680px;margin:40px auto;padding:0 16px;line-height:1.5}input{width:100%;padding:10px;margin:8px 0}button,a.btn{display:inline-block;padding:10px 16px;background:#0a7d32;color:#fff;border:0;cursor:pointer;text-decoration:none}code{background:#f2f2f2;padding:2px 5px;border-radius:4px}.ok{color:#0a7d32}.warn{color:#b26a00}</style>
</head><body>
<h2>Dev Tool — Eva Spa (chỉ máy dev, APP_ENV=local)</h2>
<p>1) Dán <b>Secret Key</b> (sb_secret_… — Supabase Dashboard → Settings → API Keys → REST).
Key chỉ ghi vào <code>server/.env</code> máy bạn, không hiển thị lại, không gửi đi nơi khác.</p>
<p class="{$state}">Trạng thái: {$stateText}</p>
<form method="POST" action="/dev/tool/key">
  <input type="password" name="key" placeholder="sb_secret_..." autocomplete="off" required>
  <button type="submit">Lưu vào .env</button>
</form>
<hr>
<p>2) Sau khi lưu: bấm lần lượt</p>
<a class="btn" href="/dev/tool/migrate">Migrate (schema)</a>
<a class="btn" href="/dev/tool/seed">Seed (20 SP + 14 blog + popup)</a>
<a class="btn" href="/dev/tool/status">Status</a>
<p class="warn">Xong việc: xóa <code>SUPABASE_SECRET_KEY</code> khỏi <code>server/.env</code> nếu không dùng nữa.</p>
</body></html>
HTML);
    }

    /** Nhận key qua POST form (password field). Không bao giờ trả key về. */
    public function saveKey(Request $request)
    {
        if ($resp = $this->guard()) return $resp;
        $key = trim((string) $request->input('key', ''));
        if (!str_starts_with($key, 'sb_secret_') || strlen($key) < 30) {
            return response()->json(['ok' => false, 'error' => 'key phải bắt đầu bằng sb_secret_'], 422);
        }
        $this->putEnv('SUPABASE_SECRET_KEY', $key);
        return response()->json(['ok' => true, 'message' => 'đã lưu vào server/.env'], 200, [], JSON_UNESCAPED_UNICODE);
    }

    private function headers(): array
    {
        return [
            'apikey' => $this->key(),
            'Authorization' => 'Bearer ' . $this->key(),
            'Content-Type' => 'application/json',
        ];
    }

    /** POST 1 câu SQL qua RPC exec_sql (hàm do chính file migrate tạo ra). */
    private function execSql(string $sql): array
    {
        $base = rtrim((string) env('SUPABASE_URL'), '/');
        $r = Http::withoutVerifying()->timeout(60)->withHeaders($this->headers())
            ->post("{$base}/rest/v1/rpc/exec_sql", ['sql' => $sql]);
        return ['ok' => $r->successful(), 'body' => $r->body(), 'status' => $r->status()];
    }

    /**
     * Chạy schema. Cách chạy: exec_sql CHƯA tồn tại → lần đầu bấm Migrate
     * sẽ trả về code RPC tự cài (user dán 1 lần vào SQL Editor).
     */
    public function migrate()
    {
        if ($resp = $this->guard()) return $resp;
        if (!$this->isSecret()) {
            return response()->json(['ok' => false, 'error' => 'lưu secret key trước'], 400);
        }
        $sqlFile = base_path('../client/supabase/migrations/PASTE_NAY.sql');
        if (!file_exists($sqlFile)) {
            return response()->json(['ok' => false, 'error' => 'thiếu file PASTE_NAY.sql'], 500);
        }
        $probe = $this->execSql('SELECT 1');
        if (!$probe['ok']) {
            // exec_sql chưa tồn tại: phát code cài đặt 1 lần
            $code = <<<'SQL'
-- CHỈ dán 1 lần vào Supabase SQL Editor (cài cầu nối cho DevTool):
create or replace function public.exec_sql(sql text)
returns void language plpgsql as $$
begin
  execute sql;
end $$;
-- khóa chỉ service_role được gọi:
revoke all on function public.exec_sql(text) from public, anon, authenticated;
grant execute on function public.exec_sql(text) to service_role;
SQL;
            return response()->json([
                'ok' => false,
                'step' => 'can_exec_sql',
                'message' => 'Dán đoạn "setup" dưới vào Supabase SQL Editor → Run 1 lần (chỉ service_role gọi được), rồi bấm Migrate lại.',
                'setup_sql' => $code,
            ], 200, [], JSON_UNESCAPED_UNICODE);
        }
        $sql = file_get_contents($sqlFile);
        $stmts = preg_split('/;\s*(?=(?:[^"]*"[^"]*")*[^"]*$)/s', $sql);
        $ran = 0;
        foreach ($stmts as $s) {
            $s = trim($s);
            if ($s === '' || preg_match('/^(--|\/\*)/m', $s) === 1 && trim(preg_replace('/^\s*--.*$/m', '', $s)) === '') continue;
            if (preg_match('/^\s*(--.*)+$/s', $s)) continue;
            $res = $this->execSql($s);
            if (!$res['ok'] && stripos($res['body'], 'already exists') === false) {
                return response()->json(['ok' => false, 'failed_stmt' => mb_substr($s, 0, 160), 'detail' => mb_substr($res['body'], 0, 200)], 200, [], JSON_UNESCAPED_UNICODE);
            }
            $ran++;
        }
        return response()->json(['ok' => true, 'statements_ran' => $ran], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /** Seed qua PostgREST với secret key: 20 SP + 14 blog + popup default. */
    public function seed()
    {
        if ($resp = $this->guard()) return $resp;
        if (!$this->isSecret()) {
            return response()->json(['ok' => false, 'error' => 'lưu secret key trước'], 400);
        }
        $base = rtrim((string) env('SUPABASE_URL'), '/');
        $h = $this->headers();

        // products từ seed_products.sql
        $sqlFile = base_path('../server/database/seeders/seed_products.sql');
        $products = [];
        if (file_exists($sqlFile)) {
            $sql = file_get_contents($sqlFile);
            if (preg_match_all("/\('((?:[^']|'')*)', '((?:[^']|'')*)', ([\d.]+), (\d+), '((?:[^']|'')*)', '((?:[^']|'')*)'\)/", $sql, $m, PREG_SET_ORDER)) {
                foreach ($m as $row) {
                    $un = fn($v) => str_replace("''", "'", $v);
                    $products[] = [
                        'name' => $un($row[1]), 'description' => $un($row[2]), 'price' => (float) $row[3],
                        'stock' => (int) $row[4], 'category' => $un($row[5]), 'image_url' => $un($row[6]), 'is_active' => true,
                    ];
                }
            }
        }
        $out = ['products' => 'skip'];
        if ($products) {
            $r = Http::withoutVerifying()->withHeaders($h + ['Prefer' => 'resolution=merge-duplicates,return=minimal'])
                ->post("{$base}/rest/v1/products", $products);
            $out['products'] = $r->successful() ? 'ok x' . count($products) : mb_substr($r->body(), 0, 160);
        }

        // blog từ JSON export (blogSeeds) — đọc nếu loader scripts đã để lại file
        $blogFile = base_path('../client/.tmp-blog-posts.json');
        $out['blog_posts'] = 'skip';
        if (file_exists($blogFile)) {
            $posts = json_decode(file_get_contents($blogFile), true);
            $r = Http::withoutVerifying()->withHeaders($h + ['Prefer' => 'resolution=merge-duplicates,return=minimal'])
                ->post("{$base}/rest/v1/blog_posts", $posts);
            $out['blog_posts'] = $r->successful() ? 'ok x' . count($posts) : mb_substr($r->body(), 0, 160);
        }

        // popup default
        $popup = ['key' => 'default', 'config' => [
            'enabled' => true, 'badge' => "ƯU ĐÃI 30' CHĂM SÓC DA", 'title' => 'CHỈ 199.000Đ',
            'subtitle' => 'Khi đặt kèm bất kỳ liệu trình dưỡng sinh chính', 'highlightPrice' => '199K',
            'imageUrl' => 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
            'ctaText' => 'ĐẶT LỊCH NGAY', 'ctaLink' => '/booking', 'dismissText' => 'KHÔNG, CẢM ƠN',
            'footnote' => '*Giá chưa bao gồm 8% thuế VAT & phí dịch vụ', 'delaySeconds' => 1.5,
            'frequency' => 'always', 'showOnMobile' => true, 'couponCode' => 'T7SPRING',
            'couponLabel' => 'Ưu đãi tháng này: Miễn phí giao hàng toàn quốc cho đơn mỹ phẩm từ 500.000đ',
            'couponExpiresAt' => '31/08/2026',
        ]];
        $r = Http::withoutVerifying()->withHeaders($h + ['Prefer' => 'resolution=merge-duplicates,return=minimal'])
            ->post("{$base}/rest/v1/popup_configs", [$popup]);
        $out['popup_configs'] = $r->successful() ? 'ok' : mb_substr($r->body(), 0, 160);

        return response()->json($out, 200, [], JSON_UNESCAPED_UNICODE);
    }

    /** Kiểm tra schema + key, không lộ key. */
    public function status()
    {
        if ($resp = $this->guard()) return $resp;
        $base = rtrim((string) env('SUPABASE_URL'), '/');
        $out = ['secret_key_ok' => $this->isSecret(), 'checks' => []];
        $probes = [
            'products' => 'select=category&limit=1',
            'popup_configs' => 'select=key&limit=1',
            'blog_posts' => 'select=author&limit=1',
            'cart_items' => 'select=product_name&limit=1',
            'orders' => 'select=notes&limit=1',
            'order_items' => 'select=quantity&limit=1',
        ];
        foreach ($probes as $t => $q) {
            $r = Http::withoutVerifying()->withHeaders([
                'apikey' => $this->key() ?: env('SUPABASE_KEY'),
                'Authorization' => 'Bearer ' . ($this->key() ?: env('SUPABASE_KEY')),
            ])->get("{$base}/rest/v1/{$t}?{$q}");
            $out['checks'][$t] = $r->successful() ? 'ok' : mb_substr($r->body(), 0, 120);
        }
        return response()->json($out, 200, [], JSON_UNESCAPED_UNICODE);
    }
}
