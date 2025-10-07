# Quick Start Guide - Mail & Queue System

## 🚀 Khởi động nhanh

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Cấu hình Environment
Tạo file `.env` từ `env.example`:
```bash
cp env.example .env
```

Cập nhật các thông tin trong `.env`:
```env
# Mail Configuration (sử dụng Gmail)
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
**Windows:**
```bash
# Sử dụng Chocolatey
choco install redis

# Hoặc download từ https://redis.io/download
```

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS với Homebrew
brew install redis
```

### 4. Khởi động Redis
```bash
# Windows
redis-server

# Linux/Mac
sudo systemctl start redis
# hoặc
redis-server
```

### 5. Chạy ứng dụng
```bash
# Development mode
npm run start:dev

# Hoặc build và chạy production
npm run build
npm run start:prod
```

## 🧪 Testing

### Chạy Unit Tests
```bash
npm test
```

### Chạy Demo
```bash
npm run demo:mail
```

### Test API Endpoints
```bash
# Khởi động server
npm run start:dev

# Test gửi email (sử dụng curl hoặc Postman)
curl -X POST http://localhost:3000/mail/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","subject":"Test","template":"welcome","context":{"userName":"Test User"}}'

# Xem thống kê queue
curl http://localhost:3000/mail/queue-stats
```

## 📧 Sử dụng trong Code

### Gửi Email Trực tiếp
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
```

### Sử dụng Queue (Khuyến nghị)
```typescript
import { QueueService } from './queue/queue.service';

constructor(private queueService: QueueService) {}

// Gửi email qua queue (bất đồng bộ)
await this.queueService.sendBookingConfirmation('user@example.com', bookingData);

// Gửi email với delay (ví dụ: nhắc nhở trước 1 giờ)
await this.queueService.sendBookingReminder('user@example.com', bookingData, 3600000);
```

## 🔧 Troubleshooting

### 1. Lỗi kết nối Redis
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Giải pháp:** Đảm bảo Redis đang chạy
```bash
redis-server
```

### 2. Lỗi gửi email
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Giải pháp:** 
- Kiểm tra email và password trong `.env`
- Sử dụng App Password cho Gmail (không phải mật khẩu thường)
- Bật 2FA và tạo App Password

### 3. Lỗi template không tìm thấy
```
Error: ENOENT: no such file or directory, open '.../templates/xxx.hbs'
```
**Giải pháp:** Đảm bảo file template tồn tại trong `src/mail/templates/`

## 📊 Monitoring

### Xem Queue Statistics
```bash
curl http://localhost:3000/mail/queue-stats
```

### Redis CLI
```bash
redis-cli

# Xem tất cả keys
KEYS *

# Xem queue status
LLEN bull:email:waiting
LLEN bull:email:active
LLEN bull:email:completed
LLEN bull:email:failed
```

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mail/send-booking-confirmation` | Gửi email xác nhận đặt vé |
| POST | `/mail/send-booking-reminder` | Gửi email nhắc nhở |
| POST | `/mail/send-password-reset` | Gửi email đặt lại mật khẩu |
| POST | `/mail/send-welcome` | Gửi email chào mừng |
| POST | `/mail/send-test-email` | Gửi email test |
| GET | `/mail/queue-stats` | Xem thống kê queue |
| POST | `/mail/clear-queue` | Xóa queue |
| POST | `/mail/pause-queue` | Tạm dừng queue |
| POST | `/mail/resume-queue` | Tiếp tục queue |

## 📝 Ghi chú

- Hệ thống sử dụng Bull queue với Redis để xử lý email bất đồng bộ
- Email templates sử dụng Handlebars
- Tất cả email đều được queue để đảm bảo hiệu suất
- Hỗ trợ retry tự động khi gửi email thất bại
- Có thể gửi email với delay (scheduled emails)
