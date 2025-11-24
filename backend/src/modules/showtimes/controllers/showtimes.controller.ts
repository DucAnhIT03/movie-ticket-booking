import { Controller, Get, Post, Query, Param, Body, Put, Patch, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ShowtimesService } from '../services/showtimes.service';
import { CreateShowtimeDto } from '../dtos/request/create-showtime.dto';
import { ShowtimeResponseDto } from '../dtos/response/showtimes.response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';

@ApiTags('🎭 Suất chiếu')
@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Lấy danh sách suất chiếu (có tìm kiếm và phân trang)',
    description: 'Lấy danh sách suất chiếu với tìm kiếm, phân trang và sắp xếp'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang (bắt đầu từ 1, tối thiểu 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số lượng mỗi trang (tối thiểu 1, tối đa 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm kiếm theo ID suất chiếu, tên phim hoặc tên phòng chiếu' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['startTime', 'endTime', 'createdAt'], description: 'Cột sắp xếp' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], example: 'asc', description: 'Thứ tự sắp xếp' })
  @ApiQuery({ name: 'movieId', required: false, type: Number, description: 'Lọc theo ID phim' })
  @ApiQuery({ name: 'screenId', required: false, type: Number, description: 'Lọc theo ID phòng chiếu' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách suất chiếu đã phân trang',
    schema: {
      example: {
        items: [
          {
            id: 1,
            screenId: 2,
            movieId: 5,
            startTime: '2025-01-20T18:00:00.000Z',
            endTime: '2025-01-20T20:30:00.000Z',
            createdAt: '2025-01-15T10:00:00.000Z'
          }
        ],
        total: 50,
        page: 1,
        limit: 10,
        totalPages: 5
      }
    }
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('movieId') movieId?: string,
    @Query('screenId') screenId?: string,
  ) {
    return this.showtimesService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      sortBy: sortBy as 'startTime' | 'endTime' | 'createdAt' | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      movieId: movieId ? Number(movieId) : undefined,
      screenId: screenId ? Number(screenId) : undefined,
    });
  }

  @Get('movie/:movieId')
  @ApiOperation({ 
    summary: 'Lấy suất chiếu theo phim',
    description: 'Lấy tất cả suất chiếu của một phim cụ thể'
  })
  @ApiParam({ name: 'movieId', type: Number, description: 'ID phim' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách suất chiếu của phim',
    schema: {
      type: 'array',
      items: { $ref: '#/components/schemas/Showtime' }
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phim' })
  findByMovie(@Param('movieId') movieId: string) {
    return this.showtimesService.findByMovie(+movieId);
  }

  @Get('date')
  @ApiOperation({ 
    summary: 'Lấy suất chiếu theo ngày',
    description: 'Lấy tất cả suất chiếu trong một ngày cụ thể'
  })
  @ApiQuery({ name: 'date', required: true, description: 'Ngày chiếu (YYYY-MM-DD)', example: '2023-12-15' })
  @ApiQuery({
    name: 'timezoneOffset',
    required: false,
    description: 'Độ lệch phút giữa UTC và giờ địa phương (giống giá trị trả về từ new Date().getTimezoneOffset())',
    example: -420,
  })
  @ApiResponse({ status: 400, description: 'Định dạng ngày không hợp lệ (phải là YYYY-MM-DD)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách suất chiếu trong ngày',
    schema: {
      type: 'array',
      items: { $ref: '#/components/schemas/Showtime' }
    }
  })
  findByDate(
    @Query('date') date: string,
    @Query('timezoneOffset') timezoneOffset?: string,
  ) {
    const offset =
      timezoneOffset !== undefined && timezoneOffset !== null
        ? Number(timezoneOffset)
        : undefined;
    return this.showtimesService.findByDate(date, offset);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Lấy chi tiết suất chiếu',
    description: 'Lấy thông tin chi tiết của một suất chiếu theo ID'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID suất chiếu' })
  @ApiResponse({ 
    status: 200, 
    description: 'Thông tin chi tiết suất chiếu',
    schema: {
      example: {
        id: 1,
        screenId: 2,
        movieId: 5,
        startTime: '2025-01-20T18:00:00.000Z',
        endTime: '2025-01-20T20:30:00.000Z',
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        screen: {
          id: 2,
          name: 'Phòng 1',
          seatCapacity: 100
        },
        movie: {
          id: 5,
          title: 'Avengers: Endgame',
          duration: 180
        },
        bookings: []
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy suất chiếu' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.showtimesService.findOne(id).then(showtime => 
      ShowtimeResponseDto.fromEntity(showtime)
    );
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Tạo suất chiếu mới - Chỉ admin',
    description: 'Tạo một suất chiếu mới cho phim'
  })
  @ApiBody({ 
    type: CreateShowtimeDto,
    examples: {
      basic: {
        summary: 'Create showtime',
        value: {
          movieId: 5,
          screenId: 2,
          startTime: '2025-01-20T18:00:00.000Z',
          endTime: '2025-01-20T20:30:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Suất chiếu đã được tạo thành công',
    schema: {
      example: {
        id: 1,
        screenId: 2,
        movieId: 5,
        startTime: '2025-01-20T18:00:00.000Z',
        endTime: '2025-01-20T20:30:00.000Z',
        createdAt: '2025-01-15T10:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  create(@Body() dto: CreateShowtimeDto) {
    return this.showtimesService.create(dto).then(showtime => 
      ShowtimeResponseDto.fromEntity(showtime)
    );
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Cập nhật suất chiếu - Chỉ admin',
    description: 'Cập nhật thông tin suất chiếu'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID suất chiếu' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        movieId: { type: 'number', example: 5, description: 'ID phim' },
        screenId: { type: 'number', example: 2, description: 'ID phòng chiếu' },
        startTime: { type: 'string', format: 'date-time', example: '2025-01-20T18:00:00.000Z', description: 'Thời gian bắt đầu' },
        endTime: { type: 'string', format: 'date-time', example: '2025-01-20T20:30:00.000Z', description: 'Thời gian kết thúc' }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật suất chiếu thành công',
    schema: {
      example: {
        id: 1,
        screenId: 2,
        movieId: 5,
        startTime: '2025-01-20T19:00:00.000Z',
        endTime: '2025-01-20T21:30:00.000Z',
        updatedAt: '2025-01-16T10:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy suất chiếu' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<CreateShowtimeDto>) {
    return this.showtimesService.update(id, body);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Cập nhật một phần suất chiếu - Chỉ admin',
    description: 'Cập nhật một phần thông tin suất chiếu'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID suất chiếu' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        movieId: { type: 'number', example: 5, description: 'ID phim' },
        screenId: { type: 'number', example: 2, description: 'ID phòng chiếu' },
        startTime: { type: 'string', format: 'date-time', example: '2025-01-20T19:00:00.000Z' },
        endTime: { type: 'string', format: 'date-time', example: '2025-01-20T21:30:00.000Z' }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật suất chiếu thành công'
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy suất chiếu' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  patch(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<CreateShowtimeDto>) {
    return this.showtimesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Xóa suất chiếu - Chỉ admin',
    description: 'Xóa một suất chiếu khỏi hệ thống (chỉ khi chưa có booking)'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID suất chiếu cần xóa' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa suất chiếu thành công',
    schema: {
      example: {
        message: 'Xóa suất chiếu thành công'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Không thể xóa suất chiếu (đã có booking)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy suất chiếu' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.showtimesService.remove(id);
  }
}
