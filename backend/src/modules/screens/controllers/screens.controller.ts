import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ScreensService } from '../services/screens.service';
import { CreateScreenRequestDto, UpdateScreenRequestDto } from '../dtos/request/screens.request.dto';
import { ScreenResponseDto } from '../dtos/response/screens.response.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';

@ApiTags('Phòng chiếu (Screens)')
@Controller('screens')
export class ScreensController {
  constructor(private readonly screensService: ScreensService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Tạo phòng chiếu mới - Chỉ admin' })
  @ApiCreatedResponse({ description: 'Tạo phòng chiếu thành công', type: ScreenResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  async create(@Body() body: CreateScreenRequestDto): Promise<ScreenResponseDto> {
    return ScreenResponseDto.fromEntity(await this.screensService.create(body));
  }

  @Get()
  @ApiOperation({ 
    summary: 'Lấy danh sách phòng chiếu (phân trang, tìm kiếm)',
    description: 'Lấy danh sách phòng chiếu với phân trang, tìm kiếm và lọc theo rạp. Có thể sắp xếp theo các cột khác nhau.'
  })
  @ApiOkResponse({ 
    description: 'Danh sách phòng chiếu (phân trang, tìm kiếm)', 
    type: Object,
    schema: {
      example: {
        items: [
          {
            id: 1,
            name: 'Screen 1',
            seat_capacity: 100,
            theater_id: 1,
            created_at: '2025-01-01T00:00:00.000Z'
          }
        ],
        total: 15,
        page: 1,
        limit: 10,
        totalPages: 2
      }
    }
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Trang hiện tại (bắt đầu từ 1)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Số bản ghi mỗi trang' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'created_at', description: 'Cột sắp xếp: name, seat_capacity, created_at, updated_at' })
  @ApiQuery({ name: 'sortOrder', required: false, example: 'desc', enum: ['asc', 'desc'], description: 'Thứ tự sắp xếp: asc hoặc desc' })
  @ApiQuery({ name: 'search', required: false, example: 'imax', description: 'Tìm kiếm theo ID phòng chiếu hoặc tên phòng chiếu' })
  @ApiQuery({ name: 'theater_id', required: false, example: 1, description: 'Lọc phòng chiếu theo ID rạp' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'name' | 'seat_capacity' | 'created_at' | 'updated_at',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('search') search?: string,
    @Query('theater_id') theater_id?: string,
  ) {
    const result = await this.screensService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sortBy: sortBy as any,
      sortOrder,
      search,
      theater_id: theater_id ? parseInt(theater_id, 10) : undefined,
    });
    return {
      ...result,
      items: result.items.map(ScreenResponseDto.fromEntity),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một phòng chiếu' })
  @ApiParam({ name: 'id', description: 'ID của phòng chiếu' })
  @ApiOkResponse({ description: 'Chi tiết phòng chiếu', type: ScreenResponseDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy phòng chiếu' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ScreenResponseDto> {
    return ScreenResponseDto.fromEntity(await this.screensService.findOne(id));
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Cập nhật thông tin phòng chiếu - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của phòng chiếu' })
  @ApiOkResponse({ description: 'Cập nhật phòng chiếu thành công', type: ScreenResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy phòng chiếu' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateScreenRequestDto): Promise<ScreenResponseDto> {
    return ScreenResponseDto.fromEntity(await this.screensService.update(id, body));
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Xóa một phòng chiếu - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của phòng chiếu cần xóa' })
  @ApiOkResponse({ description: 'Xóa phòng chiếu thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy phòng chiếu' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.screensService.remove(id);
    return { ok: true };
  }
}



