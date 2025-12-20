import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PasswordResetRequest } from '../../../shared/schemas/password-reset-request.entity';

@Injectable()
export class PasswordResetRequestRepository extends Repository<PasswordResetRequest> {
  constructor(private dataSource: DataSource) {
    super(PasswordResetRequest, dataSource.createEntityManager());
  }
}

