<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\OrderPlaced;

class OrderController extends Controller
{
    private function corsHeaders(): array
    {
        return [
            'Access-Control-Allow-Origin'  => '*',
            'Access-Control-Allow-Methods' => 'GET, POST, PATCH, OPTIONS, PUT, DELETE',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, X-User-Id',
        ];
    }

    private function supabaseHeaders(bool $serviceRole = false): array
    {
        $key = $serviceRole
            ? (env('SUPABASE_SECRET_KEY') ?: env('SUPABASE_KEY'))
            : (env('SUPABASE_PUBLISHABLE_KEY') ?: env('SUPABASE_KEY'));

        return [
            'apikey'        => $key,
            'Authorization' => 'Bearer ' . $key,
            'Content-Type'  => 'application/json',
            'Prefer'        => 'return=representation',
        ];
    }

    private function baseUrl(): string
    {
        return rtrim(env('SUPABASE_URL'), '/');
    }

    // =========================================================================
    // POST /api/orders — Tạo đơn hàng mới từ giỏ hàng
    // =========================================================================
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name'    => 'required|string|max:255',
            'customer_phone'   => 'required|string|max:20',
            'customer_email'   => 'required|email|max:255',
            'customer_address' => 'required|string|max:500',
            'total_amount'     => 'required|numeric|min:0',
            'shipping_fee'     => 'nullable|numeric|min:0',
            'payment_method'   => 'nullable|string|in:cod,vietqr',
            'notes'            => 'nullable|string|max:1000',
            'order_code'       => 'nullable|string|max:50',
            'items'            => 'nullable|array',
        ]);

        $orderCode = $validated['order_code'] ?? ('EVA' . rand(100000, 999999));

        // 1. Insert order vào bảng orders
        $orderRes = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders(true))
            ->post("{$this->baseUrl()}/rest/v1/orders", array_merge([
                'customer_name'    => $validated['customer_name'],
                'customer_email'   => $validated['customer_email'],
                'customer_phone'   => $validated['customer_phone'],
                'customer_address' => $validated['customer_address'],
                'total_amount'     => $validated['total_amount'],
                'status'           => 'pending',
            ], isset($validated['shipping_fee']) ? ['shipping_fee' => $validated['shipping_fee']] : [],
            isset($validated['payment_method']) ? ['payment_method' => $validated['payment_method']] : [],
            isset($validated['notes']) ? ['notes' => $validated['notes']] : [],
            ['order_code' => $orderCode]));

        if (!$orderRes->successful()) {
            Log::error('Insert order failed', [
                'body'   => $orderRes->json(),
                'status' => $orderRes->status(),
            ]);

            return response()->json([
                'success' => false,
                'error'   => 'Không thể lưu đơn hàng vào hệ thống. Vui lòng thử lại.',
            ], 500)->withHeaders($this->corsHeaders());
        }

        $orderData = $orderRes->json()[0] ?? $orderRes->json();
        $orderId   = $orderData['id'] ?? null;

        // 2. Insert order_items và trừ stock sản phẩm
        $items = $request->input('items', []);
        if ($orderId && !empty($items) && is_array($items)) {
            $itemsToInsert = [];

            foreach ($items as $item) {
                $prodId = $item['product_id'] ?? null;
                $isUuid = is_string($prodId) && Str::isUuid($prodId);

                $itemsToInsert[] = [
                    'order_id'   => $orderId,
                    'product_id' => $isUuid ? $prodId : null,
                    'quantity'   => (int) ($item['quantity'] ?? 1),
                    'price'      => (float) ($item['price'] ?? 0),
                ];

                // Trừ stock nếu là UUID sản phẩm
                if ($isUuid) {
                    try {
                        $prodRes = Http::withoutVerifying()
                            ->withHeaders($this->supabaseHeaders(true))
                            ->get("{$this->baseUrl()}/rest/v1/products?id=eq.{$prodId}&select=stock&limit=1");

                        if ($prodRes->successful() && !empty($prodRes->json())) {
                            $currentStock = (int) ($prodRes->json()[0]['stock'] ?? 0);
                            $newStock = max(0, $currentStock - (int) ($item['quantity'] ?? 1));

                            Http::withoutVerifying()
                                ->withHeaders($this->supabaseHeaders(true))
                                ->patch("{$this->baseUrl()}/rest/v1/products?id=eq.{$prodId}", [
                                    'stock' => $newStock,
                                ]);
                        }
                    } catch (\Exception $e) {
                        Log::warning("Could not update stock for product {$prodId}: " . $e->getMessage());
                    }
                }
            }

            if (!empty($itemsToInsert)) {
                try {
                    Http::withoutVerifying()
                        ->withHeaders($this->supabaseHeaders(true))
                        ->post("{$this->baseUrl()}/rest/v1/order_items", $itemsToInsert);
                } catch (\Exception $e) {
                    Log::warning('Could not insert order_items: ' . $e->getMessage());
                }
            }
        }

        // 3. Gửi email xác nhận đơn hàng
        try {
            Mail::to($validated['customer_email'])->send(new OrderPlaced([
                'order_code'       => $orderCode,
                'customer_name'    => $validated['customer_name'],
                'customer_phone'   => $validated['customer_phone'],
                'customer_email'   => $validated['customer_email'],
                'customer_address' => $validated['customer_address'],
                'total_amount'     => $validated['total_amount'],
                'shipping_fee'     => $request->input('shipping_fee', 0),
                'payment_method'   => $validated['payment_method'] ?? 'vietqr',
                'notes'            => $validated['notes'] ?? '',
                'items'            => $items,
            ]));
        } catch (\Exception $e) {
            Log::error('Order confirmation email failed: ' . $e->getMessage());
        }

        return response()->json([
            'success'    => true,
            'message'    => 'Đặt hàng thành công! Hóa đơn điện tử đã được gửi về email của bạn.',
            'order_code' => $orderCode,
            'data'       => $orderData,
        ], 201)->withHeaders($this->corsHeaders());
    }

    // =========================================================================
    // GET /api/orders — Lấy danh sách đơn hàng cho Admin
    // =========================================================================
    public function index(Request $request)
    {
        $status = $request->query('status');

        $query = "{$this->baseUrl()}/rest/v1/orders?select=*,order_items(*,products(name,image_url))&order=created_at.desc";
        if ($status && $status !== 'all') {
            $query .= "&status=eq.{$status}";
        }

        $res = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders(true))
            ->get($query);

        if ($res->successful()) {
            return response()->json([
                'success' => true,
                'count'   => count($res->json()),
                'data'    => $res->json(),
            ])->withHeaders($this->corsHeaders());
        }

        return response()->json([
            'success' => false,
            'error'   => $res->json(),
        ], $res->status())->withHeaders($this->corsHeaders());
    }

    // =========================================================================
    // PATCH /api/orders/{id} — Admin cập nhật trạng thái đơn hàng
    // =========================================================================
    public function updateStatus(Request $request, string $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered,completed,cancelled',
        ]);

        $newStatus = $validated['status'];

        // Lấy thông tin đơn hiện tại
        $currentRes = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders(true))
            ->get("{$this->baseUrl()}/rest/v1/orders?id=eq.{$id}&select=*,order_items(*,products(name))&limit=1");

        if (!$currentRes->successful() || empty($currentRes->json())) {
            return response()->json([
                'success' => false,
                'error'   => 'Không tìm thấy đơn hàng.',
            ], 404)->withHeaders($this->corsHeaders());
        }

        $current   = $currentRes->json()[0];
        $oldStatus = $current['status'];

        // Update status
        $updateRes = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders(true))
            ->patch("{$this->baseUrl()}/rest/v1/orders?id=eq.{$id}", [
                'status' => $newStatus,
            ]);

        if (!$updateRes->successful()) {
            return response()->json([
                'success' => false,
                'error'   => 'Không thể cập nhật trạng thái đơn hàng.',
            ], 500)->withHeaders($this->corsHeaders());
        }

        // Ghi activity log
        $actorId = $request->header('X-User-Id');
        try {
            Http::withoutVerifying()
                ->withHeaders($this->supabaseHeaders(true))
                ->post("{$this->baseUrl()}/rest/v1/activity_logs", [
                    'user_id' => $actorId ?: null,
                    'action'  => 'UPDATE_ORDER_STATUS',
                    'details' => [
                        'order_id'   => $id,
                        'old_status' => $oldStatus,
                        'new_status' => $newStatus,
                    ],
                ]);
        } catch (\Exception $e) {
            Log::warning('Activity log error: ' . $e->getMessage());
        }

        // Gửi email thông báo cho khách khi đơn giao hoặc hoàn tất/hủy
        if (in_array($newStatus, ['shipped', 'completed', 'cancelled']) && !empty($current['customer_email'])) {
            try {
                $items = array_map(function ($oi) {
                    return [
                        'name'     => $oi['products']['name'] ?? 'Sản phẩm thảo mộc',
                        'quantity' => $oi['quantity'] ?? 1,
                        'price'    => $oi['price'] ?? 0,
                    ];
                }, $current['order_items'] ?? []);

                Mail::to($current['customer_email'])->send(new OrderPlaced([
                    'order_code'       => 'EVA' . substr($id, 0, 6),
                    'customer_name'    => $current['customer_name'],
                    'customer_phone'   => $current['customer_phone'],
                    'customer_email'   => $current['customer_email'],
                    'customer_address' => $current['customer_address'],
                    'total_amount'     => $current['total_amount'],
                    'shipping_fee'     => 0,
                    'payment_method'   => 'cod',
                    'notes'            => '',
                    'items'            => $items,
                    'status_update'    => $newStatus,
                ]));
            } catch (\Exception $e) {
                Log::error('Order status update email error: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Cập nhật trạng thái đơn hàng thành '{$newStatus}' thành công.",
            'data'    => [
                'id'         => $id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ],
        ])->withHeaders($this->corsHeaders());
    }
}
