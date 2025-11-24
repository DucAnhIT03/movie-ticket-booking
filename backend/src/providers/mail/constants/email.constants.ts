export enum EmailType {
  WELCOME = 'WELCOME',
  REGISTRATION_CONFIRMATION = 'REGISTRATION_CONFIRMATION',
  VERIFICATION_OTP = 'VERIFICATION_OTP',
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  BOOKING_INVOICE = 'BOOKING_INVOICE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PAYMENT_RECEIPT = 'PAYMENT_RECEIPT',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_UPDATED = 'BOOKING_UPDATED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SHOWTIME_REMINDER = 'SHOWTIME_REMINDER',
  PROMOTION_NOTIFICATION = 'PROMOTION_NOTIFICATION',
  FESTIVAL_NOTIFICATION = 'FESTIVAL_NOTIFICATION',
  ADMIN_NOTIFICATION = 'ADMIN_NOTIFICATION',
}

export enum EmailPriority {
  HIGH = 1,
  MEDIUM = 5,
  LOW = 10,
}

export const EMAIL_TEMPLATES: Record<EmailType, { subject: string; template: string }> = {
  [EmailType.WELCOME]: {
    subject: 'Chào mừng đến với hệ thống đặt vé xem phim',
    template: 'welcome-email',
  },
  [EmailType.REGISTRATION_CONFIRMATION]: {
    subject: 'Xác nhận đăng ký tài khoản',
    template: 'registration-confirmation',
  },
  [EmailType.BOOKING_CONFIRMATION]: {
    subject: 'Xác nhận đặt vé thành công',
    template: 'booking-confirmation',
  },
  [EmailType.BOOKING_INVOICE]: {
    subject: 'Hóa đơn đặt vé xem phim',
    template: 'booking-invoice',
  },
  [EmailType.PASSWORD_RESET]: {
    subject: 'Yêu cầu đặt lại mật khẩu',
    template: 'password-reset',
  },
  [EmailType.PASSWORD_CHANGED]: {
    subject: 'Thay đổi mật khẩu thành công',
    template: 'password-changed',
  },
  [EmailType.PAYMENT_RECEIPT]: {
    subject: 'Biên lai thanh toán',
    template: 'payment-receipt',
  },
  [EmailType.BOOKING_CANCELLED]: {
    subject: 'Thông báo hủy đặt vé',
    template: 'booking-cancelled',
  },
  [EmailType.BOOKING_UPDATED]: {
    subject: 'Cập nhật đặt vé',
    template: 'booking-updated',
  },
  [EmailType.PAYMENT_FAILED]: {
    subject: 'Thanh toán thất bại',
    template: 'payment-failed',
  },
  [EmailType.ADMIN_NOTIFICATION]: {
    subject: 'Thông báo từ quản trị viên',
    template: 'admin-notification',
  },
  [EmailType.VERIFICATION_OTP]: {
    subject: 'Mã xác thực tài khoản',
    template: 'verification-otp',
  },
  [EmailType.SHOWTIME_REMINDER]: {
    subject: 'Nhắc nhở: Lịch chiếu phim sắp tới',
    template: 'showtime-reminder',
  },
  [EmailType.PROMOTION_NOTIFICATION]: {
    subject: 'Khuyến mãi đặc biệt dành cho bạn',
    template: 'promotion-notification',
  },
  [EmailType.FESTIVAL_NOTIFICATION]: {
    subject: 'Thông báo sự kiện lễ hội phim',
    template: 'festival-notification',
  },
};



