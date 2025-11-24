import { Injectable, BadRequestException } from '@nestjs/common';
import { OtpVerificationRepository } from '../repositories/otp-verification.repository';
import { OtpPurpose } from '../../../shared/schemas/otp-verification.entity';
import { QueueService } from '../../../providers/queue/queue.service';
import { VerificationOtpEmailDto } from '../../../providers/mail/dto/email.dto';

@Injectable()
export class OtpService {
  private readonly OTP_EXPIRY_MINUTES = 10; // OTP hết hạn sau 10 phút

  constructor(
    private otpRepo: OtpVerificationRepository,
    private queueService: QueueService,
  ) {}

  /**
   * Generate random 6-digit OTP code
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to email
   */
  async sendOtp(email: string, purpose: OtpPurpose = OtpPurpose.REGISTER): Promise<void> {
    // Xóa các OTP cũ chưa sử dụng của email này
    await this.otpRepo.delete({
      email,
      isUsed: false,
    } as any);

    // Tạo OTP mới
    const otpCode = this.generateOtpCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    const otp = this.otpRepo.create({
      email,
      otpCode,
      purpose,
      expiresAt,
      isUsed: false,
    });

    await this.otpRepo.save(otp as any);

    // Gửi email OTP qua queue
    const emailData: VerificationOtpEmailDto = {
      to: email,
      userName: email.split('@')[0], // Lấy phần trước @ làm tên
      otpCode,
      expiresIn: this.OTP_EXPIRY_MINUTES,
    };

    await this.queueService.enqueueVerificationOtpEmail(emailData);
  }

  /**
   * Verify OTP code (chỉ kiểm tra, không đánh dấu isUsed)
   */
  async verifyOtp(email: string, otpCode: string, purpose: OtpPurpose = OtpPurpose.REGISTER, markAsUsed: boolean = false): Promise<boolean> {
    const otp = await this.otpRepo.findOne({
      where: {
        email,
        otpCode,
        purpose,
        isUsed: false,
      } as any,
      order: {
        createdAt: 'DESC',
      },
    } as any);

    if (!otp) {
      throw new BadRequestException('Mã OTP không hợp lệ');
    }

    // Kiểm tra OTP đã hết hạn chưa
    if (new Date() > otp.expiresAt) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới');
    }

    // Chỉ đánh dấu OTP đã sử dụng nếu markAsUsed = true
    if (markAsUsed) {
      otp.isUsed = true;
      await this.otpRepo.save(otp as any);
    }

    return true;
  }
}

