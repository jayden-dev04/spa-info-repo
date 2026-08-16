<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use App\Mail\AppointmentConfirmed;

class SupabaseAppointmentController extends Controller
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

    public function store(Request $request)
    {
        $baseUrl = env('SUPABASE_URL');
        $endpoint = "{$baseUrl}/rest/v1/appointments";

        $payload = $request->only([
            'user_id', 'service_id', 'customer_name', 'customer_email', 
            'customer_phone', 'appointment_date', 'notes'
        ]);

        // Validate basic fields
        if (empty($payload['customer_name']) || empty($payload['customer_email']) || empty($payload['appointment_date'])) {
            return response()->json(['error' => 'Missing required fields'], 400)->withHeaders($this->getCorsHeaders());
        }

        // Save to Supabase
        $response = Http::withoutVerifying()
            ->withHeaders($this->getSupabaseHeaders())
            ->post($endpoint, $payload);

        if ($response->successful()) {
            $appointment = $response->json();
            
            // Send Email Notification
            try {
                Mail::to($payload['customer_email'])->send(new AppointmentConfirmed($payload));
            } catch (\Exception $e) {
                // Log email error but don't fail the request
                \Log::error('Mail error: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Appointment booked successfully!',
                'data' => $appointment
            ], 201)->withHeaders($this->getCorsHeaders());
        }

        return response()->json([
            'success' => false,
            'error' => $response->json(),
            'status' => $response->status()
        ], $response->status())->withHeaders($this->getCorsHeaders());
    }
}
