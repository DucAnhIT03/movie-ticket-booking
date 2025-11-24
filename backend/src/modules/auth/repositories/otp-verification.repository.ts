import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { OtpVerification } from '../../../shared/schemas/otp-verification.entity';

@Injectable()
export class OtpVerificationRepository extends Repository<OtpVerification> {
  constructor(private dataSource: DataSource) {
    super(OtpVerification, dataSource.createEntityManager());
  }
}

