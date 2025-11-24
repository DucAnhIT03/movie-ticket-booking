import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from 'src/modules/bookings/services/bookings.service';
import { AdminFilterBookingDto } from 'src/modules/bookings/dtos/request/admin-filter-booking.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';

@ApiTags('🛠️ Quản lý vé (Admin)')
@ApiBearerAuth('jwt')
@Controller('admin/bookings')
export class AdminBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ 
    summary: 'Quản lý: Tìm kiếm & Phân trang vé đặt',
    description: 'Lấy danh sách tất cả vé đã đặt trong hệ thống. Hỗ trợ tìm kiếm theo ID vé, tên user, tên phim và phân trang. Chỉ admin mới có quyền truy cập.'
  })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Từ khóa tìm kiếm (ID vé, tên user, tên phim)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'BOOKED', 'CANCELLED'], description: 'Lọc theo trạng thái' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang (bắt đầu từ 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số lượng mỗi trang' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách vé đặt đã phân trang',
    schema: {
      example: {
        items: [
          {
            id: 1,
            userId: 1,
            showtimeId: 5,
            totalSeat: 2,
            totalPriceMovie: 300000,
            created_at: '2025-01-15T10:00:00.000Z',
            user: {
              id: 1,
              firstName: 'Nguyen',
              lastName: 'Van A',
              email: 'user@example.com'
            },
            showtime: {
              id: 5,
              startTime: '2025-01-20T18:00:00.000Z',
              movieId: 10
            },
            payments: []
          }
        ],
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  getAll(@Query() filter: AdminFilterBookingDto) {
    return this.bookingsService.findAdminBookings(filter);
  }
}
