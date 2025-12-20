import { Controller, Get, Delete, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminGuard } from '../../common/guards/admin.guard';
import { RedisCacheService } from './redis-cache.service';

@ApiTags('Cache Management')
@Controller('admin/cache')
@UseGuards(AdminGuard)
@ApiBearerAuth('jwt')
export class CacheController {
  constructor(private readonly cacheService: RedisCacheService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê cache (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Thống kê cache',
    schema: {
      example: {
        available: true,
        stats: { keys: 150, memory: '2.5M' }
      }
    }
  })
  async getStats() {
    const available = this.cacheService.isAvailable();
    const stats = await this.cacheService.getStats();
    
    return {
      available,
      stats,
    };
  }

  @Delete('flush')
  @ApiOperation({ summary: 'Xóa toàn bộ cache (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cache đã được xóa' })
  async flushAll() {
    const success = await this.cacheService.flushAll();
    return { 
      success, 
      message: success ? 'Cache đã được xóa thành công' : 'Không thể xóa cache' 
    };
  }

  @Delete('movies')
  @ApiOperation({ summary: 'Xóa cache phim (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cache phim đã được xóa' })
  async invalidateMovies() {
    await this.cacheService.invalidateMovies();
    return { success: true, message: 'Cache phim đã được xóa' };
  }

  @Delete('theaters')
  @ApiOperation({ summary: 'Xóa cache rạp chiếu (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cache rạp chiếu đã được xóa' })
  async invalidateTheaters() {
    await this.cacheService.invalidateTheaters();
    return { success: true, message: 'Cache rạp chiếu đã được xóa' };
  }

  @Delete('showtimes')
  @ApiOperation({ summary: 'Xóa cache suất chiếu (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cache suất chiếu đã được xóa' })
  async invalidateShowtimes() {
    await this.cacheService.invalidateShowtimes();
    return { success: true, message: 'Cache suất chiếu đã được xóa' };
  }

  @Delete('banners')
  @ApiOperation({ summary: 'Xóa cache banner (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cache banner đã được xóa' })
  async invalidateBanners() {
    await this.cacheService.invalidateBanners();
    return { success: true, message: 'Cache banner đã được xóa' };
  }

  @Delete('news')
  @ApiOperation({ summary: 'Xóa cache tin tức (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cache tin tức đã được xóa' })
  async invalidateNews() {
    await this.cacheService.invalidateNews();
    return { success: true, message: 'Cache tin tức đã được xóa' };
  }

  @Delete('pattern/:pattern')
  @ApiOperation({ summary: 'Xóa cache theo pattern (Admin only)' })
  @ApiParam({ name: 'pattern', description: 'Pattern để xóa (vd: movies, theaters)', example: 'movies' })
  @ApiResponse({ status: 200, description: 'Cache đã được xóa' })
  async invalidateByPattern(@Param('pattern') pattern: string) {
    const deleted = await this.cacheService.delByPattern(`${pattern}*`);
    return { 
      success: true, 
      deletedKeys: deleted,
      message: `Đã xóa ${deleted} keys với pattern: ${pattern}*` 
    };
  }
}


