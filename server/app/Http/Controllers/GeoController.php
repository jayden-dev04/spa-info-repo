<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Địa danh Việt Nam (tỉnh/thành + phường/xã) cho form đặt hàng/đặt lịch.
 * Nguồn sự thật: bảng public.vietnam_provinces / vietnam_wards trong Supabase
 * (được seed từ https://provinces.open-api.vn/api/v2 — dữ liệu sau sáp nhập 2025).
 *
 * GET /api/geo/provinces          → 34 tỉnh/thành
 * GET /api/geo/wards?province=79  → phường/xã của tỉnh 79
 * GET /api/geo/sync               → kéo dữ liệu mới từ API v2 về Supabase (upsert)
 */
class GeoController extends Controller
{
    private function baseUrl(): string
    {
        return rtrim((string) env('SUPABASE_URL'), '/');
    }

    private function headers(): array
    {
        return [
            'apikey'        => env('SUPABASE_SECRET_KEY') ?: env('SUPABASE_KEY'),
            'Authorization' => 'Bearer ' . (env('SUPABASE_SECRET_KEY') ?: env('SUPABASE_KEY')),
            'Content-Type'  => 'application/json',
        ];
    }

    private function cors(): array
    {
        return [
            'Access-Control-Allow-Origin'  => '*',
            'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With',
        ];
    }

    // GET /api/geo/provinces
    public function provinces()
    {
        $r = Http::withoutVerifying()->timeout(30)
            ->withHeaders($this->headers())
            ->get("{$this->baseUrl()}/rest/v1/vietnam_provinces?select=code,name,slug,division_type&order=name.asc");

        if ($r->successful()) {
            return response()->json(['success' => true, 'data' => $r->json()])
                ->withHeaders($this->cors());
        }
        return response()->json(['success' => false, 'error' => $r->json()], $r->status())
            ->withHeaders($this->cors());
    }

    // GET /api/geo/wards?province=79
    public function wards(Request $request)
    {
        $province = (int) $request->query('province', 0);
        if ($province <= 0) {
            return response()->json(['success' => false, 'error' => 'thiếu tham số ?province=<code>'], 422)
                ->withHeaders($this->cors());
        }
        $r = Http::withoutVerifying()->timeout(30)
            ->withHeaders($this->headers())
            ->get("{$this->baseUrl()}/rest/v1/vietnam_wards?select=code,name,slug,division_type&province_code=eq.{$province}&order=name.asc");

        if ($r->successful()) {
            return response()->json(['success' => true, 'data' => $r->json()])
                ->withHeaders($this->cors());
        }
        return response()->json(['success' => false, 'error' => $r->json()], $r->status())
            ->withHeaders($this->cors());
    }

    // GET /api/geo/sync — kéo provinces.open-api.vn/api/v2 → upsert vào Supabase
    public function sync()
    {
        try {
            $provinces = Http::withoutVerifying()->timeout(60)
                ->get('https://provinces.open-api.vn/api/v2/p/')->json();
            if (!is_array($provinces)) {
                return response()->json(['success' => false, 'error' => 'API nguồn không phản hồi'], 502);
            }

            $provRows = [];
            $wardRows = [];
            foreach ($provinces as $p) {
                $provRows[] = [
                    'code'          => $p['code'],
                    'name'          => $p['name'],
                    'slug'          => $p['codename'] ?? '',
                    'division_type' => $p['division_type'] ?? 'tỉnh',
                    'phone_code'    => $p['phone_code'] ?? null,
                ];
                $full = Http::withoutVerifying()->timeout(60)
                    ->get("https://provinces.open-api.vn/api/v2/p/{$p['code']}?depth=2")->json();
                foreach (($full['wards'] ?? []) as $w) {
                    $wardRows[] = [
                        'code'          => $w['code'],
                        'province_code' => $p['code'],
                        'name'          => $w['name'],
                        'slug'          => $w['codename'] ?? '',
                        'division_type' => $w['division_type'] ?? 'phường',
                    ];
                }
            }

            $h = $this->headers() + ['Prefer' => 'resolution=merge-duplicates,return=minimal'];
            $rp = Http::withoutVerifying()->timeout(120)->withHeaders($h)
                ->post("{$this->baseUrl()}/rest/v1/vietnam_provinces", $provRows);
            $rw = Http::withoutVerifying()->timeout(300)->withHeaders($h)
                ->post("{$this->baseUrl()}/rest/v1/vietnam_wards", $wardRows);

            return response()->json([
                'success'         => $rp->successful() && $rw->successful(),
                'provinces'       => $rp->successful() ? 'ok x' . count($provRows) : mb_substr($rp->body(), 0, 200),
                'wards'           => $rw->successful() ? 'ok x' . count($wardRows) : mb_substr($rw->body(), 0, 200),
            ], 200, [], JSON_UNESCAPED_UNICODE)->withHeaders($this->cors());
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500)
                ->withHeaders($this->cors());
        }
    }
}
