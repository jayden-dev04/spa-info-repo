<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận đơn hàng Eva Spa</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f8f5;font-family:'Segoe UI',Arial,sans-serif;color:#333333;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f8f5;padding:30px 10px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e0ebe0;">

          {{-- ====== HEADER ====== --}}
          <tr>
            <td style="background:#2d4a2d;padding:32px 40px 24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;color:#c8e6c9;text-transform:uppercase;font-weight:600;">EVA SPA DƯỠNG SINH & THẢO MỘC</p>
              <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:700;">
                @if(($data['status_update'] ?? '') === 'shipped')
                  🚚 Đơn Hàng Đang Được Giao
                @elseif(($data['status_update'] ?? '') === 'completed')
                  🎉 Đơn Hàng Đã Giao Thành Công
                @elseif(($data['status_update'] ?? '') === 'cancelled')
                  ❌ Đơn Hàng Đã Bị Hủy
                @else
                  🌿 Xác Nhận Đơn Hàng Thành Công
                @endif
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:#e8f5e9;">
                Mã đơn hàng: <strong style="color:#d4af37;font-family:monospace;font-size:16px;">#{{ $data['order_code'] ?? 'EVA' }}</strong>
              </p>
            </td>
          </tr>

          {{-- ====== GREETING ====== --}}
          <tr>
            <td style="padding:28px 40px 16px;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:#444;">
                Xin chào <strong>{{ $data['customer_name'] ?? 'Quý khách' }}</strong>,<br/>
                Cảm ơn bạn đã tin chọn các dòng sản phẩm chăm sóc thảo mộc hữu cơ tại <strong>Eva Spa</strong>.
              </p>
            </td>
          </tr>

          {{-- ====== SHIPPING ADDRESS ====== --}}
          <tr>
            <td style="padding:0 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fbf9;border:1px solid #d8e8d8;border-radius:10px;padding:16px 20px;">
                <tr>
                  <td style="font-size:13px;font-weight:700;color:#2d4a2d;padding-bottom:8px;">📍 THÔNG TIN NHẬN HÀNG</td>
                </tr>
                <tr>
                  <td style="font-size:13px;line-height:1.8;color:#555;">
                    <strong>Người nhận:</strong> {{ $data['customer_name'] ?? '' }} ({{ $data['customer_phone'] ?? '' }})<br/>
                    <strong>Địa chỉ giao:</strong> {{ $data['customer_address'] ?? '' }}<br/>
                    <strong>Hình thức thanh toán:</strong> 
                    <span style="color:#2d4a2d;font-weight:600;">
                      {{ ($data['payment_method'] ?? '') === 'vietqr' ? 'Chuyển khoản VietQR' : 'Thanh toán COD khi nhận hàng' }}
                    </span>
                    @if(!empty($data['notes']))
                      <br/><strong>Ghi chú:</strong> <em>{{ $data['notes'] }}</em>
                    @endif
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          {{-- ====== ITEMS TABLE ====== --}}
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#2d4a2d;">🛍️ DANH SÁCH MÓN HÀNG</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e0ebe0;border-radius:10px;overflow:hidden;">
                <thead>
                  <tr style="background:#edf4ed;">
                    <th style="padding:10px 14px;text-align:left;font-size:12px;color:#2d4a2d;font-weight:600;">Sản phẩm</th>
                    <th style="padding:10px 14px;text-align:center;font-size:12px;color:#2d4a2d;font-weight:600;">SL</th>
                    <th style="padding:10px 14px;text-align:right;font-size:12px;color:#2d4a2d;font-weight:600;">Đơn giá</th>
                    <th style="padding:10px 14px;text-align:right;font-size:12px;color:#2d4a2d;font-weight:600;">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  @if(!empty($data['items']))
                    @foreach($data['items'] as $item)
                      <tr style="border-top:1px solid #f0f0f0;">
                        <td style="padding:12px 14px;font-size:13px;color:#333;font-weight:500;">
                          {{ $item['name'] ?? ($item['product_name'] ?? 'Sản phẩm') }}
                        </td>
                        <td style="padding:12px 14px;text-align:center;font-size:13px;color:#555;">
                          {{ $item['quantity'] ?? 1 }}
                        </td>
                        <td style="padding:12px 14px;text-align:right;font-size:13px;color:#555;">
                          {{ number_format($item['price'] ?? 0, 0, ',', '.') }}đ
                        </td>
                        <td style="padding:12px 14px;text-align:right;font-size:13px;color:#2d4a2d;font-weight:600;">
                          {{ number_format(($item['price'] ?? 0) * ($item['quantity'] ?? 1), 0, ',', '.') }}đ
                        </td>
                      </tr>
                    @endforeach
                  @endif
                </tbody>
                <tfoot>
                  <tr style="border-top:1px solid #d8e8d8;background:#f9fbf9;">
                    <td colspan="3" style="padding:10px 14px;text-align:right;font-size:12px;color:#666;">Phí vận chuyển:</td>
                    <td style="padding:10px 14px;text-align:right;font-size:13px;color:#333;font-weight:600;">
                      {{ ($data['shipping_fee'] ?? 0) == 0 ? 'Miễn phí' : number_format($data['shipping_fee'], 0, ',', '.') . 'đ' }}
                    </td>
                  </tr>
                  <tr style="border-top:1px solid #d8e8d8;background:#edf4ed;">
                    <td colspan="3" style="padding:12px 14px;text-align:right;font-size:14px;color:#2d4a2d;font-weight:700;">Tổng thanh toán:</td>
                    <td style="padding:12px 14px;text-align:right;font-size:16px;color:#b8860b;font-weight:700;">
                      {{ number_format($data['total_amount'] ?? 0, 0, ',', '.') }}đ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          {{-- ====== VIETQR BANK INFO (If VietQR) ====== --}}
          @if(($data['payment_method'] ?? '') === 'vietqr')
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf9f0;border:1px solid #f0d080;border-radius:10px;padding:16px 20px;">
                <tr>
                  <td style="font-size:13px;font-weight:700;color:#b8860b;padding-bottom:6px;">💳 THÔNG TIN CHUYỂN KHOẢN VIETQR</td>
                </tr>
                <tr>
                  <td style="font-size:13px;line-height:1.8;color:#555;">
                    <strong>Ngân hàng:</strong> VietinBank (Việt Nam Công Thương)<br/>
                    <strong>Số tài khoản:</strong> <code style="color:#2d4a2d;font-size:14px;font-weight:700;">0364911491</code><br/>
                    <strong>Chủ tài khoản:</strong> TRAN TRUNG KIEN<br/>
                    <strong>Số tiền:</strong> <strong style="color:#b8860b;">{{ number_format($data['total_amount'] ?? 0, 0, ',', '.') }}đ</strong><br/>
                    <strong>Nội dung chuyển khoản:</strong> <code style="background:#fff8e0;padding:2px 8px;border-radius:4px;font-weight:700;color:#b8860b;">{{ $data['order_code'] ?? 'EVA' }}</code>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          @endif

          {{-- ====== CONTACT FOOTER ====== --}}
          <tr>
            <td style="background:#2d4a2d;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#ffffff;font-weight:600;">🌿 EVA SPA DƯỠNG SINH & THẢO MỘC CẦN THƠ</p>
              <p style="margin:0;font-size:12px;color:#c8e6c9;line-height:1.8;">
                9B Lý Tự Trọng, Ninh Kiều, TP. Cần Thơ<br/>
                Hotline hỗ trợ đơn hàng: <a href="tel:0766983979" style="color:#ffd700;text-decoration:none;font-weight:600;">0766.98.3979</a><br/>
                Giờ làm việc: 09:00 – 20:30 (Mỗi ngày)
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
