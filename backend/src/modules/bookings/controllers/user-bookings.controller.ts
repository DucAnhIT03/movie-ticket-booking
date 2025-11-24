import { Controller, Post, Get, Patch, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from 'src/modules/bookings/services/bookings.service';
import { FilterBookingDto } from 'src/modules/bookings/dtos/request/filter-booking.dto';
import { CancelBookingDto } from 'src/modules/bookings/dtos/request/cancel-booking.dto';
import { CreateBookingDto } from 'src/modules/bookings/dtos/request/create-booking.dto';
import { BookingResponseDto } from 'src/modules/bookings/dtos/response/bookings.response.dto';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('🎫 Vé của người dùng')
@ApiBearerAuth('jwt')
@Controller('bookings')
export class UserBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Đặt vé phim', 
    description: 'Đặt vé phim cho một suất chiếu cụ thể. Trạng thái ban đầu là PENDING. Cần thanh toán để hoàn tất.' 
  })
  @ApiBody({ 
    type: CreateBookingDto,
    examples: {
      basic: {
        summary: 'Đặt vé',
        value: {
          showtimeId: 5,
          seatIds: [10, 11],
          totalPriceMovie: 300000
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Đặt vé thành công (Trạng thái PENDING)',
    schema: {
      example: {
        id: 1,
        userId: 1,
        showtimeId: 5,
        totalSeat: 2,
        totalPriceMovie: 300000,
        created_at: '2025-01-15T10:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc ghế đã được đặt' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy suất chiếu hoặc ghế' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  create(@Req() req: Request, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(req.user as any, dto).then(booking => 
      BookingResponseDto.fromEntity(booking)
    );
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Lấy danh sách vé của tôi',
    description: 'Lấy danh sách vé đã đặt của người dùng hiện tại với phân trang và lọc theo trạng thái'
  })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'BOOKED', 'CANCELLED', 'FAILED'], description: 'Lọc theo trạng thái vé' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang (bắt đầu từ 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số lượng mỗi trang' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách vé của người dùng',
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
            showtime: {
              id: 5,
              startTime: '2025-01-20T18:00:00.000Z',
              movieId: 10
            }
          }
        ],
        total: 15,
        page: 1,
        limit: 10,
        totalPages: 2
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  getMyTickets(
    @Req() req: Request, 
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = (req.user as any)?.id || (req.user as any)?.sub;
    if (!userId) throw new Error('User not authenticated');
    const filter: FilterBookingDto = { 
      status: status as any,
      page,
      limit,
    };
    return this.bookingsService.findAll(userId, filter);
  }

  @Patch('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Hủy vé đã đặt', 
    description: 'Hủy một vé đã đặt. Không thể hủy nếu đã thanh toán thành công hoặc quá giờ chiếu.' 
  })
  @ApiBody({ 
    type: CancelBookingDto,
    examples: {
      basic: {
        summary: 'Hủy vé',
        value: {
          bookingId: 1
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Hủy vé thành công',
    schema: {
      example: {
        message: 'Booking cancelled successfully'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Không thể hủy vé (đã thanh toán hoặc quá giờ chiếu)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy vé' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  cancel(@Req() req: Request, @Body() dto: CancelBookingDto) {
    const userId = (req.user as any)?.id || (req.user as any)?.sub;
    if (!userId) throw new Error('User not authenticated');
    return this.bookingsService.cancelBooking(userId, dto);
  }
}
