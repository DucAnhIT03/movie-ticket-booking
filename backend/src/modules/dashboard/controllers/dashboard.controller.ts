import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { DashboardStatsResponseDto } from '../dtos/response/dashboard-stats.response.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';

@ApiTags('Dashboard')
@ApiBearerAuth('jwt')
@UseGuards(AdminGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê tổng quan cho dashboard - Chỉ admin' })
  @ApiOkResponse({ description: 'Thống kê tổng quan', type: DashboardStatsResponseDto })
  async getStats(): Promise<DashboardStatsResponseDto> {
    return this.dashboardService.getStats();
  }
}



