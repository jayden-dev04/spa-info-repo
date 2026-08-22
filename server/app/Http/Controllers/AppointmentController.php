<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\AppointmentConfirmed;

class AppointmentController extends Controller
{
    // -------------------------------------------------------------------------
    // Hardcoded service map: form value (int) → service info
    // ID phải khớp với thứ tự insert trong bảng services (int4 auto-increment)
    // -------------------------------------------------------------------------
    private array $serviceMap = [
        1 => [
            'name'     => 'Gội Đầu Dưỡng Sinh Thảo Dược (60–75 phút)',
            'price'    => 199000,
            'duration' => 70,
        ],
        2 => [
            'name'     => 'Chăm Sóc & Phục Hồi Da Thảo Mộc (75 phút)',
            'price'    => 350000,
            'duration' => 75,
        ],
        3 => [
            'name'     => 'Massage Body Đá Nóng Himalaya (90 phút)',
            'price'    => 420000,
            'duration' => 90,
        ],
        4 => [
            'name'     => 'Combo Thư Giãn Toàn Diện: Gội Đầu + Massage Body',
            'price'    => 550000,
            'duration' => 135,
        ],
        5 => [
            'name'     => 'Xông Hơi Thảo Dược Hoàng Cung & Ngâm Chân',
            'price'    => 150000,
            'duration' => 45,
        ],
    ];

    // -------------------------------------------------------------------------
    // Shared helpers
    // -------------------------------------------------------------------------

    private function corsHeaders(): array
    {
        return [
            'Access-Control-Allow-Origin'  => '*',
            'Access-Control-Allow-Methods' => 'GET, POST, PATCH, OPTIONS, PUT, DELETE',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, X-User-Id',
        ];
    }

