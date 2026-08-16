<!DOCTYPE html>
<html>
<head>
    <title>Xác nhận Đặt lịch Spa</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #ff6b00; text-align: center;">Eva Spa - Cần Thơ</h2>
        <p>Xin chào <strong>{{ $appointment['customer_name'] }}</strong>,</p>
        <p>Cảm ơn bạn đã đặt lịch hẹn tại Eva Spa. Dưới đây là thông tin chi tiết về lịch hẹn của bạn:</p>
        
        <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eaeaea;"><strong>Dịch vụ:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eaeaea;">ID Dịch vụ {{ $appointment['service_id'] }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eaeaea;"><strong>Thời gian:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eaeaea;">{{ \Carbon\Carbon::parse($appointment['appointment_date'])->format('d/m/Y H:i') }}</td>
            </tr>
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eaeaea;"><strong>Ghi chú:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #eaeaea;">{{ $appointment['notes'] ?? 'Không có' }}</td>
            </tr>
        </table>
        
        <p style="margin-top: 20px;">Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận lại lịch hẹn.</p>
        <p>Mọi thắc mắc vui lòng liên hệ Hotline: <strong>0766.98.3979</strong></p>
        
        <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;">
        <p style="text-align: center; font-size: 12px; color: #999;">Eva Spa Cần Thơ - 9B Lý Tự Trọng, Ninh Kiều, TP. Cần Thơ</p>
    </div>
</body>
</html>
