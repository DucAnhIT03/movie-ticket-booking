import { Injectable } from '@nestjs/common';
import { QueueService } from '../../queue/queue.service';
import { MailService } from '../mail.service';
import { EmailType, EMAIL_TEMPLATES } from '../constants/email.constants';

@Injectable()
export class BookingService {
  constructor(
    private readonly queueService: QueueService,
    private readonly mailService: MailService,
  ) {}


  async createBooking(data: {
    userId: number;
    showTimeId: number;
    seatIds: number[];
    userEmail: string;
    userName: string;
  }) {
 
    const booking = {
      id: 12345,
      userId: data.userId,
      showTime: {
        id: data.showTimeId,
        movie: { title: 'Avatar: The Way of Water' },
        theater: { name: 'CGV Vincom' },
        screen: { name: 'Screen 1' },
        startTime: new Date('2024-01-15T18:00:00'),
      },
      seats: [
        { seatNumber: 'A1' },
        { seatNumber: 'A2' },
        { seatNumber: 'A3' },
      ],
      totalPrice: 300000,
      createdAt: new Date(),
    };

    await this.queueService.enqueueBookingConfirmationEmail({
      to: data.userEmail,
      bookingId: booking.id,
      movieTitle: booking.showTime.movie.title,
      theaterName: booking.showTime.theater.name,
      screenName: booking.showTime.screen.name,
      showTime: booking.showTime.startTime,
      seats: booking.seats.map(s => s.seatNumber),
      totalPrice: booking.totalPrice,
      userName: data.userName,
      bookingDate: booking.createdAt,
    });

    return booking;
  }


  async completePayment(bookingId: number, paymentData: {
    paymentMethod: string;
    transactionId: string;
    userEmail: string;
    userName: string;
  }) {
  

    const booking = await this.getBookingById(bookingId);

  
    await this.queueService.enqueueBookingInvoiceEmail({
      to: paymentData.userEmail,
      bookingId: booking.id,
      movieTitle: booking.showTime.movie.title,
      theaterName: booking.showTime.theater.name,
      screenName: booking.showTime.screen.name,
      showTime: booking.showTime.startTime,
      seats: booking.seats.map(s => s.seatNumber),
      totalPrice: booking.totalPrice,
      userName: paymentData.userName,
      bookingDate: booking.createdAt,
      invoiceNumber: `INV-${booking.id}`,
      paymentMethod: paymentData.paymentMethod,
      paymentStatus: 'COMPLETED',
      transactionId: paymentData.transactionId,
      paymentDate: new Date(),
    });

   
    await this.queueService.enqueueBookingConfirmationEmail({
      to: paymentData.userEmail,
      bookingId: booking.id,
      movieTitle: booking.showTime.movie.title,
      theaterName: booking.showTime.theater.name,
      screenName: booking.showTime.screen.name,
      showTime: booking.showTime.startTime,
      seats: booking.seats.map(s => s.seatNumber),
      totalPrice: booking.totalPrice,
      userName: paymentData.userName,
      bookingDate: booking.createdAt,
    });
  }

 
  async cancelBooking(bookingId: number) {
  

    const booking = await this.getBookingById(bookingId);


    await this.queueService.enqueueBookingCancelledEmail({
      to: booking.user.email,
      bookingId: booking.id,
      movieTitle: booking.showTime.movie.title,
      refundAmount: booking.totalPrice * 0.9, 
      cancelledAt: new Date(),
      userName: `${booking.user.firstName} ${booking.user.lastName}`,
    });

    return booking;
  }


  private async getBookingById(id: number) {
    return {
      id,
      user: {
        email: 'customer@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      showTime: {
        movie: { title: 'Avatar: The Way of Water' },
        theater: { name: 'CGV Vincom' },
        screen: { name: 'Screen 1' },
        startTime: new Date('2024-01-15T18:00:00'),
      },
      seats: [
        { seatNumber: 'A1' },
        { seatNumber: 'A2' },
        { seatNumber: 'A3' },
      ],
      totalPrice: 300000,
      createdAt: new Date(),
    };
  }


