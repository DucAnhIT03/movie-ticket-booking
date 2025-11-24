import { Injectable, Logger } from '@nestjs/common';
import Twilio from 'twilio';

@Injectable()
export class SmsService {
  private client;
  private logger = new Logger(SmsService.name);

  constructor() {
    const sid = process.env.TWILIO_SID;
    const token = process.env.TWILIO_TOKEN;
    if (sid && token) {
      this.client = Twilio(sid, token);
    }
  }

  async sendSms(to: string, body: string) {
    if (!this.client) {
      this.logger.warn('Twilio not configured - SMS not sent');
      return null;
    }
    try {
      const msg = await this.client.messages.create({
        body,
        from: process.env.TWILIO_PHONE,
        to,
      });
      this.logger.log(`SMS sent: ${msg.sid}`);
      return msg;
    } catch (err) {
      this.logger.error('Failed to send SMS', err);
      throw err;
    }
  }

  buildBookingSms(booking: any) {
    return `Booking #${booking.id} confirmed. Movie: ${booking.showtime.movie.title}. Showtime: ${booking.showtime.start_time}. Seats: ${booking.seats.map(s => s.seat.seat_number).join(', ')}.`;
  }
}
