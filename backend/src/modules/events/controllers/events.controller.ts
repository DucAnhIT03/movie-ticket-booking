import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { EventsService } from '../services/events.service';
import { EventResponseDto } from '../dtos/response/events.response.dto';
import { CreateEventRequestDto, UpdateEventRequestDto } from '../dtos/request/events.request.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../../../providers/cloudinary/cloudinary.service';

function validateImageFile(file: Express.Multer.File): void {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; 

  if (!file.mimetype || !allowedMimeTypes.includes(file.mimetype)) {
    throw new BadRequestException(`File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    throw new BadRequestException(`File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`);
  }
}

@ApiTags('Sự kiện')
@Controller('events')
export class EventsController {
  constructor(
    private readonly service: EventsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sự kiện (có phân trang, tìm kiếm & lọc theo trạng thái)' })
  @ApiOkResponse({ 
    description: 'Danh sách sự kiện (có phân trang, tìm kiếm & lọc theo trạng thái)', 
    schema: {
      example: {
        items: [
          {
            id: 1,
            title: 'Sự kiện ra mắt phim mới',
            description: 'Mô tả chi tiết về sự kiện...',
            image: 'https://example.com/event.jpg',
            location: 'Rạp CGV Vincom',
            start_time: '2025-06-01T09:00:00.000Z',
            end_time: '2025-06-05T17:00:00.000Z',
            status: 'UPCOMING',
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
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Trang hiện tại (>=1)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Số bản ghi mỗi trang (<=100)' })
  @ApiQuery({ name: 'search', required: false, example: 'ra mắt', description: 'Tìm kiếm theo ID, tiêu đề hoặc địa điểm' })
  @ApiQuery({ name: 'status', required: false, example: 'UPCOMING', enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'], description: 'Lọc theo trạng thái' })
  async list(
    @Query('page') page?: string, 
    @Query('limit') limit?: string, 
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    const result = await this.service.findAll({ 
      page: Number(page ?? 1), 
      limit: Number(limit ?? 10), 
      search: search ?? '',
      status: status
    });
    return {
      ...result,
      items: result.items.map(EventResponseDto.fromEntity),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một sự kiện' })
  @ApiParam({ name: 'id', description: 'ID của sự kiện' })
  @ApiOkResponse({ description: 'Chi tiết sự kiện', type: EventResponseDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy sự kiện' })
  async detail(@Param('id', ParseIntPipe) id: number) {
    const ent = await this.service.findOne(id);
    return EventResponseDto.fromEntity(ent);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Tạo sự kiện mới - Chỉ admin' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: 'Tạo sự kiện thành công', type: EventResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  @ApiBody({
    description: 'Create event (supports image upload)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh sự kiện (tùy chọn)',
        },
        title: { type: 'string', example: 'Sự kiện ra mắt phim mới' },
        description: { type: 'string', example: 'Mô tả chi tiết về sự kiện...' },
        image: { type: 'string', example: 'https://example.com/event.jpg', description: 'URL ảnh (nếu không upload file)' },
        location: { type: 'string', example: 'Rạp CGV Vincom' },
        start_time: { type: 'string', example: '2030-01-01T09:00:00.000Z' },
        end_time: { type: 'string', example: '2030-01-05T17:00:00.000Z' },
        status: { type: 'string', example: 'UPCOMING', enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'] },
      },
      required: ['title', 'start_time', 'end_time'],
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async create(@Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    // Xử lý upload ảnh nếu có
    if (file?.buffer) {
      validateImageFile(file);
      try {
        const uploadResult = await this.cloudinaryService.uploadBuffer(
          file.buffer,
          'events/images',
        );
        body.image = uploadResult.secure_url;
      } catch (e: any) {
        throw new BadRequestException(e?.message ?? 'Upload image failed');
      }
    }
    
    const dto: CreateEventRequestDto = {
      title: body.title,
      description: body.description || null,
      image: body.image || null,
      location: body.location || null,
      start_time: body.start_time,
      end_time: body.end_time,
      status: body.status,
    };
    const ent = await this.service.create(dto);
    return EventResponseDto.fromEntity(ent);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Cập nhật thông tin sự kiện - Chỉ admin' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID của sự kiện' })
  @ApiOkResponse({ description: 'Cập nhật sự kiện thành công', type: EventResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy sự kiện' })
  @ApiBody({
    description: 'Update event (supports image upload)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh sự kiện (tùy chọn)',
        },
        title: { type: 'string', example: 'Sự kiện ra mắt phim mới 2025' },
        description: { type: 'string', example: 'Mô tả chi tiết về sự kiện...' },
        image: { type: 'string', example: 'https://example.com/event-new.jpg', description: 'URL ảnh (nếu không upload file)' },
        location: { type: 'string', example: 'Rạp CGV Vincom Landmark' },
        start_time: { type: 'string', example: '2030-01-02T09:00:00.000Z' },
        end_time: { type: 'string', example: '2030-01-06T17:00:00.000Z' },
        status: { type: 'string', example: 'ONGOING', enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'] },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    // Xử lý upload ảnh nếu có
    if (file?.buffer) {
      validateImageFile(file);
      try {
        const uploadResult = await this.cloudinaryService.uploadBuffer(
          file.buffer,
          'events/images',
        );
        body.image = uploadResult.secure_url;
      } catch (e: any) {
        throw new BadRequestException(e?.message ?? 'Upload image failed');
      }
    }
    
    const dto: UpdateEventRequestDto = {
      title: body.title,
      description: body.description !== undefined ? body.description : undefined,
      image: body.image !== undefined ? body.image : undefined,
      location: body.location !== undefined ? body.location : undefined,
      start_time: body.start_time,
      end_time: body.end_time,
      status: body.status,
    };
    const ent = await this.service.update(id, dto);
    return EventResponseDto.fromEntity(ent);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Xóa một sự kiện - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của sự kiện cần xóa' })
  @ApiOkResponse({ description: 'Xóa sự kiện thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy sự kiện' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}


