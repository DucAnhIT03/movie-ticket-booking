import { Injectable, BadRequestException } from '@nestjs/common';
import { OtpVerificationRepository } from '../repositories/otp-verification.repository';
import { OtpPurpose } from '../../../shared/schemas/otp-verification.entity';
import { QueueService } from '../../../providers/queue/queue.service';
import { VerificationOtpEmailDto } from '../../../providers/mail/dto/email.dto';

@Injectable()
export class OtpService {
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly RESET_PASSWORD_EXPIRY_MINUTES = 1;
  constructor(
    private otpRepo: OtpVerificationRepository,
    private queueService: QueueService,
  ) {}

 
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  
  async sendOtp(email: string, purpose: OtpPurpose = OtpPurpose.REGISTER): Promise<void> {
    
    await this.otpRepo.delete({
      email,
      isUsed: false,
    } as any);

    
    const otpCode = this.generateOtpCode();
    const expiresAt = new Date();
    const expiryMinutes = purpose === OtpPurpose.RESET_PASSWORD ? this.RESET_PASSWORD_EXPIRY_MINUTES : this.OTP_EXPIRY_MINUTES;
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    const otp = this.otpRepo.create({
      email,
      otpCode,
      purpose,
      expiresAt,
      isUsed: false,
    });

    await this.otpRepo.save(otp as any);

    
    const emailData: VerificationOtpEmailDto = {
      to: email,
      userName: email.split('@')[0], 
      otpCode,
      expiresIn: expiryMinutes,
    };

    await this.queueService.enqueueVerificationOtpEmail(emailData);
  }

  
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

   
    if (new Date() > otp.expiresAt) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới');
    }

    
    if (markAsUsed) {
      otp.isUsed = true;
      await this.otpRepo.save(otp as any);
    }

    return true;
  }
}

