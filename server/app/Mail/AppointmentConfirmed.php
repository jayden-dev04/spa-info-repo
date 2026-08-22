<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AppointmentConfirmed extends Mailable
{
    use Queueable, SerializesModels;

    public array $data;

    /**
     * @param array $data Thông tin lịch hẹn và tài khoản:
     *   - name, phone, email
     *   - service_name, price, date, start_time, end_time, note
     *   - is_new_user (bool): true nếu vừa tạo tài khoản mới
     *   - password (string|null): mật khẩu tạm thời nếu is_new_user = true
     *   - status_update (string|null): 'confirmed'|'cancelled'|'rejected' nếu là mail cập nhật
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function envelope(): Envelope
    {
        $subject = match ($this->data['status_update'] ?? null) {
            'confirmed' => '✅ Lịch hẹn đã được xác nhận - Eva Spa Dưỡng Sinh',
            'cancelled' => '❌ Lịch hẹn đã bị hủy - Eva Spa Dưỡng Sinh',
            'rejected'  => '⚠️ Lịch hẹn không thể thực hiện - Eva Spa Dưỡng Sinh',
            default     => '🌿 Đặt lịch thành công - Eva Spa Dưỡng Sinh',
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.appointment.confirmed',
            with: ['data' => $this->data],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
