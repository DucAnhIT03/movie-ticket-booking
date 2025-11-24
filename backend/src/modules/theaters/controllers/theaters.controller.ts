import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TheatersService } from '../services/theaters.service';
import { CreateTheaterRequestDto, UpdateTheaterRequestDto } from '../dtos/request/theaters.request.dto';
import { TheaterResponseDto } from '../dtos/response/theaters.response.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';

@ApiTags('Rạp chiếu (Theaters)')
@Controller('theaters')
export class TheatersController {
  constructor(private readonly theatersService: TheatersService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Tạo rạp chiếu mới - Chỉ admin' })
  @ApiCreatedResponse({ description: 'Tạo rạp chiếu thành công', type: TheaterResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  async create(@Body() body: CreateTheaterRequestDto): Promise<TheaterResponseDto> {
    const entity = await this.theatersService.create(body);
    return TheaterResponseDto.fromEntity(entity);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách rạp chiếu (phân trang, tìm kiếm)' })
  @ApiOkResponse({ 
    description: 'Danh sách rạp chiếu (phân trang, tìm kiếm)', 
    schema: {
      example: {
        items: [
          {
            id: 1,
            name: 'CGV Vincom',
            location: 'Hà Nội',
            phone: '0123456789',
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: null
          }
        ],
        total: 50,
        page: 1,
        limit: 10,
        totalPages: 5
      }
    }
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Trang hiện tại' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Số bản ghi mỗi trang' })
  @ApiQuery({ name: 'sortBy', required: false, example: 'created_at', description: 'Cột sắp xếp' })
  @ApiQuery({ name: 'sortOrder', required: false, example: 'desc', description: 'Thứ tự sắp xếp' })
  @ApiQuery({ name: 'search', required: false, example: 'CGV', description: 'Tìm kiếm theo ID rạp hoặc tên rạp' })
  @ApiQuery({ name: 'location', required: false, example: 'Hà Nội', description: 'Lọc theo địa điểm' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: 'name' | 'location' | 'created_at' | 'updated_at',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('search') search?: string,
    @Query('location') location?: string,
  ) {
    const result = await this.theatersService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sortBy: sortBy as any,
      sortOrder,
      search,
      location,
    });
    return {
      ...result,
      items: result.items.map(TheaterResponseDto.fromEntity),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một rạp chiếu' })
  @ApiParam({ name: 'id', description: 'ID của rạp chiếu' })
  @ApiOkResponse({ description: 'Chi tiết rạp chiếu', type: TheaterResponseDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy rạp chiếu' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TheaterResponseDto> {
    return TheaterResponseDto.fromEntity(await this.theatersService.findOne(id));
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Cập nhật thông tin rạp chiếu - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của rạp chiếu' })
  @ApiOkResponse({ description: 'Cập nhật rạp chiếu thành công', type: TheaterResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy rạp chiếu' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateTheaterRequestDto): Promise<TheaterResponseDto> {
    return TheaterResponseDto.fromEntity(await this.theatersService.update(id, body));
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Xóa một rạp chiếu - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của rạp chiếu cần xóa' })
  @ApiOkResponse({ description: 'Xóa rạp chiếu thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy rạp chiếu' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.theatersService.remove(id);
    return { ok: true };
  }
}



