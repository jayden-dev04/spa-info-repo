<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GeoController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\RssController;
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
            'GET /rss'               => 'RSS 2.0 feed blog posts (alias /api/rss)',
        ],
    ]);
});

// ---------------------------------------------------------------------------
// Auth API — backend kiểm tra role sau khi client đăng nhập Google
// ---------------------------------------------------------------------------

// POST /api/auth/exchange — đổi access_token lấy profile + role (role do backend quyết định)
Route::post('/api/auth/exchange', [AuthController::class, 'exchange']);

// ---------------------------------------------------------------------------
// Dev tool (CHỈ APP_ENV=local): dán secret key 1 lần vào form local → migrate/seed
// ---------------------------------------------------------------------------
Route::get('/dev/tool', [\App\Http\Controllers\DevToolController::class, 'form']);
Route::post('/dev/tool/key', [\App\Http\Controllers\DevToolController::class, 'saveKey']);
Route::get('/dev/tool/migrate', [\App\Http\Controllers\DevToolController::class, 'migrate']);
Route::get('/dev/tool/seed', [\App\Http\Controllers\DevToolController::class, 'seed']);
Route::get('/dev/tool/status', [\App\Http\Controllers\DevToolController::class, 'status']);

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
// RSS Feed API — blog posts (public, không cần auth)
// ---------------------------------------------------------------------------

// GET /rss     — RSS 2.0 XML feed của blog posts
Route::get('/rss', [RssController::class, 'index']);

// GET /api/rss — alias cho /rss
Route::get('/api/rss', [RssController::class, 'index']);

// ---------------------------------------------------------------------------
// Appointments API
// ---------------------------------------------------------------------------

// POST   /api/appointments      — Khách đặt lịch (guest, không cần đăng nhập)
Route::post('/api/appointments', [AppointmentController::class, 'store']);

// GET    /api/appointments      — Admin lấy danh sách lịch hẹn (?status=pending)
Route::get('/api/appointments', [AppointmentController::class, 'index'])
    ->middleware('admin.token');

// PATCH  /api/appointments/{id} — Admin cập nhật trạng thái lịch hẹn
Route::patch('/api/appointments/{id}', [AppointmentController::class, 'updateStatus'])
    ->middleware('admin.token');

// ---------------------------------------------------------------------------
// Orders API (E-Commerce)
// ---------------------------------------------------------------------------

// POST   /api/orders            — Khách đặt hàng từ giỏ hàng
Route::post('/api/orders', [OrderController::class, 'store']);

// GET    /api/orders            — Admin lấy danh sách đơn hàng (?status=pending)
Route::get('/api/orders', [OrderController::class, 'index'])
    ->middleware('admin.token');

// PATCH  /api/orders/{id}       — Admin cập nhật trạng thái đơn hàng (shipped, completed, cancelled)
Route::patch('/api/orders/{id}', [OrderController::class, 'updateStatus'])
    ->middleware('admin.token');
// Services API
// ---------------------------------------------------------------------------
// AI Chat trợ lý ảo (status + POST messages)
Route::get('/api/ai-chat/status', [\App\Http\Controllers\AiChatController::class, 'status']);
Route::post('/api/ai-chat', [\App\Http\Controllers\AiChatController::class, 'chat']);

Route::get('/api/services', [ServiceController::class, 'index']);
Route::post('/api/services', [ServiceController::class, 'store']);
Route::patch('/api/services/{id}', [ServiceController::class, 'update']);
Route::delete('/api/services/{id}', [ServiceController::class, 'destroy']);

// ---------------------------------------------------------------------------
// Geo API — tỉnh/thành + phường/xã Việt Nam (dữ liệu provinces.open-api.vn v2,
// lưu trong Supabase: vietnam_provinces / vietnam_wards)
// ---------------------------------------------------------------------------

// GET /api/geo/provinces — 34 tỉnh/thành
Route::get('/api/geo/provinces', [GeoController::class, 'provinces']);
// GET /api/geo/wards?province=79 — phường/xã theo tỉnh
Route::get('/api/geo/wards', [GeoController::class, 'wards']);
// GET /api/geo/sync — đồng bộ dữ liệu mới từ API nguồn vào Supabase
Route::get('/api/geo/sync', [GeoController::class, 'sync']);