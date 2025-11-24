import { IsEmail, IsString, IsOptional, IsEnum, IsObject, IsNumber, IsArray } from 'class-validator';
import { EmailType, EmailPriority } from '../constants/email.constants';

export class BaseEmailDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  from?: string;
}

export class BookingConfirmationEmailDto extends BaseEmailDto {
  @IsNumber()
  bookingId: number;

  @IsString()
  movieTitle: string;

  @IsString()
  theaterName: string;

  @IsString()
  screenName: string;

  showTime: Date;

  @IsArray()
  @IsString({ each: true })
  seats: string[];

  @IsNumber()
  totalPrice: number;

  @IsString()
  userName: string;

  bookingDate: Date;
}

export class BookingInvoiceEmailDto extends BookingConfirmationEmailDto {
  @IsString()
  invoiceNumber: string;

  @IsString()
  paymentMethod: string;

  @IsString()
  paymentStatus: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  paymentDate?: Date;
}

export class RegistrationEmailDto extends BaseEmailDto {
  @IsString()
  userName: string;

  @IsOptional()
  @IsString()
  confirmationLink?: string;
}

export class PasswordResetEmailDto extends BaseEmailDto {
  @IsString()
  userName: string;

  @IsString()
  resetLink: string;

  @IsNumber()
  expiresIn: number;
}

export class PasswordChangedEmailDto extends BaseEmailDto {
  @IsString()
  userName: string;

  changedAt: Date;
}

export class WelcomeEmailDto extends BaseEmailDto {
  @IsString()
  userName: string;
}

export class PaymentReceiptEmailDto extends BaseEmailDto {
  @IsNumber()
  bookingId: number;

  @IsString()
  transactionId: string;

  @IsNumber()
  amount: number;

  @IsString()
  paymentMethod: string;

  paymentDate: Date;

  @IsString()
  userName: string;
}

export class BookingCancelledEmailDto extends BaseEmailDto {
  @IsNumber()
  bookingId: number;

  @IsString()
  movieTitle: string;

  @IsOptional()
  @IsNumber()
  refundAmount?: number;

  cancelledAt: Date;

  @IsString()
  userName: string;
}

export class BookingUpdatedEmailDto extends BaseEmailDto {
  @IsNumber()
  bookingId: number;

  @IsOptional()
  oldShowTime?: Date;

  newShowTime: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  oldSeats?: string[];

  @IsArray()
  @IsString({ each: true })
  newSeats: string[];

  @IsString()
  changesSummary: string;

  @IsString()
  userName: string;
}

export class AdminNotificationEmailDto extends BaseEmailDto {
  @IsString()
  message: string;

  @IsString()
  notificationType: string;

  date: Date;
}

export class VerificationOtpEmailDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  userName: string;

  @IsString()
  otpCode: string;

  @IsNumber()
  expiresIn: number; 
}

export class ShowtimeReminderEmailDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  userName: string;

  @IsNumber()
  bookingId: number;

  @IsString()
  movieTitle: string;

  @IsString()
  theaterName: string;

  @IsString()
  screenName: string;

  showTime: Date;

  @IsArray()
  @IsString({ each: true })
  seats: string[];

  @IsString()
  reminderTime: string; 
}

export class PromotionNotificationEmailDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  userName: string;

  @IsString()
  promotionTitle: string;

  @IsString()
  promotionDescription: string;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @IsOptional()
  @IsEnum(['PERCENT', 'AMOUNT'])
  discountType?: 'PERCENT' | 'AMOUNT';

  @IsOptional()
  validUntil?: Date;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class FestivalNotificationEmailDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  userName: string;

  @IsString()
  festivalTitle: string;

  @IsOptional()
  @IsString()
  festivalDescription?: string;

  startDate: Date;

  endDate: Date;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featuredMovies?: string[];
}

export class QueuedEmailDto {
  @IsEnum(EmailType)
  type: EmailType;

  @IsEmail()
  to: string;

  @IsObject()
  data: any;

  @IsOptional()
  @IsNumber()
  priority?: EmailPriority;

  @IsOptional()
  @IsNumber()
  delay?: number;
}



