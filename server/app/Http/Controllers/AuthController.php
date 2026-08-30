<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AuthController extends Controller
{
    private function baseUrl(): string
    {
        return rtrim(env('SUPABASE_URL'), '/');
    }

    /**
     * Header dùng cho Supabase Auth Admin API (service_role / secret key).
     */
    private function adminHeaders(): array
    {
        $key = env('SUPABASE_SECRET_KEY') ?: env('SUPABASE_KEY');

        return [
            'apikey'      => $key,
            'Authorization' => 'Bearer ' . $key,
            'Content-Type'  => 'application/json',
        ];
    }

    /**
     * CHANGE_ME — danh sách email được phép vào trang Quản Trị.
     * Backend (không phải client) là nơi quyết định role.
     * Lưu ý: role được tra từ BẢNG `users` trong Supabase, KHÔNG lấy từ
     * user_metadata của token, vì metadata có thể bị tự sửa.
     */
    private const ADMIN_EMAILS = [
        'admin@evaspa.vn',
        'ttkien@nctu.edu.vn',
    ];

    /**
     * CHANGE_ME — danh sách email được phép vào với vai trò Staff.
     */
    private const STAFF_EMAILS = [
        'staff@evaspa.vn',
    ];

    /**
     * POST /api/auth/exchange
     *
     * Đổi access_token (vừa đăng nhập Google xong) lấy profile + role.
     * Backend là nguồn sự thật duy nhất về role.
     */
    public function exchange(Request $request)
    {
        $token = (string) $request->input('access_token', '');

        if ($token === '') {
            return $this->respond([
                'success' => false,
                'error'   => 'Thiếu access_token',
            ], 422);
        }

        // 1. Xác thực token với Supabase (không tin dữ liệu client gửi lên)
        $userRes = Http::withoutVerifying()
            ->withHeaders([
                'apikey'        => env('SUPABASE_KEY'),
                'Authorization' => 'Bearer ' . $token,
            ])
            ->get($this->baseUrl() . '/auth/v1/user');

        if (!$userRes->successful()) {
            return $this->respond([
                'success' => false,
                'error'   => 'access_token không hợp lệ hoặc đã hết hạn',
            ], 401);
        }

        $authUser = $userRes->json();
        $email = strtolower((string) ($authUser['email'] ?? ''));

        if ($email === '') {
            return $this->respond([
                'success' => false,
                'error'   => 'Tài khoản không có email',
            ], 400);
        }

        // 2. Tra role từ bảng public.users.
        //    Row có thể khớp bằng id (= auth uid, do trigger handle_new_user tạo)
        //    HOẶC bằng email (các row tạo từ guest booking / self-registered).
        //    Ưu tiên row không phải guest để không mất quyền đã gán.
        $role = 'user';
        $dbAvatar = '';
        try {
            $uid = (string) ($authUser['id'] ?? '');
            $dbRes = Http::withoutVerifying()
                ->withHeaders($this->adminHeaders())
                ->get($this->baseUrl() . '/rest/v1/users', [
                    'select'     => 'role,account_source,avatar_url',
                    'or'         => "id.eq.{$uid},email.eq.{$email}",
                    'order'      => 'account_source.asc.nullslast',
                    'limit'      => 2,
                ]);

            if ($dbRes->successful()) {
                $rows = (array) $dbRes->json();
                // ưu tiên row có account_source khác guest_booking
                foreach ($rows as $row) {
                    if (($row['account_source'] ?? '') !== 'guest_booking') {
                        $role = strtolower((string) ($row['role'] ?? 'user'));
                        $dbAvatar = (string) ($row['avatar_url'] ?? '');
                        break;
                    }
                }
                if ($role === 'user' && isset($rows[0]['role'])) {
                    $role = strtolower((string) $rows[0]['role']);
                    $dbAvatar = $dbAvatar ?: (string) ($rows[0]['avatar_url'] ?? '');
                }
            }
        } catch (\Throwable $e) {
            // Không chặn đăng nhập chỉ vì tra role lỗi → mặc định 'user'
        }

        // 3. Danh sách cho phép cấu hình ở backend, ghi đè role tra được
        if (in_array($email, self::ADMIN_EMAILS, true)) {
            $role = 'admin';
        } elseif (in_array($email, self::STAFF_EMAILS, true)) {
            $role = 'staff';
        } elseif (!in_array($role, ['admin', 'staff', 'user'], true)) {
            $role = 'user';
        }

        $metadata = $authUser['user_metadata'] ?? [];

        $fullName = '';
        foreach (['full_name', 'name'] as $field) {
            if (!empty($metadata[$field])) {
                $fullName = (string) $metadata[$field];
                break;
            }
        }
        if ($fullName === '') {
            $fullName = explode('@', $email)[0];
        }

        // Avatar: Google gửi về metadata.avatar_url / picture; fallback avatar_url trong bảng users
        $avatarUrl = '';
        foreach (['avatar_url', 'picture'] as $field) {
            if (!empty($metadata[$field])) {
                $avatarUrl = (string) $metadata[$field];
                break;
            }
        }
        if ($avatarUrl === '') {
            $avatarUrl = $dbAvatar;
        }

        return $this->respond([
            'success' => true,
            'user'    => [
                'id'        => (string) ($authUser['id'] ?? ''),
                'email'     => $email,
                'fullName'  => $fullName,
                'role'      => $role,
                'avatarUrl' => $avatarUrl,
            ],
        ]);
    }

    private function respond(array $payload, int $status = 200)
    {
        return response()->json($payload, $status)->withHeaders([
            'Access-Control-Allow-Origin'  => '*',
            'Access-Control-Allow-Methods' => 'POST, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With',
        ]);
    }
}
