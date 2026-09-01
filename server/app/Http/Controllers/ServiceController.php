<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ServiceController extends Controller
{
    // Lấy Base URL của Supabase từ .env
    private function baseUrl()
    {
        return rtrim(env('SUPABASE_URL'), '/');
    }

    // Headers dùng chung cho Supabase REST API
    private function supabaseHeaders()
    {
        return [
            'apikey'        => env('SUPABASE_SECRET_KEY'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SECRET_KEY'),
            'Content-Type'  => 'application/json',
            'Prefer'        => 'return=representation'
        ];
    }

    // Headers dùng cho CORS (trả về frontend)
    private function corsHeaders()
    {
        return [
            'Access-Control-Allow-Origin'  => '*',
            'Access-Control-Allow-Methods' => 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, X-User-Id',
        ];
    }

    // GET /api/services
    public function index()
    {
        $response = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders())
            ->get("{$this->baseUrl()}/rest/v1/services?order=id.asc");

        if ($response->successful()) {
            return response()->json([
                'success' => true,
                'data'    => $response->json(),
            ])->withHeaders($this->corsHeaders());
        }

        return response()->json([
            'success' => false,
            'error'   => $response->json()
        ], $response->status())->withHeaders($this->corsHeaders());
    }

    // POST /api/services
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'              => 'required|string|max:255',
            'short_description' => 'required|string|max:500',
            'description'       => 'nullable|string',
            'price'             => 'required|numeric|min:0',
            'duration_minutes'  => 'required|integer|min:1',
            'image_url'         => 'nullable|url',
            'is_active'         => 'boolean'
        ]);

        if (!isset($validated['is_active'])) {
            $validated['is_active'] = true;
        }

        $response = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders())
            ->post("{$this->baseUrl()}/rest/v1/services", $validated);

        if ($response->successful()) {
            return response()->json([
                'success' => true,
                'message' => 'Tạo dịch vụ thành công',
                'data'    => $response->json()[0] ?? $response->json()
            ], 201)->withHeaders($this->corsHeaders());
        }

        return response()->json([
            'success' => false,
            'error'   => 'Lỗi khi tạo dịch vụ',
            'details' => $response->json()
        ], $response->status())->withHeaders($this->corsHeaders());
    }

    // PATCH /api/services/{id}
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name'              => 'sometimes|string|max:255',
            'short_description' => 'sometimes|string|max:500',
            'description'       => 'nullable|string',
            'price'             => 'sometimes|numeric|min:0',
            'duration_minutes'  => 'sometimes|integer|min:1',
            'image_url'         => 'nullable|url',
            'is_active'         => 'sometimes|boolean'
        ]);

        $response = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders())
            ->patch("{$this->baseUrl()}/rest/v1/services?id=eq.{$id}", $validated);

        if ($response->successful()) {
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật dịch vụ thành công',
                'data'    => $response->json()[0] ?? $response->json()
            ])->withHeaders($this->corsHeaders());
        }

        return response()->json([
            'success' => false,
            'error'   => 'Lỗi khi cập nhật dịch vụ',
            'details' => $response->json()
        ], $response->status())->withHeaders($this->corsHeaders());
    }

    // DELETE /api/services/{id}
    public function destroy($id)
    {
        $response = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders())
            ->delete("{$this->baseUrl()}/rest/v1/services?id=eq.{$id}");

        if ($response->successful()) {
            return response()->json([
                'success' => true,
                'message' => 'Xóa dịch vụ thành công'
            ])->withHeaders($this->corsHeaders());
        }

        return response()->json([
            'success' => false,
            'error'   => 'Lỗi khi xóa dịch vụ',
            'details' => $response->json()
        ], $response->status())->withHeaders($this->corsHeaders());
    }
}
