import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { BookingsService } from 'src/modules/bookings/services/bookings.service';
import { AdminFilterBookingDto } from 'src/modules/bookings/dtos/request/admin-filter-booking.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { StaffGuard } from '../../../common/guards/staff.guard';
import { CreateOfflineBookingDto } from '../dtos/request/create-offline-booking.dto';
import { OfflineBookingQuoteDto } from '../dtos/request/offline-booking-quote.dto';
import type { Request } from 'express';

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
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Từ khóa tìm kiếm (ID vé, mã hóa đơn, số điện thoại, tên user, tên phim)' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Lọc từ ngày tạo vé (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Lọc đến ngày tạo vé (YYYY-MM-DD)',
  })
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

  @Post('offline')
  @UseGuards(StaffGuard)
  @ApiOperation({
    summary: 'Nhân viên xuất vé tại quầy',
    description: 'Cho phép nhân viên hoặc admin giữ ghế và tạo booking tiền mặt, trả về thông tin vé vừa tạo.',
  })
  @ApiBody({ type: CreateOfflineBookingDto })
  @ApiResponse({
    status: 201,
    description: 'Xuất vé thành công',
    schema: {
      example: {
        booking: { id: 999, customerName: 'Nguyễn Văn A', totalPriceMovie: 320000 },
        pricing: {
          totalPrice: 320000,
          seats: [{ seatId: 10, seatNumber: 'H5', seatType: 'VIP', price: 160000 }],
        },
        message: 'Xuất vé tại quầy thành công',
      },
    },
  })
  async createOfflineBooking(@Req() req: Request, @Body() dto: CreateOfflineBookingDto) {
    return this.bookingsService.createOfflineBooking(req.user as any, dto);
  }

  @Post('offline/quote')
  @UseGuards(StaffGuard)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Tính tạm thời số tiền cần thu cho vé tại quầy',
    description: 'Trả về tổng tiền và chi tiết giá của từng ghế dựa trên cấu hình giá vé.',
  })
  @ApiBody({ type: OfflineBookingQuoteDto })
  @ApiResponse({
    status: 200,
    description: 'Thông tin giá vé đã được tính',
    schema: {
      example: {
        showtimeId: 5,
        totalPrice: 320000,
        currency: 'VND',
        seats: [
          { seatId: 10, seatNumber: 'H5', seatType: 'VIP', price: 160000 },
          { seatId: 11, seatNumber: 'H6', seatType: 'VIP', price: 160000 },
        ],
      },
    },
  })
  async previewOfflineBooking(@Req() req: Request, @Body() dto: OfflineBookingQuoteDto) {
    return this.bookingsService.previewOfflineBooking(req.user as any, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Xóa vé đã đặt',
    description: 'Xóa vé đã đặt khỏi hệ thống. Chỉ admin mới có quyền xóa vé.',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa vé thành công',
    schema: {
      example: {
        message: 'Xóa vé thành công',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy vé' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async deleteBooking(@Param('id') id: string) {
    const bookingId = parseInt(id, 10);
    if (isNaN(bookingId) || bookingId <= 0) {
      throw new BadRequestException('ID vé không hợp lệ');
    }
    return this.bookingsService.deleteBooking(bookingId);
  }
}
