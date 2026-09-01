<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ServiceController;

Route::get('/', function () {
    return response()->json([
        'name'        => 'Eva Spa REST API Engine',
        'status'      => 'online',
        'version'     => '1.0.0',
        'framework'   => 'Laravel 12 (PHP 8.4)',
        'endpoints'   => [
            'POST /api/appointments' => 'Tạo lịch hẹn mới',
            'GET /api/appointments'  => 'Lấy danh sách lịch hẹn',
            'PATCH /api/appointments/{id}' => 'Cập nhật trạng thái lịch hẹn',
            'POST /api/orders'       => 'Tạo đơn hàng mới',
            'GET /api/orders'        => 'Lấy danh sách đơn hàng',
            'PATCH /api/orders/{id}' => 'Cập nhật trạng thái đơn hàng',
        ],
    ]);
});

// ---------------------------------------------------------------------------
// Auth API — backend kiểm tra role sau khi client đăng nhập Google
// ---------------------------------------------------------------------------

// POST /api/auth/exchange — đổi access_token lấy profile + role (role do backend quyết định)
Route::post('/api/auth/exchange', [AuthController::class, 'exchange']);

// ---------------------------------------------------------------------------
// CORS Preflight OPTIONS handler (dùng chung cho tất cả /api/* routes)
// ---------------------------------------------------------------------------
$corsHeaders = [
    'Access-Control-Allow-Origin'  => '*',
    'Access-Control-Allow-Methods' => 'GET, POST, PATCH, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, X-User-Id',
];

Route::options('/api/{any}', function () use ($corsHeaders) {
    return response('', 204)->withHeaders($corsHeaders);
})->where('any', '.*');

// ---------------------------------------------------------------------------
// Appointments API
// ---------------------------------------------------------------------------

// POST   /api/appointments      — Khách đặt lịch (guest, không cần đăng nhập)
Route::post('/api/appointments', [AppointmentController::class, 'store']);

// GET    /api/appointments      — Admin lấy danh sách lịch hẹn (?status=pending)
Route::get('/api/appointments', [AppointmentController::class, 'index']);

// PATCH  /api/appointments/{id} — Admin cập nhật trạng thái lịch hẹn
Route::patch('/api/appointments/{id}', [AppointmentController::class, 'updateStatus']);

// ---------------------------------------------------------------------------
// Orders API (E-Commerce)
// ---------------------------------------------------------------------------

// POST   /api/orders            — Khách đặt hàng từ giỏ hàng
Route::post('/api/orders', [OrderController::class, 'store']);

// GET    /api/orders            — Admin lấy danh sách đơn hàng (?status=pending)
Route::get('/api/orders', [OrderController::class, 'index']);

// PATCH  /api/orders/{id}       — Admin cập nhật trạng thái đơn hàng (shipped, completed, cancelled)
Route::patch('/api/orders/{id}', [OrderController::class, 'updateStatus']);
// Services API
// ---------------------------------------------------------------------------
Route::get('/api/services', [ServiceController::class, 'index']);
Route::post('/api/services', [ServiceController::class, 'store']);
Route::patch('/api/services/{id}', [ServiceController::class, 'update']);
Route::delete('/api/services/{id}', [ServiceController::class, 'destroy']);
