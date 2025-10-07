import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { QueueService } from '../queue/queue.service';

async function demoMailAndQueue() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const queueService = app.get(QueueService);

  console.log('🚀 Starting Mail and Queue Demo...\n');

  try {
    // Demo 1: Gửi email chào mừng
    console.log('📧 Demo 1: Sending welcome email...');
    await queueService.sendWelcomeEmail('ducanhinformaitiontechnology@gmail.com', 'Demo User');
    console.log('✅ Welcome email queued successfully\n');

    // Demo 2: Gửi email xác nhận đặt vé
    console.log('🎬 Demo 2: Sending booking confirmation...');
    const bookingData = {
      userName: 'Demo User',
      bookingId: 'BK001',
      movieTitle: 'Avengers: Endgame',
      theaterName: 'CGV Vincom',
      screenName: 'Screen 1',
      showTime: '2024-01-15 19:00',
      seats: 'A1, A2, A3',
      totalPrice: 300000,
    };
    await queueService.sendBookingConfirmation('ducanhinformaitiontechnology@gmail.com', bookingData);
    console.log('✅ Booking confirmation queued successfully\n');

    // Demo 3: Gửi email nhắc nhở với delay
    console.log('⏰ Demo 3: Sending booking reminder with 5 second delay...');
    await queueService.sendBookingReminder('ducanhinformaitiontechnology@gmail.com', bookingData, 5000);
    console.log('✅ Booking reminder queued with delay\n');

    // Demo 4: Gửi email đặt lại mật khẩu
    console.log('🔐 Demo 4: Sending password reset...');
    await queueService.sendPasswordReset('ducanhinformaitiontechnology@gmail.com', 'https://example.com/reset?token=demo123');
    console.log('✅ Password reset email queued successfully\n');

    // Demo 5: Xem thống kê queue
    console.log('📊 Demo 5: Queue statistics...');
    const stats = await queueService.getQueueStats();
    console.log('Queue Stats:', stats);
    console.log('✅ Queue statistics retrieved\n');

    // Chờ một chút để xem queue hoạt động
    console.log('⏳ Waiting for queue processing...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Xem thống kê sau khi xử lý
    console.log('📊 Final queue statistics...');
    const finalStats = await queueService.getQueueStats();
    console.log('Final Queue Stats:', finalStats);

    console.log('\n🎉 Demo completed successfully!');
    console.log('\n📝 Note: To see actual emails, configure your SMTP settings in .env file');
    console.log('📝 Note: Make sure Redis is running for queue processing');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    await app.close();
  }
}

// Chạy demo nếu file được execute trực tiếp
if (require.main === module) {
  demoMailAndQueue().catch(console.error);
}

export { demoMailAndQueue };
