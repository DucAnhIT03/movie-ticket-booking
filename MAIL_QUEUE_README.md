# Mail và Queue System - Hệ thống đặt vé xem phim

## Tổng quan

Hệ thống mail và queue được thiết kế để xử lý việc gửi email một cách bất đồng bộ và hiệu quả cho ứng dụng đặt vé xem phim.

## Cấu trúc

### 1. Mail Module (`src/mail/`)
- **MailService**: Xử lý gửi email với template Handlebars
- **MailController**: API endpoints để test và quản lý email
- **Templates**: Các template email HTML (Handlebars)

### 2. Queue Module (`src/queue/`)
- **QueueService**: Quản lý các job trong queue
- **EmailProcessor**: Xử lý các job email trong background
- **QueueModule**: Cấu hình Bull queue với Redis

## Cài đặt và Cấu hình

### 1. Cài đặt Dependencies
```bash
npm install @nestjs/config @nestjs/bull bull nodemailer @types/nodemailer handlebars redis @types/redis ioredis @types/ioredis
```

### 2. Cấu hình Environment Variables
Tạo file `.env` từ `env.example`:

```env
# Mail Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=noreply@moviebooking.com

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 3. Cài đặt Redis
```bash
# Windows (sử dụng Chocolatey)
choco install redis

# Hoặc download từ https://redis.io/download
```

## Sử dụng

### 1. Gửi Email Trực tiếp

```typescript
import { MailService } from './mail/mail.service';

constructor(private mailService: MailService) {}

// Gửi email xác nhận đặt vé
await this.mailService.sendBookingConfirmation('user@example.com', {
  userName: 'John Doe',
  bookingId: 'BK001',
  movieTitle: 'Avengers',
  theaterName: 'CGV Vincom',
  screenName: 'Screen 1',
  showTime: '2024-01-01 19:00',
  seats: 'A1, A2',
  totalPrice: 200000
});

// Gửi email chào mừng
await this.mailService.sendWelcomeEmail('user@example.com', 'John Doe');
```

### 2. Sử dụng Queue (Khuyến nghị)

```typescript
import { QueueService } from './queue/queue.service';

constructor(private queueService: QueueService) {}

// Gửi email qua queue (bất đồng bộ)
await this.queueService.sendBookingConfirmation('user@example.com', bookingData);

// Gửi email với delay (ví dụ: nhắc nhở trước 1 giờ)
await this.queueService.sendBookingReminder('user@example.com', bookingData, 3600000);

// Gửi email đặt lại mật khẩu
await this.queueService.sendPasswordReset('user@example.com', 'https://example.com/reset?token=abc123');
```

### 3. API Endpoints

#### Gửi Email
```bash
# Gửi email xác nhận đặt vé
POST /mail/send-booking-confirmation
{
  "email": "user@example.com",
  "bookingData": {
    "userName": "John Doe",
    "bookingId": "BK001",
    "movieTitle": "Avengers",
    "theaterName": "CGV Vincom",
    "screenName": "Screen 1",
    "showTime": "2024-01-01 19:00",
    "seats": "A1, A2",
    "totalPrice": 200000
  }
}

# Gửi email nhắc nhở
POST /mail/send-booking-reminder
{
  "email": "user@example.com",
  "bookingData": { ... },
  "delayMs": 3600000
}

# Gửi email test
POST /mail/send-test-email
{
  "email": "test@example.com",
  "subject": "Test Email",
  "template": "welcome",
  "context": { "userName": "Test User" }
}
```

#### Quản lý Queue
```bash
# Xem thống kê queue
GET /mail/queue-stats

# Xóa queue
POST /mail/clear-queue

# Tạm dừng queue
POST /mail/pause-queue

# Tiếp tục queue
POST /mail/resume-queue
```

## Email Templates

### 1. Booking Confirmation (`booking-confirmation.hbs`)
- Email xác nhận đặt vé thành công
- Bao gồm thông tin phim, rạp, ghế, thời gian

### 2. Booking Reminder (`booking-reminder.hbs`)
- Email nhắc nhở trước giờ chiếu
- Có thể gửi với delay

### 3. Password Reset (`password-reset.hbs`)
- Email đặt lại mật khẩu
- Bao gồm link reset an toàn

### 4. Welcome Email (`welcome.hbs`)
- Email chào mừng người dùng mới
- Giới thiệu các tính năng

## Testing

### Chạy Unit Tests
```bash
npm run test
npm run test:watch
npm run test:cov
```

### Test Email Locally
```bash
# Khởi động Redis
redis-server

# Khởi động ứng dụng
npm run start:dev

# Test gửi email
curl -X POST http://localhost:3000/mail/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","subject":"Test","template":"welcome","context":{"userName":"Test User"}}'
```

## Monitoring và Debugging

### 1. Queue Statistics
```typescript
const stats = await this.queueService.getQueueStats();
console.log('Queue Stats:', stats);
// Output: { waiting: 5, active: 2, completed: 100, failed: 3 }
```

### 2. Logs
Hệ thống sử dụng NestJS Logger để ghi log:
- Email gửi thành công/thất bại
- Queue job processing
- Error handling

### 3. Redis Monitoring
```bash
# Kết nối Redis CLI
redis-cli

# Xem tất cả keys
KEYS *

# Xem thông tin queue
LLEN bull:email:waiting
LLEN bull:email:active
LLEN bull:email:completed
LLEN bull:email:failed
```

## Troubleshooting

### 1. Email không gửi được
- Kiểm tra cấu hình SMTP trong `.env`
- Đảm bảo Redis đang chạy
- Kiểm tra logs để xem lỗi cụ thể

### 2. Queue không hoạt động
- Kiểm tra kết nối Redis
- Xem queue statistics
- Kiểm tra processor có đang chạy không

### 3. Template không load được
- Đảm bảo file template tồn tại trong `src/mail/templates/`
- Kiểm tra syntax Handlebars
- Xem logs để debug

## Mở rộng

### 1. Thêm Template mới
1. Tạo file `.hbs` trong `src/mail/templates/`
2. Thêm method trong `MailService`
3. Thêm job type trong `EmailProcessor`

### 2. Thêm Queue mới
1. Đăng ký queue trong `QueueModule`
2. Tạo processor tương ứng
3. Thêm service methods

### 3. Tích hợp với Database
- Lưu trữ lịch sử email
- Tracking email delivery status
- Analytics và reporting
