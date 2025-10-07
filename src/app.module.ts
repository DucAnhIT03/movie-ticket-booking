import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
//import { ConfigModule } from '@nestjs/config';

// Các module chính của hệ thống
import { MoviesModule } from './module/movies/movies.module'
import { ShowtimesModule } from './module/showtimes/showtimes.module';
import { BookingsModule } from './module/bookings/bookings.module';
import { PaymentsModule } from './module/payments/payments.module';
import { TicketsModule } from './module/tickets/tickets.module'; 
//import { UsersModule } from './modules/users/users.module'; 
import { TicketPricesModule } from './module/ticket-prices/ticket-prices.module';
import { User } from './module/users/entities/user.entity';
import { Booking } from './module/bookings/entities/booking.entity';
import { Movie } from './module/movies/entities/movie.entity';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      entities: [User, Booking, Movie],
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'Vudeptrai1@',
      database: process.env.DB_NAME || 'cinema_db',
      autoLoadEntities: true,
      synchronize: true,
      
    }),
    MoviesModule,
    ShowtimesModule,
    BookingsModule,
    PaymentsModule,
    TicketsModule,
    TicketPricesModule,
  ],
})
export class AppModule {}
