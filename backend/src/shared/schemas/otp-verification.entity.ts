import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum OtpPurpose {
  REGISTER = 'REGISTER',
  RESET_PASSWORD = 'RESET_PASSWORD',
  CHANGE_EMAIL = 'CHANGE_EMAIL',
  ADMIN_RESET_CODE = 'ADMIN_RESET_CODE', // dùng cho mã 8 ký tự khi admin duyệt reset
}

@Entity({ name: 'otp_verifications' })
export class OtpVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  email: string;

  @Column({ name: 'otp_code', length: 12 })
  otpCode: string;

  @Column({
    type: 'enum',
    enum: OtpPurpose,
    default: OtpPurpose.REGISTER,
  })
  purpose: OtpPurpose;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  @Column({ name: 'is_used', type: 'bit', default: false })
  isUsed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


