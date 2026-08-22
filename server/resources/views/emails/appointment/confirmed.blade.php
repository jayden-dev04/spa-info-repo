<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Eva Spa – Thông tin lịch hẹn</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;color:#333;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          {{-- ====== HEADER ====== --}}
          <tr>
            <td style="background:linear-gradient(135deg,#5a7a5a 0%,#3d5c3d 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:3px;color:#b8d4b8;text-transform:uppercase;">Eva Spa Dưỡng Sinh Thảo Mộc</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                @if(isset($data['status_update']))
                  @if($data['status_update'] === 'confirmed') ✅ Lịch hẹn đã được xác nhận
                  @elseif($data['status_update'] === 'cancelled') ❌ Lịch hẹn đã bị hủy
                  @elseif($data['status_update'] === 'rejected') ⚠️ Lịch hẹn không thể thực hiện
                  @else 🌿 Thông báo lịch hẹn
                  @endif
                @else
                  🌿 Đặt Lịch Thành Công!
                @endif
              </h1>
            </td>
          </tr>

          {{-- ====== GREETING ====== --}}
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0;font-size:16px;line-height:1.7;color:#555;">
                Xin chào <strong style="color:#3d5c3d;">{{ $data['name'] }}</strong>,
              </p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#666;">
                @if(isset($data['status_update']) && $data['status_update'] === 'confirmed')
                  Lịch hẹn của bạn tại <strong>Eva Spa Dưỡng Sinh</strong> đã được <strong style="color:#3d5c3d;">xác nhận thành công</strong>. Chúng tôi rất mong được đón tiếp bạn!
                @elseif(isset($data['status_update']) && in_array($data['status_update'], ['cancelled','rejected']))
                  Rất tiếc, lịch hẹn của bạn tại <strong>Eva Spa Dưỡng Sinh</strong> đã bị <strong style="color:#c0392b;">hủy</strong>. Vui lòng liên hệ hotline để đặt lại hoặc biết thêm chi tiết.
                @else
                  Cảm ơn bạn đã đặt lịch tại <strong>Eva Spa Dưỡng Sinh Thảo Mộc</strong>. Đội ngũ chuyên viên của chúng tôi sẽ liên hệ xác nhận trong vòng <strong>15 phút</strong>.
                @endif
              </p>
            </td>
          </tr>

          {{-- ====== APPOINTMENT DETAILS ====== --}}
          <tr>
            <td style="padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faf8;border:1px solid #d4e8d4;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e0ede0;" colspan="2">
                    <p style="margin:0;font-size:12px;letter-spacing:2px;color:#6a9a6a;text-transform:uppercase;font-weight:600;">Thông tin lịch hẹn</p>
                  </td>
                </tr>

                {{-- Service --}}
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #e8f0e8;width:40%;font-size:13px;color:#888;font-weight:600;vertical-align:top;">🌿 Dịch vụ</td>
                  <td style="padding:14px 20px;border-bottom:1px solid #e8f0e8;font-size:14px;color:#333;font-weight:600;">{{ $data['service_name'] }}</td>
                </tr>

                {{-- Date --}}
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #e8f0e8;font-size:13px;color:#888;font-weight:600;vertical-align:top;">📅 Ngày hẹn</td>
                  <td style="padding:14px 20px;border-bottom:1px solid #e8f0e8;font-size:14px;color:#333;">
                    {{ \Carbon\Carbon::parse($data['date'])->locale('vi')->isoFormat('dddd, DD/MM/YYYY') }}
                  </td>
                </tr>

                {{-- Time --}}
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #e8f0e8;font-size:13px;color:#888;font-weight:600;vertical-align:top;">⏰ Khung giờ</td>
                  <td style="padding:14px 20px;border-bottom:1px solid #e8f0e8;font-size:14px;color:#333;">
                    {{ \Carbon\Carbon::parse($data['start_time'])->format('H:i') }}
                    –
                    {{ \Carbon\Carbon::parse($data['end_time'])->format('H:i') }}
                  </td>
                </tr>

                {{-- Price --}}
                <tr>
                  <td style="padding:14px 20px;border-bottom:{{ $data['note'] ? '1px solid #e8f0e8' : 'none' }};font-size:13px;color:#888;font-weight:600;vertical-align:top;">💰 Chi phí</td>
                  <td style="padding:14px 20px;border-bottom:{{ $data['note'] ? '1px solid #e8f0e8' : 'none' }};font-size:15px;color:#3d5c3d;font-weight:700;">
                    {{ number_format($data['price'], 0, ',', '.') }}₫
                  </td>
                </tr>

                {{-- Note (optional) --}}
                @if($data['note'])
                <tr>
                  <td style="padding:14px 20px;font-size:13px;color:#888;font-weight:600;vertical-align:top;">📝 Ghi chú</td>
                  <td style="padding:14px 20px;font-size:13px;color:#555;font-style:italic;">"{{ $data['note'] }}"</td>
                </tr>
                @endif
              </table>
            </td>
          </tr>

          {{-- ====== LOGIN CREDENTIALS (new user only) ====== --}}
          @if($data['is_new_user'] && $data['password'])
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf9f0;border:1px solid #f0d080;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #f0e0a0;" colspan="2">
                    <p style="margin:0;font-size:12px;letter-spacing:2px;color:#b8860b;text-transform:uppercase;font-weight:600;">🔑 Thông tin tài khoản của bạn</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;border-bottom:1px solid #f0e8c0;font-size:13px;color:#888;font-weight:600;width:40%;">Email</td>
                  <td style="padding:12px 20px;border-bottom:1px solid #f0e8c0;font-size:14px;color:#333;font-weight:600;">{{ $data['email'] }}</td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;font-size:13px;color:#888;font-weight:600;">Mật khẩu tạm</td>
                  <td style="padding:12px 20px;">
                    <code style="font-size:16px;font-weight:700;color:#b8860b;background:#fff8e0;padding:4px 10px;border-radius:6px;letter-spacing:1px;">{{ $data['password'] }}</code>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:12px;color:#999;line-height:1.6;">
                ⚠️ Đây là mật khẩu tạm thời được tạo tự động. Bạn có thể đăng nhập và đổi mật khẩu bất kỳ lúc nào.
              </p>
            </td>
          </tr>
          @endif

          {{-- ====== CONTACT INFO ====== --}}
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f5f0;border-radius:10px;padding:20px;">
                <tr>
                  <td style="padding:0 0 8px;">
                    <p style="margin:0;font-size:13px;color:#6a9a6a;font-weight:600;letter-spacing:1px;">📍 Eva Spa Dưỡng Sinh Thảo Mộc</p>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#666;line-height:2;">
                    9B Lý Tự Trọng, Ninh Kiều, TP. Cần Thơ<br/>
                    📞 Hotline: <a href="tel:0766983979" style="color:#3d5c3d;font-weight:600;text-decoration:none;">0766.98.3979</a><br/>
                    🕘 Giờ làm việc: 09:00 – 20:30 (Mỗi ngày)
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {{-- ====== FOOTER ====== --}}
          <tr>
            <td style="background:#3d5c3d;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#b8d4b8;line-height:1.8;">
                Email này được gửi tự động từ hệ thống Eva Spa.<br/>
                Vui lòng không trả lời email này.<br/>
                <span style="color:#7ab07a;">© 2026 Eva Spa Dưỡng Sinh Thảo Mộc – Cần Thơ</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
