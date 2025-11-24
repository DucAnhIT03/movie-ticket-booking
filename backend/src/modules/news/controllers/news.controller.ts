import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { NewsService } from '../services/news.service';
import { CreateNewsDto } from '../dtos/request/create-news.dto';
import { UpdateNewsDto } from '../dtos/request/update-news.dto';
import { QueryNewsDto } from '../dtos/request/query-news.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { ApiBearerAuth, ApiTags, ApiQuery, ApiBody, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Tạo tin tức mới - Chỉ admin' })
  @ApiResponse({ status: 201, description: 'Tin tức được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiBody({
    type: CreateNewsDto,
    examples: {
      basic: {
        summary: 'Create news',
        value: {
          title: 'Festival Opening',
          content: 'The festival opens today...',
          festivalId: 1,
        },
      },
    },
  })
  create(@Body() dto: CreateNewsDto) {
    return this.newsService.create(dto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Lấy danh sách tin tức (có phân trang và tìm kiếm)',
    description: 'Lấy danh sách tin tức với tìm kiếm và phân trang. Có thể tìm kiếm theo từ khóa và phân trang với page và limit.'
  })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'festival', description: 'Từ khóa tìm kiếm theo tiêu đề hoặc nội dung' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang (bắt đầu từ 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số bản ghi mỗi trang' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách tin tức (có phân trang)',
    schema: {
      example: {
        items: [
          {
            id: 1,
            title: 'Festival Opening',
            content: 'The festival opens today...',
            festivalId: 1,
            created_at: '2025-01-01T00:00:00.000Z'
          }
        ],
        total: 20,
        page: 1,
        limit: 10,
        totalPages: 2
      }
    }
  })
  async findAll(@Query() q: QueryNewsDto) {
    return this.newsService.searchAndPaginate(q.search, q.page, q.limit);
  }

  @Get('all')
  @ApiOperation({ summary: 'Lấy tất cả tin tức (không phân trang)' })
  @ApiResponse({ status: 200, description: 'Danh sách tất cả tin tức' })
  findAllNoPaging() {
    return this.newsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một tin tức' })
  @ApiParam({ name: 'id', description: 'ID của tin tức' })
  @ApiResponse({ status: 200, description: 'Thông tin tin tức' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tin tức' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Cập nhật tin tức - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của tin tức' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tin tức' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNewsDto) {
    return this.newsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Xóa tin tức - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của tin tức cần xóa' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tin tức' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.remove(id);
  }
}
