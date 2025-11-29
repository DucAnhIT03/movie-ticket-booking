import { ArrayNotEmpty, ArrayUnique, IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum AdminNotificationCategory {
  GENERAL = 'GENERAL',
  PROMOTION = 'PROMOTION',
  EVENT = 'EVENT',
  SYSTEM = 'SYSTEM',
  NEWS = 'NEWS',
}

export class AdminSendEmailDto {
  @IsOptional()
  @IsEmail()
  to?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEmail({}, { each: true })
  recipients?: string[];

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsEnum(AdminNotificationCategory)
  notificationType?: AdminNotificationCategory;
}




