import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './providers/mail/mail.module';
import { QueueModule } from './providers/queue/queue.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'cinema_dev',
      autoLoadEntities: true,
      synchronize: false,
    }),
  
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
    
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
