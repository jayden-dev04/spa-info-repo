<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AppointmentController;

Route::get('/', function () {
    return view('welcome');
});

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
