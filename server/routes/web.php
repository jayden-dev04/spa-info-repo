<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SupabaseUserController;

Route::get('/', function () {
    return view('welcome');
});

// Supabase Users API Endpoints
Route::get('/api/users', [SupabaseUserController::class, 'index']);
Route::post('/api/users', [SupabaseUserController::class, 'store']);
