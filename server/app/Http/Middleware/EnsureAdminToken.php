<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guard tối thiểu cho admin API:
 * - Nếu env('ADMIN_API_TOKEN') được set → request PHẢI mang header X-Admin-Token khớp.
 * - Nếu env CHƯA set → cho qua (fallback demo, không phá hỏng hiện trạng).
 */
class EnsureAdminToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = env('ADMIN_API_TOKEN');

        if (is_string($expected) && $expected !== '') {
            $provided = $request->header('X-Admin-Token');

            if (!is_string($provided) || $provided === '' || !hash_equals($expected, $provided)) {
                return response()->json([
                    'success' => false,
                    'error'   => 'Unauthorized: missing or invalid X-Admin-Token header.',
                ], 401);
            }
        }

        return $next($request);
    }
}
