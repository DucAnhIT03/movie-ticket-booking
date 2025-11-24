import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EmailLogsService } from '../services/email-logs.service';
import { EmailLogResponseDto } from '../dtos/response/email-logs.response.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';

@ApiTags('Email Logs')
@Controller('email-logs')
export class EmailLogsController {
  constructor(private readonly service: EmailLogsService) {}

  @Get()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Lấy danh sách email logs (có phân trang, tìm kiếm & lọc theo trạng thái/loại) - Chỉ admin' })
  @ApiOkResponse({ 
    description: 'Danh sách email logs (có phân trang, tìm kiếm & lọc theo trạng thái/loại)', 
    schema: {
      example: {
        items: [
          {
            id: 1,
            to: 'user@example.com',
            subject: 'Welcome to Cinema',
            type: 'WELCOME',
            status: 'SENT',
            error: null,
            messageId: 'abc123',
            sentAt: '2025-01-01T00:00:00.000Z',
            metadata: {}
          }
        ],
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10
      }
    }
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Trang hiện tại (>=1)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Số bản ghi mỗi trang (<=100)' })
  @ApiQuery({ name: 'search', required: false, example: 'user@example.com', description: 'Tìm kiếm theo ID, email, subject hoặc messageId' })
  @ApiQuery({ name: 'status', required: false, example: 'SENT', enum: ['PENDING', 'SENT', 'FAILED'], description: 'Lọc theo trạng thái' })
  @ApiQuery({ name: 'type', required: false, example: 'WELCOME', description: 'Lọc theo loại email' })
  async list(
    @Query('page') page?: string, 
    @Query('limit') limit?: string, 
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string
  ) {
    const result = await this.service.findAll({ 
      page: Number(page ?? 1), 
      limit: Number(limit ?? 10), 
      search: search ?? '',
      status: status,
      type: type
    });
    return {
      ...result,
      items: result.items.map(EmailLogResponseDto.fromEntity),
    };
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Lấy thống kê email logs - Chỉ admin' })
  @ApiOkResponse({ 
    description: 'Thống kê email logs',
    schema: {
      example: {
        total: 1000,
        sent: 950,
        failed: 30,
        pending: 20
      }
    }
  })
  async getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một email log - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của email log' })
  @ApiOkResponse({ description: 'Chi tiết email log', type: EmailLogResponseDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy email log' })
  async detail(@Param('id', ParseIntPipe) id: number) {
    const ent = await this.service.findOne(id);
    return EmailLogResponseDto.fromEntity(ent);
  }
}