    /**
     * Build Supabase request headers.
     * $serviceRole = true  → dùng SUPABASE_SECRET_KEY (bypass RLS, tạo user)
     * $serviceRole = false → dùng SUPABASE_PUBLISHABLE_KEY (read-only public)
     */
    private function supabaseHeaders(bool $serviceRole = false): array
    {
        $key = $serviceRole
            ? env('SUPABASE_SECRET_KEY')
            : env('SUPABASE_PUBLISHABLE_KEY');

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
    // POST /api/appointments — Đặt lịch (Guest, không cần đăng nhập)
    // =========================================================================
    public function store(Request $request)
    {
        // ------------------------------------------------------------------
        // 1. Validate input
        // ------------------------------------------------------------------
        $validated = $request->validate([
            'customer_name'    => 'required|string|max:255',
            'customer_phone'   => 'required|string|max:20',
            'customer_email'   => 'required|email|max:255',
            'appointment_date' => 'required|string',   // "2026-08-25T10:00" (datetime-local)
            'service_id'       => 'required|integer|in:1,2,3,4,5',
            'notes'            => 'nullable|string|max:1000',
        ]);

        $serviceId = (int) $validated['service_id'];
        $service   = $this->serviceMap[$serviceId];

        // ------------------------------------------------------------------
        // 2. Tách datetime-local → appointment_date, start_time, end_time
        // ------------------------------------------------------------------
        $dt        = Carbon::parse($validated['appointment_date']);
        $aptDate   = $dt->toDateString();                              // "2026-08-25"
        $startTime = $dt->format('H:i:s');                            // "10:00:00"
        $endTime   = $dt->copy()->addMinutes($service['duration'])
                         ->format('H:i:s');                           // "11:10:00"

        // ------------------------------------------------------------------
        // 3. Tạo mật khẩu tạm thời (gửi cho khách qua email)
        // ------------------------------------------------------------------
        $tempPassword = ucfirst(Str::random(8)) . rand(10, 99) . '!';

        // ------------------------------------------------------------------
        // 4. Tạo tài khoản Supabase Auth qua Admin API
        //    Dùng SUPABASE_SECRET_KEY (service_role) để bypass RLS
        // ------------------------------------------------------------------
        $authRes = Http::withoutVerifying()
            ->withHeaders([
                'apikey'        => env('SUPABASE_SECRET_KEY'),
                'Authorization' => 'Bearer ' . env('SUPABASE_SECRET_KEY'),
                'Content-Type'  => 'application/json',
            ])
            ->post("{$this->baseUrl()}/auth/v1/admin/users", [
                'email'         => $validated['customer_email'],
                'password'      => $tempPassword,
                'email_confirm' => true,                  // xác nhận email tự động
                'user_metadata' => [
                    'full_name' => $validated['customer_name'],
                ],
            ]);

        $isNewUser = true;
        $clientId  = null;

        if ($authRes->successful()) {
            // Tài khoản mới được tạo thành công
            $clientId = $authRes->json()['id'];
        } else {
            $errBody = $authRes->json();
            $errMsg  = $errBody['msg'] ?? ($errBody['message'] ?? '');

            // Nếu email đã tồn tại → tìm user_id trong public.users
            if (str_contains(strtolower($errMsg), 'already registered')
                || str_contains(strtolower($errMsg), 'already been registered')
                || $authRes->status() === 422) {
                $isNewUser = false;

                $userRes = Http::withoutVerifying()
                    ->withHeaders($this->supabaseHeaders(true))
                    ->get("{$this->baseUrl()}/rest/v1/users", [
                        'email'  => 'eq.' . $validated['customer_email'],
                        'select' => 'id',
                        'limit'  => 1,
                    ]);

                if ($userRes->successful() && !empty($userRes->json())) {
                    $clientId = $userRes->json()[0]['id'];
                } else {
                    return response()->json([
                        'success' => false,
                        'error'   => 'Email đã được đăng ký nhưng không tìm thấy thông tin tài khoản. Vui lòng liên hệ spa.',
                    ], 422)->withHeaders($this->corsHeaders());
                }
            } else {
                Log::error('Supabase Auth create user failed', ['body' => $errBody, 'status' => $authRes->status()]);
                return response()->json([
                    'success' => false,
                    'error'   => 'Không thể tạo tài khoản. Vui lòng thử lại sau.',
                ], 500)->withHeaders($this->corsHeaders());
            }
        }

        // ------------------------------------------------------------------
        // 5. Cập nhật public.users: phone, full_name, account_source
        //    Trigger handle_new_user() đã tạo row cơ bản, ta chỉ UPDATE thêm
        // ------------------------------------------------------------------
        if ($isNewUser) {
            // Chờ trigger fire (trigger PostgreSQL là đồng bộ, nhưng một số
            // trường hợp cần nhỏ delay do network latency với Supabase)
            usleep(250000); // 250ms

            $updateRes = Http::withoutVerifying()
                ->withHeaders($this->supabaseHeaders(true))
                ->patch("{$this->baseUrl()}/rest/v1/users?id=eq.{$clientId}", [
                    'full_name'      => $validated['customer_name'],
                    'phone'          => $validated['customer_phone'],
                    'account_source' => 'guest_booking',
                ]);

            if (!$updateRes->successful()) {
                Log::warning('Could not update public.users after auth create', [
                    'client_id' => $clientId,
                    'response'  => $updateRes->json(),
                ]);
            }
        }

        // ------------------------------------------------------------------
        // 6. Insert lịch hẹn vào bảng appointments
        // ------------------------------------------------------------------
        $appointmentRes = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders(true))
            ->post("{$this->baseUrl()}/rest/v1/appointments", [
                'client_id'        => $clientId,
                'service_id'       => $serviceId,       // int4
                'appointment_date' => $aptDate,
                'start_time'       => $startTime,
                'end_time'         => $endTime,
                'total_price'      => $service['price'],
                'status'           => 'pending',
                'note'             => $validated['notes'] ?? null,
            ]);

        if (!$appointmentRes->successful()) {
            Log::error('Insert appointment failed', [
                'body'   => $appointmentRes->json(),
                'status' => $appointmentRes->status(),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'Không thể lưu lịch hẹn. Vui lòng thử lại.',
                'detail'  => $appointmentRes->json(),
            ], 500)->withHeaders($this->corsHeaders());
        }

        $appointment = $appointmentRes->json()[0] ?? $appointmentRes->json();

        // ------------------------------------------------------------------
        // 7. Ghi activity_log (không block nếu lỗi)
        // ------------------------------------------------------------------
        try {
            Http::withoutVerifying()
                ->withHeaders($this->supabaseHeaders(true))
                ->post("{$this->baseUrl()}/rest/v1/activity_logs", [
                    'user_id' => $clientId,
                    'action'  => 'CREATE_APPOINTMENT',
                    'details' => [
                        'appointment_id'   => $appointment['id'] ?? null,
                        'service_id'       => $serviceId,
                        'service_name'     => $service['name'],
                        'appointment_date' => $aptDate,
                        'start_time'       => $startTime,
                    ],
                ]);
        } catch (\Exception $e) {
            Log::warning('activity_log insert failed: ' . $e->getMessage());
        }

        // ------------------------------------------------------------------
        // 8. Gửi email xác nhận (kèm thông tin đăng nhập nếu là user mới)
        // ------------------------------------------------------------------
        try {
            Mail::to($validated['customer_email'])->send(new AppointmentConfirmed([
                'name'         => $validated['customer_name'],
                'phone'        => $validated['customer_phone'],
                'email'        => $validated['customer_email'],
                'service_name' => $service['name'],
                'price'        => $service['price'],
                'date'         => $aptDate,
                'start_time'   => $startTime,
                'end_time'     => $endTime,
                'note'         => $validated['notes'] ?? '',
                'is_new_user'  => $isNewUser,
                'password'     => $isNewUser ? $tempPassword : null,
            ]));
        } catch (\Exception $e) {
            Log::error('Booking confirmation email failed: ' . $e->getMessage());
            // Không fail request vì mail chỉ là secondary
        }

        return response()->json([
            'success' => true,
            'message' => 'Đặt lịch thành công! Thông tin xác nhận đã được gửi về email của bạn.',
            'data'    => $appointment,
        ], 201)->withHeaders($this->corsHeaders());
    }

