<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RssController extends Controller
{
    private const SITE_BASE = 'http://localhost:5173';

    // -------------------------------------------------------------------------
    // Shared helpers (copy pattern từ AppointmentController)
    // -------------------------------------------------------------------------

    private function baseUrl(): string
    {
        return rtrim(env('SUPABASE_URL'), '/');
    }

    /**
     * Supabase PostgREST headers — bản public (read-only).
     * RSS chỉ đọc nên không cần service_role key.
     */
    private function supabaseHeaders(): array
    {
        $key = env('SUPABASE_PUBLISHABLE_KEY') ?: env('SUPABASE_KEY');

        return [
            'apikey'        => $key,
            'Authorization' => 'Bearer ' . $key,
            'Content-Type'  => 'application/json',
        ];
    }

    private function escapeXml(?string $value): string
    {
        return htmlspecialchars((string) $value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }

    // =========================================================================
    // GET /rss (alias /api/rss) — RSS 2.0 feed của blog posts
    // =========================================================================
    public function index()
    {
        $posts = [];

        try {
            $response = Http::withoutVerifying()
                ->withHeaders($this->supabaseHeaders())
                ->get("{$this->baseUrl()}/rest/v1/blogs", [
                    'select' => 'title,slug,excerpt,content,created_at',
                    'order'  => 'created_at.desc',
                    'limit'  => 50,
                ]);

            if ($response->successful()) {
                $posts = $response->json() ?? [];
            } else {
                // Supabase lỗi (bao gồm DNS/connection fail) → channel rỗng, không crash
                Log::warning('RSS: Supabase blogs query failed', [
                    'status' => $response->status(),
                ]);
            }
        } catch (\Throwable $e) {
            // ConnectionException v.v. → channel rỗng
            Log::warning('RSS: Supabase request exception: ' . $e->getMessage());
        }

        $items = '';
        foreach ($posts as $post) {
            $slug    = (string) ($post['slug'] ?? '');
            $title   = (string) ($post['title'] ?? '');
            $excerpt = (string) ($post['excerpt'] ?? '');
            $content = (string) ($post['content'] ?? '');
            $date    = (string) ($post['created_at'] ?? '');
            $link    = self::SITE_BASE . '/blog/' . rawurlencode($slug);

            $pubDate = '';
            if ($date !== '') {
                try {
                    $pubDate = \Carbon\Carbon::parse($date)->toRfc2822String();
                } catch (\Throwable $e) {
                    $pubDate = '';
                }
            }

            $description = $excerpt !== '' ? $excerpt : mb_substr(strip_tags($content), 0, 300);

            $items .= "    <item>\n";
            $items .= '      <title>' . $this->escapeXml($title) . "</title>\n";
            $items .= '      <link>' . $this->escapeXml($link) . "</link>\n";
            $items .= '      <guid isPermaLink="true">' . $this->escapeXml($link) . "</guid>\n";
            $items .= '      <description>' . $this->escapeXml($description) . "</description>\n";
            if ($pubDate !== '') {
                $items .= '      <pubDate>' . $this->escapeXml($pubDate) . "</pubDate>\n";
            }
            $items .= "    </item>\n";
        }

        $xml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<rss version="2.0">' . "\n";
        $xml .= "  <channel>\n";
        $xml .= '    <title>' . $this->escapeXml('Eva Spa — Blog') . "</title>\n";
        $xml .= '    <link>' . $this->escapeXml(self::SITE_BASE) . "</link>\n";
        $xml .= '    <description>' . $this->escapeXml('Tin tức và chia sẻ từ Eva Spa') . "</description>\n";
        $xml .= '    <language>vi-vn</language>\n';
        $xml .= '    <lastBuildDate>' . $this->escapeXml(\Carbon\Carbon::now()->toRfc2822String()) . "</lastBuildDate>\n";
        $xml .= $items;
        $xml .= "  </channel>\n";
        $xml .= '</rss>' . "\n";

        return response($xml, 200, [
            'Content-Type' => 'application/rss+xml; charset=UTF-8',
        ]);
    }
}
