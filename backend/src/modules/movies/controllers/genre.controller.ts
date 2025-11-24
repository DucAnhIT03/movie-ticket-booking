import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { GenreService } from '../services/genre.service';
import { CreateGenreDto } from '../dtos/request/create-genre.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UpdateGenreDto } from '../dtos/request/update-genre.dto';
import { BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Genres')
@Controller('genres')
export class GenreController {
  constructor(private service: GenreService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Tạo thể loại mới (có thể tạo 1 hoặc nhiều thể loại)' })
  @ApiResponse({ status: 201, description: 'Thể loại được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiBody({
    description: 'Create a genre or array of genres',
    type: CreateGenreDto,
    examples: {
      single: { summary: 'Single genre', value: { genreName: 'Action' } },
      multiple: {
        summary: 'Multiple',
        value: [{ genreName: 'Action' }, { genreName: 'Drama' }],
      },
    },
  })
  async create(@Body() dto: any) {
    if (Array.isArray(dto)) {
      for (const item of dto) {
        if (
          !item ||
          typeof item.genreName !== 'string' ||
          item.genreName.trim() === ''
        ) {
          throw new BadRequestException(
            'Each genre must have a non-empty genreName string',
          );
        }
      }
      return this.service.createMany(dto as CreateGenreDto[]);
    }
    return this.service.create(dto as CreateGenreDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Lấy danh sách thể loại (có tìm kiếm và phân trang)',
    description: 'Lấy danh sách thể loại với tìm kiếm và phân trang'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang (bắt đầu từ 1, tối thiểu 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số lượng mỗi trang (tối thiểu 1, tối đa 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm kiếm theo ID thể loại hoặc tên thể loại' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách thể loại đã phân trang',
    schema: {
      example: {
        items: [
          {
            id: 1,
            genreName: 'Action'
          },
          {
            id: 2,
            genreName: 'Drama'
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
  ) {
    return this.service.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một thể loại' })
  @ApiParam({ name: 'id', description: 'ID của thể loại' })
  @ApiResponse({ status: 200, description: 'Thông tin thể loại' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thể loại' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Cập nhật thông tin thể loại' })
  @ApiParam({ name: 'id', description: 'ID của thể loại' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thể loại' })
  update(@Param('id') id: string, @Body() dto: UpdateGenreDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Xóa một thể loại' })
  @ApiParam({ name: 'id', description: 'ID của thể loại cần xóa' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thể loại' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
