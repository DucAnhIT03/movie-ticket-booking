import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from 'src/shared/schemas/booking.entity';
import { Movie } from 'src/shared/schemas/movie.entity';
import { Screen } from 'src/shared/schemas/screen.entity';
import { QueueService } from '../../queue/queue.service';

@Injectable()
export class EmailReminderScheduler {
  private readonly logger = new Logger(EmailReminderScheduler.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,
    @InjectRepository(Screen)
    private readonly screenRepo: Repository<Screen>,
    private readonly queueService: QueueService,
  ) {}

 
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleShowtimeReminders() {
    this.logger.log('Checking for showtime reminders...');

    const now = new Date();
    
    const threeHoursMinus5Min = new Date(now.getTime() + (3 * 60 - 5) * 60 * 1000);
    const threeHoursPlus5Min = new Date(now.getTime() + (3 * 60 + 5) * 60 * 1000);

    try {
      const bookings = await this.bookingRepo
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.showtime', 'showtime')
        .leftJoinAndSelect('booking.user', 'user')
        .leftJoinAndSelect('booking.bookingSeats', 'bookingSeats')
        .leftJoinAndSelect('bookingSeats.seat', 'seat')
        .where('showtime.startTime >= :threeHoursMinus5Min', { threeHoursMinus5Min })
        .andWhere('showtime.startTime <= :threeHoursPlus5Min', { threeHoursPlus5Min })
        .andWhere('showtime.startTime > :now', { now })
        .getMany();

      let sentCount = 0;
      for (const booking of bookings) {
        if (booking.showtime && booking.user && booking.bookingSeats) {
          const timeUntilShowMs = booking.showtime.startTime.getTime() - now.getTime();
          const timeUntilShowHours = timeUntilShowMs / (60 * 60 * 1000);
          
          if (timeUntilShowHours >= 2.916 && timeUntilShowHours <= 3.083) {
            await this.sendReminderEmail(booking, '3 giờ');
            sentCount++;
          }
        }
      }

      this.logger.log(`Processed ${bookings.length} bookings, sent ${sentCount} reminder emails (3 hours before showtime)`);
    } catch (error) {
      this.logger.error('Error processing showtime reminders:', error);
    }
  }

  private async sendReminderEmail(booking: Booking, reminderTime: string) {
    try {
      const showtime = booking.showtime;
      const user = booking.user;
      const seats = booking.bookingSeats.map(bs => bs.seat?.seatNumber || '').filter(Boolean);

      if (!showtime || !user || !user.email) {
        return;
      }

     
      const movie = await this.movieRepo.findOne({ where: { id: showtime.movieId } });
      
   
      const screen = await this.screenRepo.findOne({ 
        where: { id: showtime.screenId },
        relations: ['theater'],
      });

      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Khách hàng';
      const movieTitle = movie?.title || 'N/A';
      const theaterName = screen?.theater?.name || 'N/A';
      const screenName = screen?.name || 'N/A';

      const emailData = {
        to: user.email,
        userName: userName,
        bookingId: booking.id,
        movieTitle: movieTitle,
        theaterName: theaterName,
        screenName: screenName,
        showTime: showtime.startTime,
        seats: seats,
        reminderTime: reminderTime,
      };

      await this.queueService.enqueueShowtimeReminderEmail(emailData);

      this.logger.log(`Reminder email queued for booking ${booking.id} (${reminderTime} before showtime)`);
    } catch (error) {
      this.logger.error(`Failed to queue reminder email for booking ${booking.id}:`, error);
    }
  }
}