    // =========================================================================
    // PATCH /api/appointments/{id} — Admin cập nhật trạng thái lịch hẹn
    // =========================================================================
    public function updateStatus(Request $request, string $id)
    {
        // ------------------------------------------------------------------
        // 1. Validate
        // ------------------------------------------------------------------
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,rejected,completed,cancelled',
        ]);

        $newStatus = $validated['status'];

        // ------------------------------------------------------------------
        // 2. Lấy thông tin lịch hẹn hiện tại (để log old_status và gửi mail)
        // ------------------------------------------------------------------
        $currentRes = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders(true))
            ->get("{$this->baseUrl()}/rest/v1/appointments?id=eq.{$id}&select=*&limit=1");

        if (!$currentRes->successful() || empty($currentRes->json())) {
            return response()->json([
                'success' => false,
                'error'   => 'Không tìm thấy lịch hẹn.',
            ], 404)->withHeaders($this->corsHeaders());
        }

        $current   = $currentRes->json()[0];
        $oldStatus = $current['status'];

        // ------------------------------------------------------------------
        // 3. Cập nhật status trong Supabase
        // ------------------------------------------------------------------
        $updateRes = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders(true))
            ->patch("{$this->baseUrl()}/rest/v1/appointments?id=eq.{$id}", [
                'status' => $newStatus,
            ]);

        if (!$updateRes->successful()) {
            Log::error('Update appointment status failed', [
                'id'     => $id,
                'status' => $updateRes->status(),
                'body'   => $updateRes->json(),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'Không thể cập nhật trạng thái lịch hẹn.',
            ], 500)->withHeaders($this->corsHeaders());
        }

        // ------------------------------------------------------------------
        // 4. Ghi activity_log
        //    X-User-Id header: client gửi UUID của admin/staff đang đăng nhập
        // ------------------------------------------------------------------
        $actorId = $request->header('X-User-Id');
        try {
            Http::withoutVerifying()
                ->withHeaders($this->supabaseHeaders(true))
                ->post("{$this->baseUrl()}/rest/v1/activity_logs", [
                    'user_id' => $actorId ?: null,
                    'action'  => 'UPDATE_APPOINTMENT_STATUS',
                    'details' => [
                        'appointment_id' => $id,
                        'old_status'     => $oldStatus,
                        'new_status'     => $newStatus,
                        'client_id'      => $current['client_id'],
                    ],
                ]);
        } catch (\Exception $e) {
            Log::warning('activity_log insert failed: ' . $e->getMessage());
        }

        // ------------------------------------------------------------------
        // 5. Gửi email thông báo cho khách khi confirmed hoặc cancelled
        // ------------------------------------------------------------------
        if (in_array($newStatus, ['confirmed', 'cancelled', 'rejected'])) {
            try {
                // Lấy email khách từ bảng users
                $userRes = Http::withoutVerifying()
                    ->withHeaders($this->supabaseHeaders(true))
                    ->get("{$this->baseUrl()}/rest/v1/users?id=eq.{$current['client_id']}&select=email,full_name&limit=1");

                if ($userRes->successful() && !empty($userRes->json())) {
                    $user         = $userRes->json()[0];
                    $serviceInfo  = $this->serviceMap[$current['service_id']] ?? null;

                    Mail::to($user['email'])->send(new AppointmentConfirmed([
                        'name'         => $user['full_name'] ?? 'Quý khách',
                        'phone'        => '',
                        'email'        => $user['email'],
                        'service_name' => $serviceInfo['name'] ?? 'Dịch vụ tại Eva Spa',
                        'price'        => $current['total_price'],
                        'date'         => $current['appointment_date'],
                        'start_time'   => $current['start_time'],
                        'end_time'     => $current['end_time'],
                        'note'         => $current['note'] ?? '',
                        'is_new_user'  => false,
                        'password'     => null,
                        'status_update' => $newStatus,   // 'confirmed' | 'cancelled' | 'rejected'
                    ]));
                }
            } catch (\Exception $e) {
                Log::error('Status update email failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Cập nhật trạng thái lịch hẹn thành '{$newStatus}' thành công.",
            'data'    => [
                'id'         => $id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ],
        ])->withHeaders($this->corsHeaders());
    }

    // =========================================================================
    // GET /api/appointments — Lấy danh sách lịch hẹn (Admin)
    // =========================================================================
    public function index(Request $request)
    {
        $status = $request->query('status'); // optional filter: ?status=pending

        // Join với bảng users thông qua foreign key (thường bảng users tham chiếu qua client_id)
        $query = "{$this->baseUrl()}/rest/v1/appointments?select=*,users(full_name,phone,email)&order=created_at.desc";
        if ($status) {
            $query .= "&status=eq.{$status}";
        }

        $response = Http::withoutVerifying()
            ->withHeaders($this->supabaseHeaders(true))
            ->get($query);

        if ($response->successful()) {
            $data = array_map(function ($apt) {
                // Flatten the user info into the appointment object for the frontend
                if (isset($apt['users'])) {
                    $apt['customer_name']  = $apt['users']['full_name'] ?? null;
                    $apt['customer_phone'] = $apt['users']['phone'] ?? null;
                    $apt['customer_email'] = $apt['users']['email'] ?? null;
                    unset($apt['users']);
                }
                return $apt;
            }, $response->json());

            return response()->json([
                'success' => true,
                'count'   => count($data),
                'data'    => $data,
            ])->withHeaders($this->corsHeaders());
        }

        return response()->json([
            'success' => false,
            'error'   => $response->json(),
        ], $response->status())->withHeaders($this->corsHeaders());
    }
}
