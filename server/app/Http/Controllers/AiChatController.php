<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AI Chat cho website Eva Spa.
 * Client gửi tin nhắn → backend gọi LLM (OpenAI-compatible endpoint) → trả câu trả lời.
 * API key nằm server-side (.env), KHÔNG bao giờ lộ ra trình duyệt.
 *
 * Env cần trong server/.env:
 *   AI_CHAT_ENABLED=true
 *   AI_CHAT_BASE_URL=https://llm.ttpmsandbox.us.kg/v1
 *   AI_CHAT_API_KEY=sk-trk...
 *   AI_CHAT_MODEL=GLM-5.3-Flash
 *
 * Nếu AI_CHAT_ENABLED không set hoặc key rỗng → trả { enabled: false }
 * và ChatWidget tự fallback về demo mode (bot trả lời sẵn).
 */
class AiChatController extends Controller
{
    private function cfg(): array
    {
        return [
            'enabled' => env('AI_CHAT_ENABLED', false) === true || env('AI_CHAT_ENABLED') === 'true',
            'base'    => rtrim((string) env('AI_CHAT_BASE_URL', ''), '/'),
            'key'     => (string) env('AI_CHAT_API_KEY', ''),
            'model'   => (string) env('AI_CHAT_MODEL', 'GLM-5.3-Flash'),
        ];
    }

    /** GET /api/ai-chat/status — client hỏi trước: AI có bật không */
    public function status()
    {
        $c = $this->cfg();
        return response()->json([
            'enabled' => $c['enabled'] && $c['base'] !== '' && $c['key'] !== '',
            'model'   => $c['model'],
        ]);
    }

    /** POST /api/ai-chat — { messages: [{role, message}, ...] } */
    public function chat(Request $request)
    {
        $c = $this->cfg();
        if (!$c['enabled'] || $c['base'] === '' || $c['key'] === '') {
            return response()->json(['enabled' => false], 200);
        }

        $validated = $request->validate([
            'messages'   => 'required|array|min:1|max:24',
            'messages.*.role'    => 'required|in:customer,admin',
            'messages.*.message' => 'required|string|max:1000',
        ]);

        // Map lịch sử client → messages cho LLM. System prompt giới hạn phạm vi tư vấn spa.
        $messages = [[
            'role'    => 'system',
            'content' => 'Bạn là trợ lý ảo của Eva Spa — spa dưỡng sinh & mỹ phẩm thảo mộc tại Cần Thơ. '
                . 'Chỉ trả lời các câu hỏi liên quan: liệu trình spa (gội đầu dưỡng sinh, chăm sóc da thảo mộc, massage đá nóng), '
                . 'sản phẩm thảo mộc/my xuất, đặt lịch hẹn, giờ mở cửa (8h00-21h00 hằng ngày), chính sách giao hàng & thanh toán (COD, VietQR VietinBank 0364911491). '
                . 'Câu trả lời ngắn gọn, thân thiện, tiếng Việt, tối đa 4 câu. Nếu câu hỏi ngoài phạm vi spa/sản phẩm, lịch sự hướng dẫn khách liên hệ nhân viên.',
        ]];

        foreach ($validated['messages'] as $m) {
            $messages[] = [
                'role'    => $m['role'] === 'customer' ? 'user' : 'assistant',
                'content' => (string) $m['message'],
            ];
        }

        try {
            $res = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $c['key'],
                    'Content-Type'  => 'application/json',
                    'Accept'        => 'application/json',
                    // Cloudflare của proxy chặn TLS fingerprint mặc định của Guzzle —
                    // đặt UA trình duyệt chuẩn để qua WAF.
                    'User-Agent'    => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                ])
                ->withoutVerifying() // máy dev Windows thiếu CA bundle; giữ verify off cho local
                ->timeout(60)
                ->post($c['base'] . '/chat/completions', [
                    'model'       => $c['model'],
                    'messages'    => $messages,
                    'max_tokens'  => 400,
                    'temperature' => 0.7,
                ]);

            if ($res->failed()) {
                Log::warning('AI chat upstream fail', ['status' => $res->status()]);
                return response()->json(['enabled' => true, 'reply' => null, 'error' => 'upstream'], 200);
            }

            $reply = data_get($res->json(), 'choices.0.message.content');
            return response()->json([
                'enabled' => true,
                'reply'   => is_string($reply) && trim($reply) !== '' ? trim($reply) : null,
            ], 200);
        } catch (\Throwable $e) {
            Log::warning('AI chat exception: ' . $e->getMessage());
            return response()->json(['enabled' => true, 'reply' => null, 'error' => 'exception'], 200);
        }
    }
}
