import { 
  BookingConfirmationEmailDto, 
  BookingInvoiceEmailDto,
  VerificationOtpEmailDto,
  ShowtimeReminderEmailDto,
  PromotionNotificationEmailDto,
  FestivalNotificationEmailDto,
} from '../dto/email.dto';

export class EmailTemplates {
  static getWelcomeEmail(data: { userName: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Chào mừng đến với hệ thống đặt vé xem phim!</h1>
            </div>
            <div class="content">
              <h2>Xin chào, ${data.userName}!</h2>
              <p>Cảm ơn bạn đã đăng ký tài khoản. Chúng tôi rất vui mừng được phục vụ bạn.</p>
              <p>Với tài khoản của bạn, bạn có thể:</p>
              <ul>
                <li>Đặt vé xem phim nhanh chóng</li>
                <li>Xem lịch sử đặt vé</li>
                <li>Nhận thông báo về phim mới và khuyến mãi</li>
                <li>Quản lý thông tin cá nhân</li>
              </ul>
              <p>Chúc bạn có trải nghiệm tuyệt vời!</p>
              <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static getRegistrationConfirmationEmail(data: { userName: string; confirmationLink?: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Đăng ký thành công!</h1>
            </div>
            <div class="content">
              <h2>Xin chào, ${data.userName}!</h2>
              <p>Tài khoản của bạn đã được tạo thành công. Bạn có thể bắt đầu sử dụng dịch vụ ngay bây giờ.</p>
              <p>Email: ${data.confirmationLink || 'Chưa có'}</p>
              <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.</p>
              <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static getBookingConfirmationEmail(data: BookingConfirmationEmailDto): string {
    const showTime = new Date(data.showTime).toLocaleString('vi-VN');
    const bookingDate = new Date(data.bookingDate).toLocaleString('vi-VN');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; border-radius: 5px; }
            .info-label { font-weight: bold; color: #667eea; }
            .seats { display: inline-block; padding: 5px 10px; background: #e3f2fd; margin: 5px; border-radius: 3px; }
            .price { font-size: 24px; color: #667eea; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Đặt vé thành công!</h1>
            </div>
            <div class="content">
              <h2>Xin chào, ${data.userName}!</h2>
              <p>Cảm ơn bạn đã đặt vé tại hệ thống của chúng tôi. Đơn đặt vé của bạn đã được xác nhận.</p>
              
              <div class="info-box">
                <div class="info-label">Mã đặt vé:</div>
                <div>#BK-${data.bookingId.toString().padStart(6, '0')}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Phim:</div>
                <div>${data.movieTitle}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Rạp chiếu:</div>
                <div>${data.theaterName}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Phòng chiếu:</div>
                <div>${data.screenName}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Thời gian chiếu:</div>
                <div>${showTime}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Ghế đã đặt:</div>
                <div>${data.seats.map(s => `<span class="seats">${s}</span>`).join('')}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Ngày đặt vé:</div>
                <div>${bookingDate}</div>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <div style="margin: 10px 0;">Tổng tiền:</div>
                <div class="price">${data.totalPrice.toLocaleString('vi-VN')} VNĐ</div>
              </div>
              
              <p><strong>Lưu ý:</strong> Vui lòng đến rạp trước 15 phút. Mang theo mã đặt vé khi đến rạp.</p>
              
              <p>Chúc bạn xem phim vui vẻ!</p>
              <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static getBookingInvoiceEmail(data: BookingInvoiceEmailDto): string {
    const showTime = new Date(data.showTime).toLocaleString('vi-VN');
    const bookingDate = new Date(data.bookingDate).toLocaleString('vi-VN');
    const paymentDate = data.paymentDate ? new Date(data.paymentDate).toLocaleString('vi-VN') : 'Chưa thanh toán';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196F3; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2196F3; border-radius: 5px; }
            .info-label { font-weight: bold; color: #2196F3; }
            .invoice-header { background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .total { text-align: right; padding: 20px; background: white; border-radius: 5px; margin-top: 20px; }
            .price { font-size: 24px; color: #2196F3; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #2196F3; color: white; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Hóa đơn đặt vé</h1>
            </div>
            <div class="content">
              <div class="invoice-header">
                <h2>Mã hóa đơn: ${data.invoiceNumber}</h2>
                <p>Ngày xuất: ${new Date().toLocaleString('vi-VN')}</p>
              </div>
              
              <h3>Thông tin khách hàng</h3>
              <div class="info-box">
                <div class="info-label">Tên khách hàng:</div>
                <div>${data.userName}</div>
              </div>
              
              <h3>Thông tin đặt vé</h3>
              <div class="info-box">
                <div class="info-label">Mã đặt vé:</div>
                <div>#BK-${data.bookingId.toString().padStart(6, '0')}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Phim:</div>
                <div>${data.movieTitle}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Rạp chiếu:</div>
                <div>${data.theaterName}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Thời gian chiếu:</div>
                <div>${showTime}</div>
              </div>
              
              <table>
                <tr>
                  <th>Vị trí ghế</th>
                  <th>Số lượng</th>
                </tr>
                ${data.seats.map(seat => `<tr><td>${seat}</td><td>1</td></tr>`).join('')}
              </table>
              
              <div class="total">
                <div>Thành tiền:</div>
                <div class="price">${data.totalPrice.toLocaleString('vi-VN')} VNĐ</div>
              </div>
              
              <h3>Thông tin thanh toán</h3>
              <div class="info-box">
                <div class="info-label">Phương thức thanh toán:</div>
                <div>${data.paymentMethod}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Trạng thái:</div>
                <div>${data.paymentStatus}</div>
              </div>
              
              ${data.transactionId ? `
                <div class="info-box">
                  <div class="info-label">Mã giao dịch:</div>
                  <div>${data.transactionId}</div>
                </div>
              ` : ''}
              
              <div class="info-box">
                <div class="info-label">Thời gian thanh toán:</div>
                <div>${paymentDate}</div>
              </div>
              
              <p style="margin-top: 30px; padding: 15px; background: #fff3cd; border-radius: 5px;">
                <strong>Lưu ý:</strong> Đây là email tự động, vui lòng không trả lời email này.
              </p>
              
              <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static getPasswordResetEmail(data: { userName: string; resetLink: string; expiresIn: number }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #f44336; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Đặt lại mật khẩu</h1>
            </div>
            <div class="content">
              <h2>Xin chào, ${data.userName}!</h2>
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
              <p>Vui lòng click vào nút bên dưới để đặt lại mật khẩu:</p>
              <div style="text-align: center;">
                <a href="${data.resetLink}" class="button">Đặt lại mật khẩu</a>
              </div>
              <div class="warning">
                <strong>⚠ Lưu ý:</strong> Link này sẽ hết hạn sau ${data.expiresIn} phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
              </div>
              <p>Nếu nút không hoạt động, bạn có thể copy link sau và dán vào trình duyệt:</p>
              <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px;">${data.resetLink}</p>
              <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static getPasswordChangedEmail(data: { userName: string; changedAt: Date }): string {
    const changedAt = new Date(data.changedAt).toLocaleString('vi-VN');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Mật khẩu đã được thay đổi</h1>
            </div>
            <div class="content">
              <h2>Xin chào, ${data.userName}!</h2>
              <p>Mật khẩu của bạn đã được thay đổi thành công.</p>
              <p><strong>Thời gian thay đổi:</strong> ${changedAt}</p>
              <p style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 5px; margin: 20px 0;">
                <strong>Lưu ý bảo mật:</strong> Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức.
              </p>
              <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static getBookingCancelledEmail(data: { bookingId: number; movieTitle: string; refundAmount?: number; cancelledAt: Date; userName: string }): string {
    const cancelledAt = new Date(data.cancelledAt).toLocaleString('vi-VN');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #f44336; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Hủy đặt vé</h1>
            </div>
            <div class="content">
              <h2>Xin chào, ${data.userName}!</h2>
              <p>Đơn đặt vé của bạn đã được hủy thành công.</p>
              
              <div class="info-box">
                <strong>Mã đặt vé:</strong> #BK-${data.bookingId.toString().padStart(6, '0')}
              </div>
              
              <div class="info-box">
                <strong>Phim:</strong> ${data.movieTitle}
              </div>
              
              <div class="info-box">
                <strong>Thời gian hủy:</strong> ${cancelledAt}
              </div>
              
              ${data.refundAmount ? `
                <div class="info-box" style="background: #e8f5e9;">
                  <strong>Số tiền hoàn:</strong> ${data.refundAmount.toLocaleString('vi-VN')} VNĐ
                </div>
              ` : ''}
              
              <p>Cảm ơn bạn đã sử dụng dịch vụ. Hy vọng được phục vụ bạn trong tương lai!</p>
              <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static getVerificationOtpEmail(data: VerificationOtpEmailDto): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; padding: 30px; text-align: center; margin: 20px 0; border: 2px dashed #667eea; border-radius: 10px; }
            .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Mã Xác Thực Tài Khoản</h1>
            </div>
            <div class="content">
              <h2>Xin chào, ${data.userName}!</h2>
              <p>Chúng tôi nhận được yêu cầu xác thực tài khoản của bạn. Vui lòng sử dụng mã OTP sau đây:</p>
              
              <div class="otp-box">
                <div style="margin-bottom: 10px; color: #666;">Mã xác thực của bạn:</div>
                <div class="otp-code">${data.otpCode}</div>
              </div>
              
              <div class="warning">
                <strong>⚠ Lưu ý:</strong> 
                <ul style="text-align: left; margin: 10px 0;">
                  <li>Mã OTP này chỉ có hiệu lực trong <strong>${data.expiresIn} phút</strong></li>
                  <li>Không chia sẻ mã này với bất kỳ ai</li>
                  <li>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email</li>
                </ul>
              </div>
              
              <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.</p>
              <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static getShowtimeReminderEmail(data: ShowtimeReminderEmailDto): string {
    const showTime = new Date(data.showTime).toLocaleString('vi-VN');
    const timeUntilShow = data.reminderTime;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #FF6B6B; border-radius: 5px; }
            .info-label { font-weight: bold; color: #FF6B6B; }
            .seats { display: inline-block; padding: 5px 10px; background: #ffe3e3; margin: 5px; border-radius: 3px; }
            .reminder-badge { background: #FF6B6B; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Nhắc Nhở Lịch Chiếu</h1>
              <div class="reminder-badge">Còn ${timeUntilShow} nữa là đến giờ chiếu!</div>
            </div>
            <div class="content">
              <h2>Xin chào, ${data.userName}!</h2>
              <p>Chúng tôi muốn nhắc nhở bạn về lịch chiếu phim sắp tới của bạn:</p>
              
              <div class="info-box">
                <div class="info-label">Mã đặt vé:</div>
                <div>#BK-${data.bookingId.toString().padStart(6, '0')}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Phim:</div>
                <div>${data.movieTitle}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Rạp chiếu:</div>
                <div>${data.theaterName}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Phòng chiếu:</div>
                <div>${data.screenName}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Thời gian chiếu:</div>
                <div style="font-size: 18px; font-weight: bold; color: #FF6B6B;">${showTime}</div>
              </div>
              
              <div class="info-box">
                <div class="info-label">Ghế đã đặt:</div>
                <div>${data.seats.map(s => `<span class="seats">${s}</span>`).join('')}</div>
              </div>
              
              <p style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 5px; margin: 20px 0;">
                <strong>💡 Lưu ý:</strong> Vui lòng đến rạp trước <strong>15 phút</strong> để có đủ thời gian lấy vé và tìm chỗ ngồi. Mang theo mã đặt vé khi đến rạp.
              </p>
              
              <p>Chúc bạn xem phim vui vẻ!</p>
              <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static getPromotionNotificationEmail(data: PromotionNotificationEmailDto): string {
    const validUntil = data.validUntil ? new Date(data.validUntil).toLocaleString('vi-VN') : 'Không giới hạn';
    const discountText = data.discountType === 'PERCENT' 
      ? `${data.discountValue}%` 
      : `${data.discountValue?.toLocaleString('vi-VN')} VNĐ`;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .promo-box { background: white; padding: 25px; margin: 20px 0; border: 3px solid #FFD700; border-radius: 10px; text-align: center; }
            .discount-badge { background: #FF6B6B; color: white; padding: 15px 30px; border-radius: 30px; font-size: 24px; font-weight: bold; display: inline-block; margin: 15px 0; }
            .code-box { background: #f0f0f0; padding: 15px; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; color: #667eea; margin: 15px 0; }
            ${data.imageUrl ? '.promo-image { width: 100%; max-width: 500px; border-radius: 10px; margin: 20px 0; }' : ''}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Khuyến Mãi Đặc Biệt!</h1>
            </div>
            <div class="content">
              <h2>Xin chào, ${data.userName}!</h2>
              <p>Chúng tôi có một ưu đãi đặc biệt dành riêng cho bạn!</p>
              
              ${data.imageUrl ? `<img src="${data.imageUrl}" alt="Promotion" class="promo-image" />` : ''}
              
              <div class="promo-box">
                <h2 style="color: #667eea; margin-top: 0;">${data.promotionTitle}</h2>
                <p>${data.promotionDescription}</p>
                
                ${data.discountValue ? `
                  <div class="discount-badge">Giảm ${discountText}</div>
                ` : ''}
                
                ${data.discountCode ? `
                  <div style="margin: 20px 0;">
                    <div style="margin-bottom: 10px;">Mã khuyến mãi:</div>
                    <div class="code-box">${data.discountCode}</div>
                  </div>
                ` : ''}
                
                <div style="margin-top: 20px; color: #666;">
                  <strong>Thời gian áp dụng:</strong> Đến ${validUntil}
                </div>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="#" style="display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Sử dụng ngay
                </a>
              </p>
              
              <p style="font-size: 12px; color: #999; text-align: center;">
                Ưu đãi này chỉ dành cho bạn. Đừng bỏ lỡ cơ hội!
              </p>
              
              <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static getFestivalNotificationEmail(data: FestivalNotificationEmailDto): string {
    const startDate = new Date(data.startDate).toLocaleString('vi-VN');
    const endDate = new Date(data.endDate).toLocaleString('vi-VN');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .festival-box { background: white; padding: 25px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
            .movie-list { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .movie-item { padding: 8px 0; border-bottom: 1px solid #ddd; }
            .movie-item:last-child { border-bottom: none; }
            ${data.imageUrl ? '.festival-image { width: 100%; max-width: 500px; border-radius: 10px; margin: 20px 0; }' : ''}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 Lễ Hội Phim Đặc Biệt</h1>
            </div>
            <div class="content">
              <h2>Xin chào, ${data.userName}!</h2>
              <p>Chúng tôi rất vui mừng thông báo về lễ hội phim đặc biệt:</p>
              
              ${data.imageUrl ? `<img src="${data.imageUrl}" alt="Festival" class="festival-image" />` : ''}
              
              <div class="festival-box">
                <h2 style="color: #667eea; margin-top: 0;">${data.festivalTitle}</h2>
                ${data.festivalDescription ? `<p>${data.festivalDescription}</p>` : ''}
                
                <div style="margin: 20px 0;">
                  <strong>📅 Thời gian:</strong><br>
                  Bắt đầu: ${startDate}<br>
                  Kết thúc: ${endDate}
                </div>
                
                ${data.featuredMovies && data.featuredMovies.length > 0 ? `
                  <div class="movie-list">
                    <strong>🎥 Phim nổi bật:</strong>
                    ${data.featuredMovies.map(movie => `<div class="movie-item">• ${movie}</div>`).join('')}
                  </div>
                ` : ''}
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="#" style="display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Xem chi tiết
                </a>
              </p>
              
              <p>Đừng bỏ lỡ cơ hội xem những bộ phim hay nhất trong lễ hội này!</p>
              <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}



