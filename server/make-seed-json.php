<?php
// Trích seed-products.json / seed-blogs.json từ chính source TS (đồng bộ 100%).
// Chạy: php make-seed-json.php   (trong client/ hoặc server/)
$root = dirname(__DIR__);
$shop = (string) file_get_contents($root . '/client/src/pages/Shop.tsx');
$blob = (string) file_get_contents($root . '/client/src/lib/blogSeeds.ts');

// products: các object trong DEFAULT_PRODUCTS
$prods = [];
if (preg_match('/DEFAULT_PRODUCTS[^=]*=\s*\[([\s\S]*?)\n\]/', $shop, $m)) {
    $body = $m[1];
    if (preg_match_all('/\{[^{}]*\}/s', $body, $mm)) {
        foreach ($mm[0] as $raw) {
            $g = function ($k) use ($raw) {
                if (preg_match("/$k\s*:\s*'((?:[^'\\\\]|\\\\.)*)'/", $raw, $x)) return stripcslashes($x[1]);
                if (preg_match("/$k\s*:\s*\"((?:[^\"\\\\]|\\\\.)*)\"/", $raw, $x)) return stripcslashes($x[1]);
                if (preg_match("/$k\s*:\s*([0-9.]+)/", $raw, $x)) return $x[1];
                return null;
            };
            $id = $g('id'); $name = $g('name'); if (!$id || !$name) continue;
            $slug = $g('slug') ?: slugify($name);
            $price = $g('price');
            $prods[] = [
                'id' => $id, 'name' => $name, 'slug' => $slug,
                'category' => $g('category') ?: 'Chăm sóc da',
                'price' => (float) $price,
                'image_url' => $g('image') ?: $g('image_url'),
                'description' => $g('description') ?: $g('desc') ?: null,
                'is_active' => true,
            ];
        }
    }
}
file_put_contents(__DIR__ . '/seed-products.json', json_encode($prods, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
echo 'products=' . count($prods) . "\n";

// blogs: các object trong blogSeeds
$blogs = [];
if (preg_match('/=\s*\[([\s\S]*?)\n\]/', $blob, $m)) {
    $body = preg_replace('/\n\s*/g', ' ', $m[1]);
    if (preg_match_all('/\{[^{}]*\}/', $body, $mm)) {
        foreach ($mm[0] as $raw) {
            $g = function ($k) use ($raw) {
                if (preg_match("/$k\s*:\s*'((?:[^'\\\\]|\\\\.)*)'/", $raw, $x)) return stripcslashes($x[1]);
                if (preg_match("/$k\s*:\s*\"((?:[^\"\\\\]|\\\\.)*)\"/", $raw, $x)) return stripcslashes($x[1]);
                if (preg_match("/$k\s*:\s*([0-9.]+)/", $raw, $x)) return $x[1];
                if (preg_match("/$k\s*:\s*(true|false)/", $raw, $x)) return $x[1] === 'true';
                return null;
            };
            $slug = $g('slug') ?: ($g('id') ?: null);
            if (!$slug || !is_string($slug)) continue;
            $title = $g('title');
            $blogs[] = [
                'slug' => $slug,
                'title' => $title ?: $slug,
                'category' => $g('category') ?: 'Dưỡng Sinh & Trị Liệu',
                'excerpt' => $g('excerpt') ?: $g('summary'),
                'content' => $g('content') ?: $g('body') ?: '',
                'image_url' => $g('image') ?: $g('image_url'),
                'read_time' => $g('readTime') ?: $g('read_time'),
                'date_label' => $g('date') ?: $g('date_label'),
                'author' => $g('author') ?: 'Eva Spa',
            ];
        }
    }
}
file_put_contents(__DIR__ . '/seed-blogs.json', json_encode($blogs, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
echo 'blogs=' . count($blogs) . "\n";

function slugify(string $s): string
{
    $s = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s) ?: $s;
    $s = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $s));
    return trim($s, '-') ?: 'sp';
}
