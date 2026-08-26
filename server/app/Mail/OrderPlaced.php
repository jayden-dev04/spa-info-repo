<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderPlaced extends Mailable
{
    use Queueable, SerializesModels;

    public array $data;

    /**
     * @param array $data Thông tin đơn hàng:
     *   - order_code, customer_name, customer_phone, customer_email, customer_address
     *   - items (array of name, price, quantity, image_url)
     *   - total_amount, shipping_fee, payment_method, notes
     *   - status_update (string|null): 'shipped'|'completed'|'cancelled' nếu là mail đổi trạng thái
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function envelope(): Envelope
    {
        $orderCode = $this->data['order_code'] ?? 'EVA';
        $subject = match ($this->data['status_update'] ?? null) {
            'shipped'   => "🚚 Đơn hàng #{$orderCode} đang được giao - Eva Spa Thảo Mộc",
            'completed' => "🎉 Đơn hàng #{$orderCode} đã giao thành công - Eva Spa Thảo Mộc",
            'cancelled' => "❌ Đơn hàng #{$orderCode} đã bị hủy - Eva Spa Thảo Mộc",
            default     => "🌿 Xác nhận đơn hàng #{$orderCode} - Eva Spa Thảo Mộc",
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order.placed',
            with: ['data' => $this->data],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
