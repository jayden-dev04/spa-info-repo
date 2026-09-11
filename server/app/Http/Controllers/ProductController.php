<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ProductController extends Controller
{
    private function baseUrl()
    {
        return rtrim(env('SUPABASE_URL'), '/');
    }

    private function supabaseHeaders()
    {
        return [
            'apikey'        => env('SUPABASE_SECRET_KEY'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SECRET_KEY'),
            'Content-Type'  => 'application/json',
        ];
    }

    private function corsHeaders()
    {
        return [
            'Access-Control-Allow-Origin'  => '*',
            'Access-Control-Allow-Methods' => 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, X-User-Id',
        ];
    }

    // Lấy danh sách sản phẩm
    public function index(Request $request)
    {
        // Nếu có truyền ?category=... có thể lọc thêm, nhưng tạm thời lấy tất cả
        // Join với bảng product_categories để lấy tên danh mục
        $response = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders())
            ->get("{$this->baseUrl()}/rest/v1/products?select=*,product_categories(name)&order=created_at.desc");

        if ($response->successful()) {
            // Format lại dữ liệu cho giống với frontend đang cần
            $products = array_map(function ($p) {
                $p['category'] = isset($p['product_categories']['name']) ? $p['product_categories']['name'] : 'Mỹ phẩm thảo mộc';
                $p['stock'] = $p['stock_quantity'] ?? 0;
                unset($p['product_categories']);
                return $p;
            }, $response->json());

            return response()->json([
                'success' => true,
                'data'    => $products,
            ])->withHeaders($this->corsHeaders());
        }

        return response()->json([
            'success' => false,
            'error'   => 'Lỗi khi tải danh sách sản phẩm',
            'details' => $response->json()
        ], $response->status())->withHeaders($this->corsHeaders());
    }

    // Xem chi tiết 1 sản phẩm
    public function show($id)
    {
        $response = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders())
            ->get("{$this->baseUrl()}/rest/v1/products?id=eq.{$id}&select=*,product_categories(name)");

        if ($response->successful()) {
            $data = $response->json();
            if (count($data) > 0) {
                $product = $data[0];
                $product['category'] = isset($product['product_categories']['name']) ? $product['product_categories']['name'] : 'Mỹ phẩm thảo mộc';
                $product['stock'] = $product['stock_quantity'] ?? 0;
                unset($product['product_categories']);

                return response()->json([
                    'success' => true,
                    'data'    => $product,
                ])->withHeaders($this->corsHeaders());
            }
            return response()->json(['success' => false, 'error' => 'Không tìm thấy sản phẩm'], 404)->withHeaders($this->corsHeaders());
        }

        return response()->json([
            'success' => false,
            'error'   => 'Lỗi khi tải chi tiết sản phẩm',
            'details' => $response->json()
        ], $response->status())->withHeaders($this->corsHeaders());
    }

    // POST /api/products — Thêm sản phẩm mới
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'              => 'required|string|max:255',
            'short_description' => 'nullable|string|max:500',
            'description'       => 'nullable|string',
            'price'             => 'required|numeric|min:0',
            'stock_quantity'    => 'nullable|integer|min:0',
            'image_url'         => 'nullable|string',
            'is_active'         => 'boolean',
        ]);

        if (!isset($validated['is_active'])) {
            $validated['is_active'] = true;
        }

        $headers = $this->supabaseHeaders();
        $headers['Prefer'] = 'return=representation';

        $response = Http::withoutVerifying()
            ->withHeaders($headers)
            ->post("{$this->baseUrl()}/rest/v1/products", $validated);

        if ($response->successful()) {
            return response()->json([
                'success' => true,
                'message' => 'Thêm sản phẩm thành công',
                'data'    => $response->json()[0] ?? $response->json()
            ], 201)->withHeaders($this->corsHeaders());
        }

        return response()->json([
            'success' => false,
            'error'   => 'Lỗi khi thêm sản phẩm',
            'details' => $response->json()
        ], $response->status())->withHeaders($this->corsHeaders());
    }

    // PATCH /api/products/{id} — Cập nhật sản phẩm
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name'              => 'sometimes|string|max:255',
            'short_description' => 'nullable|string|max:500',
            'description'       => 'nullable|string',
            'price'             => 'sometimes|numeric|min:0',
            'stock_quantity'    => 'nullable|integer|min:0',
            'image_url'         => 'nullable|string',
            'is_active'         => 'sometimes|boolean',
        ]);

        $headers = $this->supabaseHeaders();
        $headers['Prefer'] = 'return=representation';

        $response = Http::withoutVerifying()
            ->withHeaders($headers)
            ->patch("{$this->baseUrl()}/rest/v1/products?id=eq.{$id}", $validated);

        if ($response->successful()) {
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật sản phẩm thành công',
                'data'    => $response->json()[0] ?? $response->json()
            ])->withHeaders($this->corsHeaders());
        }

        return response()->json([
            'success' => false,
            'error'   => 'Lỗi khi cập nhật sản phẩm',
            'details' => $response->json()
        ], $response->status())->withHeaders($this->corsHeaders());
    }

    // DELETE /api/products/{id} — Xóa sản phẩm
    public function destroy($id)
    {
        $response = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders())
            ->delete("{$this->baseUrl()}/rest/v1/products?id=eq.{$id}");

        if ($response->successful()) {
            return response()->json([
                'success' => true,
                'message' => 'Xóa sản phẩm thành công'
            ])->withHeaders($this->corsHeaders());
        }

        return response()->json([
            'success' => false,
            'error'   => 'Lỗi khi xóa sản phẩm',
            'details' => $response->json()
        ], $response->status())->withHeaders($this->corsHeaders());
    }
}

