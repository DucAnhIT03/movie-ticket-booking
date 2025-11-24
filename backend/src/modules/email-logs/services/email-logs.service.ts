import { Injectable, NotFoundException } from '@nestjs/common';
import type { EmailLogEntity } from '../../../shared/types/email-log';
import { EmailLogsRepository } from '../repositories/email-logs.repository';

@Injectable()
export class EmailLogsService {
  constructor(private readonly repo: EmailLogsRepository) {}

  async findAll(params?: { page?: number; limit?: number; search?: string; status?: string; type?: string }): Promise<{ items: EmailLogEntity[]; total: number; page: number; limit: number; totalPages: number }>{
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.max(1, Math.min(100, params?.limit ?? 10));
    const { items, total } = await this.repo.findAndCount({ 
      page, 
      limit, 
      search: params?.search, 
      status: params?.status,
      type: params?.type
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<EmailLogEntity> {
    const ent = await this.repo.findById(id);
    if (!ent) throw new NotFoundException('Email log not found');
    return ent;
  }

  async getStats(): Promise<{ total: number; sent: number; failed: number; pending: number }> {
    return this.repo.getStats();
  }
}


