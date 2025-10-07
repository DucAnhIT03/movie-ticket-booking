import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;
  private logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT || 587),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@cinema.com',
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error('Failed to send email', err);
      throw err;
    }
  }

  buildBookingConfirmationHtml(booking: any) {
    return `<h3>Booking Confirmation #${booking.id}</h3>
      <p>Movie: ${booking.showtime.movie.title}</p>
      <p>Time: ${booking.showtime.start_time}</p>
      <p>Seats: ${booking.seats.map(s => s.seat.seat_number).join(', ')}</p>
      <p>Total: ${booking.total_price_movie}</p>`;
  }
}
