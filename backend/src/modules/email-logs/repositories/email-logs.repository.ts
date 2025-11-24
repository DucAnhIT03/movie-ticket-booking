import type { EmailLogEntity } from '../../../shared/types/email-log';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { EmailLog } from '../../../shared/schemas/email-log.entity';

@Injectable()
export class EmailLogsRepository {
  constructor(@InjectRepository(EmailLog) private readonly repo: Repository<EmailLog>) {}

  async findAndCount(params: { page: number; limit: number; search?: string; status?: string; type?: string }): Promise<{ items: EmailLogEntity[]; total: number }>{
    const query = this.repo.createQueryBuilder('email_log');
    
    if (params.search) {
      const searchId = Number(params.search);
      const isValidId = !isNaN(searchId) && searchId > 0;
      
      query.where(
        new Brackets((qb) => {
          if (isValidId) {
            qb.where('email_log.id = :searchId', { searchId })
              .orWhere('email_log.to LIKE :search', { search: `%${params.search}%` })
              .orWhere('email_log.subject LIKE :search', { search: `%${params.search}%` })
              .orWhere('email_log.messageId LIKE :search', { search: `%${params.search}%` });
          } else {
            qb.where('email_log.to LIKE :search', { search: `%${params.search}%` })
              .orWhere('email_log.subject LIKE :search', { search: `%${params.search}%` })
              .orWhere('email_log.messageId LIKE :search', { search: `%${params.search}%` });
          }
        }),
      );
    }

    if (params.status) {
      query.andWhere('email_log.status = :status', { status: params.status });
    }

    if (params.type) {
      query.andWhere('email_log.type = :type', { type: params.type });
    }
    
    query.orderBy('email_log.sentAt', 'DESC');
    query.skip((params.page - 1) * params.limit).take(params.limit);
    
    const [rows, total] = await query.getManyAndCount();
    return { items: rows as unknown as EmailLogEntity[], total };
  }

  async findById(id: number): Promise<EmailLogEntity | null> {
    const row = await this.repo.findOne({ where: { id } });
    return (row as unknown as EmailLogEntity) ?? null;
  }

  async getStats(): Promise<{ total: number; sent: number; failed: number; pending: number }> {
    const [total, sent, failed, pending] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { status: 'SENT' } }),
      this.repo.count({ where: { status: 'FAILED' } }),
      this.repo.count({ where: { status: 'PENDING' } }),
    ]);

    return { total, sent, failed, pending };
  }
}


