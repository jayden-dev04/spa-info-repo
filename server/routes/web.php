<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SupabaseUserController;
use App\Http\Controllers\SupabaseAppointmentController;

Route::get('/', function () {
    return view('welcome');
});

// Users API (Proxies to Supabase)
Route::get('/api/users', [SupabaseUserController::class, 'index']);
Route::post('/api/users', [SupabaseUserController::class, 'store']);
Route::options('/api/users', function() { return response('', 204)->withHeaders(['Access-Control-Allow-Origin' => '*', 'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS, PUT, DELETE', 'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With']); });

// Appointments API (Proxies to Supabase and sends Email)
Route::post('/api/appointments', [SupabaseAppointmentController::class, 'store']);
Route::options('/api/appointments', function() { return response('', 204)->withHeaders(['Access-Control-Allow-Origin' => '*', 'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS, PUT, DELETE', 'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With']); });
