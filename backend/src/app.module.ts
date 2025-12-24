import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './providers/mail/mail.module';
import { QueueModule } from './providers/queue/queue.module';
import { RedisCacheModule } from './providers/redis-cache';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TheatersModule } from './modules/theaters/theaters.module';
import { ScreensModule } from './modules/screens/screens.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { FestivalsModule } from './modules/festivals/festivals.module';
import { EventsModule } from './modules/events/events.module';
import { MoviesModule } from './modules/movies/movies.module';
import { MovieModule } from './modules/movies/movie.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/user.module';
import { NewsModule } from './modules/news/news.module';
import { BannerModule } from './modules/banners/banner.module';
import { BannerPosterModule } from './modules/banner-poster/banner-poster.module';
import { PosterModule } from './modules/poster/poster.module';
import { PromotionModule } from './modules/promotions/promotion.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { ShowtimesModule } from './modules/showtimes/showtimes.module';
import { SeatsModule } from './modules/seats/seats.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TicketPricesModule } from './modules/ticket-prices/ticket-prices.module';
import { EmailLogsModule } from './modules/email-logs/email-logs.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      // Ưu tiên bộ biến mới trong .env: DB_USERNAME, DB_PASSWORD, DB_DATABASE
      // vẫn hỗ trợ DB_USER / DB_PASS / DB_NAME nếu đã được cấu hình trước đó
      username: process.env.DB_USERNAME || process.env.DB_USER,
      password: process.env.DB_PASSWORD ?? process.env.DB_PASS,
      database: process.env.DB_DATABASE || process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false,
    }),
  
    // Redis Cache Module - Global
    RedisCacheModule,
    
    MailModule,
    QueueModule,
   
    AuthModule,
    UserModule,
    
    MoviesModule,
    MovieModule, 
    
    NewsModule,
    BannerModule,
    BannerPosterModule,
    PosterModule,
    PromotionModule,
    FestivalsModule,
    EventsModule,
    
    TheatersModule,
    ScreensModule,
   
    BookingsModule,
    TicketsModule,
    ShowtimesModule,
    SeatsModule,
    PaymentsModule,
    TicketPricesModule,
    EmailLogsModule,
    DashboardModule,
    ChatModule,
    
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
