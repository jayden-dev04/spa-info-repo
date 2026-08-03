<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SupabaseUserController extends Controller
{
    private function getCorsHeaders()
    {
        return [
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS, PUT, DELETE',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With',
        ];
    }

    private function getSupabaseHeaders()
    {
        $key = env('SUPABASE_KEY');
        return [
            'apikey' => $key,
            'Authorization' => 'Bearer ' . $key,
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation'
        ];
    }

    /**
     * Get all users from Supabase users table
     */
    public function index()
    {
        $baseUrl = env('SUPABASE_URL');
        $endpoint = "{$baseUrl}/rest/v1/users?select=*&order=created_at.desc";

        $response = Http::withoutVerifying()
            ->withHeaders($this->getSupabaseHeaders())
            ->get($endpoint);

        if ($response->successful()) {
            return response()->json([
                'success' => true,
                'supabase_url' => $baseUrl,
                'count' => count($response->json()),
                'data' => $response->json()
            ])->withHeaders($this->getCorsHeaders());
        }

        return response()->json([
            'success' => false,
            'error' => $response->json(),
            'status' => $response->status()
        ], $response->status())->withHeaders($this->getCorsHeaders());
    }

    /**
     * Create a new user in Supabase users table
     */
    public function store(Request $request)
    {
        $baseUrl = env('SUPABASE_URL');
        $endpoint = "{$baseUrl}/rest/v1/users";

        $payload = [
            'email' => $request->input('email', 'user_' . time() . '@example.com'),
            'full_name' => $request->input('full_name', 'Anonymous User'),
            'role' => $request->input('role', 'user')
        ];

        $response = Http::withoutVerifying()
            ->withHeaders($this->getSupabaseHeaders())
            ->post($endpoint, $payload);

        if ($response->successful()) {
            return response()->json([
                'success' => true,
                'message' => 'User created successfully on Supabase via Laravel Backend!',
                'data' => $response->json()
            ], 201)->withHeaders($this->getCorsHeaders());
        }

        return response()->json([
            'success' => false,
            'error' => $response->json(),
            'status' => $response->status()
        ], $response->status())->withHeaders($this->getCorsHeaders());
    }
}
