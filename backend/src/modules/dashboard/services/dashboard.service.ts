import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from '../../../shared/schemas/users.entity';
import { TheaterOrmEntity } from '../../../shared/schemas/theater.orm-entity';
import { Screen } from '../../../shared/schemas/screen.entity';
import { Showtime } from '../../../shared/schemas/showtime.entity';
import { Booking } from '../../../shared/schemas/booking.entity';
import { Payment } from '../../../shared/schemas/payment.entity';
import { EmailLog } from '../../../shared/schemas/email-log.entity';
import { QueueService } from '../../../providers/queue/queue.service';
import { DashboardStatsResponseDto } from '../dtos/response/dashboard-stats.response.dto';
import { Status as UserStatus } from '../../../common/constants/enums';
import { PaymentStatus } from '../../../common/constrants/enums';
import { Movie } from '../../../shared/schemas/movie.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Users) private readonly usersRepo: Repository<Users>,
    @InjectRepository(TheaterOrmEntity) private readonly theatersRepo: Repository<TheaterOrmEntity>,
    @InjectRepository(Screen) private readonly screensRepo: Repository<Screen>,
    @InjectRepository(Showtime) private readonly showtimeRepo: Repository<Showtime>,
    @InjectRepository(Movie) private readonly movieRepo: Repository<Movie>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(EmailLog) private readonly emailLogRepo: Repository<EmailLog>,
    private readonly queueService: QueueService,
  ) {}

  async getStats(): Promise<DashboardStatsResponseDto> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const startOfWeek = this.getStartOfWeek(startOfToday);
    const startOfNextWeek = new Date(startOfWeek);
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(startOfMonth);
    startOfNextMonth.setMonth(startOfNextMonth.getMonth() + 1);

    const [
      totalUsers,
      activeUsers,
      totalTheaters,
      totalScreens,
      nowShowingMovies,
      upcomingShowtimes,
      totalBookings,
      bookingsToday,
      bookingsThisWeek,
      bookingsThisMonth,
      revenueTotalRaw,
      revenueTodayRaw,
      revenueThisWeekRaw,
      revenueThisMonthRaw,
      ticketsTodayRaw,
      ticketsThisMonthRaw,
      emailStats,
      queueStats,
      revenueByPaymentMethodRaw,
      revenueDailyRaw,
      revenueMonthlyRaw,
      ticketsDailyRaw,
      topMoviesRaw,
      topTheatersRaw,
    ] = await Promise.all([
      this.usersRepo.count(),
      this.usersRepo.count({ where: { status: UserStatus.ACTIVE } }),
      this.theatersRepo.count(),
      this.screensRepo.count(),
      
      this.movieRepo
        .createQueryBuilder('movie')
        .where('COALESCE(movie.start_date, movie.release_date) <= :now', { now })
        .andWhere('(movie.end_date IS NULL OR movie.end_date >= :now)', { now })
        .getCount(),
      this.showtimeRepo.createQueryBuilder('showtime').where('showtime.start_time >= :now', { now }).getCount(),
      this.bookingRepo.count(),
      this.bookingRepo
        .createQueryBuilder('booking')
        .where('booking.created_at >= :start AND booking.created_at < :end', {
          start: startOfToday,
          end: startOfTomorrow,
        })
        .getCount(),
      this.bookingRepo
        .createQueryBuilder('booking')
        .where('booking.created_at >= :start AND booking.created_at < :end', {
          start: startOfWeek,
          end: startOfNextWeek,
        })
        .getCount(),
      this.bookingRepo
        .createQueryBuilder('booking')
        .where('booking.created_at >= :start AND booking.created_at < :end', {
          start: startOfMonth,
          end: startOfNextMonth,
        })
        .getCount(),
      this.paymentRepo
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'sum')
        .where('payment.payment_status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne(),
      this.paymentRepo
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'sum')
        .where('payment.payment_status = :status', { status: PaymentStatus.COMPLETED })
        .andWhere('payment.payment_time IS NOT NULL')
        .andWhere('payment.payment_time >= :start AND payment.payment_time < :end', {
          start: startOfToday,
          end: startOfTomorrow,
        })
        .getRawOne(),
      this.paymentRepo
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'sum')
        .where('payment.payment_status = :status', { status: PaymentStatus.COMPLETED })
        .andWhere('payment.payment_time IS NOT NULL')
        .andWhere('payment.payment_time >= :start AND payment.payment_time < :end', {
          start: startOfWeek,
          end: startOfNextWeek,
        })
        .getRawOne(),
      this.paymentRepo
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'sum')
        .where('payment.payment_status = :status', { status: PaymentStatus.COMPLETED })
        .andWhere('payment.payment_time IS NOT NULL')
        .andWhere('payment.payment_time >= :start AND payment.payment_time < :end', {
          start: startOfMonth,
          end: startOfNextMonth,
        })
        .getRawOne(),
      this.bookingRepo
        .createQueryBuilder('booking')
        .select('COALESCE(SUM(booking.total_seat), 0)', 'sum')
        .where('booking.created_at >= :start AND booking.created_at < :end', {
          start: startOfToday,
          end: startOfTomorrow,
        })
        .getRawOne(),
      this.bookingRepo
        .createQueryBuilder('booking')
        .select('COALESCE(SUM(booking.total_seat), 0)', 'sum')
        .where('booking.created_at >= :start AND booking.created_at < :end', {
          start: startOfMonth,
          end: startOfNextMonth,
        })
        .getRawOne(),
      this.getEmailLogStats(),
      this.getQueueStatsSafe(),
      
      this.paymentRepo
        .createQueryBuilder('payment')
        .select('payment.payment_method', 'method')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
        .where('payment.payment_status = :status', { status: PaymentStatus.COMPLETED })
        .groupBy('payment.payment_method')
        .getRawMany(),
      
      this.paymentRepo
        .createQueryBuilder('payment')
        .select("DATE(payment.payment_time)", 'date')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
        .where('payment.payment_status = :status', { status: PaymentStatus.COMPLETED })
        .andWhere('payment.payment_time IS NOT NULL')
        .andWhere('payment.payment_time >= :start', { start: new Date(now.getTime() - 30 * 24 * 3600 * 1000) })
        .groupBy('DATE(payment.payment_time)')
        .orderBy('DATE(payment.payment_time)', 'ASC')
        .getRawMany(),
      
      this.paymentRepo
        .createQueryBuilder('payment')
        .select("DATE_FORMAT(payment.payment_time, '%Y-%m')", 'month')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
        .where('payment.payment_status = :status', { status: PaymentStatus.COMPLETED })
        .andWhere('payment.payment_time IS NOT NULL')
        .andWhere('payment.payment_time >= :start', { start: new Date(now.getFullYear(), now.getMonth() - 11, 1) })
        .groupBy("DATE_FORMAT(payment.payment_time, '%Y-%m')")
        .orderBy("DATE_FORMAT(payment.payment_time, '%Y-%m')", 'ASC')
        .getRawMany(),
      
      this.bookingRepo
        .createQueryBuilder('booking')
        .select('DATE(booking.created_at)', 'date')
        .addSelect('COALESCE(SUM(booking.total_seat), 0)', 'count')
        .where('booking.created_at >= :start', { start: new Date(now.getTime() - 30 * 24 * 3600 * 1000) })
        .groupBy('DATE(booking.created_at)')
        .orderBy('DATE(booking.created_at)', 'ASC')
        .getRawMany(),
    
      this.paymentRepo
        .createQueryBuilder('payment')
        .innerJoin('Bookings', 'booking', 'booking.id = payment.booking_id')
        .innerJoin('ShowTimes', 'showtime', 'showtime.id = booking.showtime_id')
        .innerJoin('Movies', 'movie', 'movie.id = showtime.movie_id')
        .select('movie.id', 'movieId')
        .addSelect('movie.title', 'title')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'revenue')
        .where('payment.payment_status = :status', { status: PaymentStatus.COMPLETED })
        .groupBy('movie.id, movie.title')
        .orderBy('revenue', 'DESC')
        .limit(5)
        .getRawMany(),

      this.paymentRepo
        .createQueryBuilder('payment')
        .innerJoin('Bookings', 'booking', 'booking.id = payment.booking_id')
        .innerJoin('ShowTimes', 'showtime', 'showtime.id = booking.showtime_id')
        .innerJoin('Screens', 'screen', 'screen.id = showtime.screen_id')
        .innerJoin('Theaters', 'theater', 'theater.id = screen.theater_id')
        .select('theater.id', 'theaterId')
        .addSelect('theater.name', 'name')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'revenue')
        .where('payment.payment_status = :status', { status: PaymentStatus.COMPLETED })
        .groupBy('theater.id, theater.name')
        .orderBy('revenue', 'DESC')
        .limit(5)
        .getRawMany(),
    ]);

    const revenueTotal = this.parseDecimal(revenueTotalRaw?.sum);
    const revenueToday = this.parseDecimal(revenueTodayRaw?.sum);
    const revenueThisWeek = this.parseDecimal(revenueThisWeekRaw?.sum);
    const revenueThisMonth = this.parseDecimal(revenueThisMonthRaw?.sum);
    const ticketsSoldToday = Number(ticketsTodayRaw?.sum ?? 0);
    const ticketsSoldThisMonth = Number(ticketsThisMonthRaw?.sum ?? 0);

    const nowShowingCount = Number(nowShowingMovies ?? 0);

    return {
      totals: {
        users: totalUsers,
        activeUsers,
        theaters: totalTheaters,
        screens: totalScreens,
        movies: nowShowingCount,
        showtimesUpcoming: upcomingShowtimes,
      },
      bookings: {
        total: totalBookings,
        today: bookingsToday,
        thisWeek: bookingsThisWeek,
        thisMonth: bookingsThisMonth,
      },
      revenue: {
        total: revenueTotal,
        today: revenueToday,
        thisWeek: revenueThisWeek,
        thisMonth: revenueThisMonth,
      },
      tickets: {
        soldToday: ticketsSoldToday,
        soldThisMonth: ticketsSoldThisMonth,
      },
      emails: emailStats,
      queue: queueStats,
      charts: {
        revenueDaily: revenueDailyRaw.map((r: any) => ({ date: this.asDateString(r.date), amount: this.parseDecimal(r.amount) })),
        revenueMonthly: revenueMonthlyRaw.map((r: any) => ({ month: String(r.month), amount: this.parseDecimal(r.amount) })),
        ticketsDaily: ticketsDailyRaw.map((r: any) => ({ date: this.asDateString(r.date), count: Number(r.count ?? 0) })),
      },
      top: {
        topMoviesByRevenue: topMoviesRaw.map((r: any) => ({ movieId: Number(r.movieId), title: String(r.title), revenue: this.parseDecimal(r.revenue) })),
        topTheatersByRevenue: topTheatersRaw.map((r: any) => ({ theaterId: Number(r.theaterId), name: String(r.name), revenue: this.parseDecimal(r.revenue) })),
      },
      revenueByPaymentMethod: revenueByPaymentMethodRaw.map((r: any) => ({ method: String(r.method), amount: this.parseDecimal(r.amount) })),
    };
  }

  private parseDecimal(value: unknown): number {
    if (value == null) return 0;
    const num = typeof value === 'string' ? Number(value) : (value as number);
    return Number.isNaN(num) ? 0 : num;
  }

  private getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay() || 7; 
    result.setDate(result.getDate() - (day - 1));
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private async getEmailLogStats() {
    const [total, sent, failed, pending] = await Promise.all([
      this.emailLogRepo.count(),
      this.emailLogRepo.count({ where: { status: 'SENT' } }),
      this.emailLogRepo.count({ where: { status: 'FAILED' } }),
      this.emailLogRepo.count({ where: { status: 'PENDING' } }),
    ]);

    return { total, sent, failed, pending };
  }

  private async getQueueStatsSafe() {
    try {
      return await this.queueService.getQueueStats();
    } catch (error) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        total: 0,
        error: error instanceof Error ? error.message : 'Unable to connect to queue',
      };
    }
  }

  private asDateString(d: any): string {
    if (d instanceof Date) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return String(d);
  }
}