  async sendBulkBookingNotifications(bookingIds: number[]) {
    const bookings = await Promise.all(
      bookingIds.map(id => this.getBookingById(id))
    );

    const emails = bookings.map(booking => ({
      type: EmailType.BOOKING_CONFIRMATION,
      to: booking.user.email,
      subject: EMAIL_TEMPLATES[EmailType.BOOKING_CONFIRMATION].subject,
      data: {
        to: booking.user.email,
        bookingId: booking.id,
        movieTitle: booking.showTime.movie.title,
        theaterName: booking.showTime.theater.name,
        screenName: booking.showTime.screen.name,
        showTime: booking.showTime.startTime,
        seats: booking.seats.map(s => s.seatNumber),
        totalPrice: booking.totalPrice,
        userName: `${booking.user.firstName} ${booking.user.lastName}`,
        bookingDate: booking.createdAt,
      },
    }));

  
    await Promise.all(
      emails.map(email => this.queueService.enqueueMail(email))
    );
  }
}


@Injectable()
export class AuthService {
  constructor(
    private readonly queueService: QueueService,
    private readonly mailService: MailService,
  ) {}

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
 

    const user = {
      id: 1,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
    };

 
    await this.queueService.enqueueWelcomeEmail({
      to: user.email,
      subject: 'Welcome to Cinema!',
      userName: `${user.firstName} ${user.lastName}`,
    });

   
    await this.queueService.enqueueRegistrationEmail({
      to: user.email,
      subject: 'Registration Confirmed',
      userName: `${user.firstName} ${user.lastName}`,
      confirmationLink: `https://cinema.com/verify-email?token=abc123`,
    });

    return user;
  }

  async requestPasswordReset(email: string) {
  

    const resetLink = 'https://cinema.com/reset-password?token=abc123';
    const expiresIn = 60; 

   
    await this.queueService.enqueuePasswordResetEmail({
      to: email,
      subject: 'Reset Your Password',
      userName: 'User Name', 
      resetLink,
      expiresIn,
    });

    return { message: 'Password reset link sent to email' };
  }

  async changePassword(userId: number, newPassword: string) {


    const user = {
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    await this.mailService.sendPasswordChangedEmail({
      to: user.email,
      subject: 'Password Changed Successfully',
      userName: `${user.firstName} ${user.lastName}`,
      changedAt: new Date(),
    });

    return { message: 'Password changed successfully' };
  }
}


@Injectable()
export class NotificationService {
  constructor(private readonly mailService: MailService) {}

  async sendCustomEmail() {
 
    await this.mailService.send({
      to: 'user@example.com',
      subject: 'Custom Notification',
      html: '<h1>Custom Email Content</h1>',
      text: 'Plain text version',
    });
  }

  async sendBatchNotifications(users: Array<{ email: string; name: string }>) {
    const payloads = users.map(user => ({
      to: user.email,
      subject: `Hello ${user.name}!`,
      html: `<h1>Hello ${user.name}!</h1>`,
    }));


    await this.mailService.sendBatchEmails(payloads);
  }
}


@Injectable()
export class AdminService {
  constructor(private readonly queueService: QueueService) {}

  async getEmailStatistics() {
    const stats = await this.queueService.getQueueStats();
    
    console.log('Email Queue Statistics:');
    console.log(`Waiting: ${stats.waiting}`);
    console.log(`Active: ${stats.active}`);
    console.log(`Completed: ${stats.completed}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Total pending: ${stats.total}`);

    return stats;
  }

  async retryFailedEmails() {
    await this.queueService.retryFailedJobs();
    return { message: 'Retrying failed email jobs' };
  }

  async cleanupOldEmails(graceHours: number = 24) {
    const graceMs = graceHours * 60 * 60 * 1000;
    await this.queueService.cleanJobs(graceMs);
    return { message: `Cleaned jobs older than ${graceHours} hours` };
  }
}

