import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FestivalsService } from '../services/festivals.service';
import { FestivalResponseDto } from '../dtos/response/festivals.response.dto';
import { CreateFestivalRequestDto, UpdateFestivalRequestDto } from '../dtos/request/festivals.request.dto';
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

@ApiTags('Lễ hội')
@Controller('festivals')
export class FestivalsController {
  constructor(
    private readonly service: FestivalsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách lễ hội (có phân trang & tìm kiếm)' })
  @ApiOkResponse({ 
    description: 'Danh sách lễ hội (có phân trang & tìm kiếm)', 
    schema: {
      example: {
        items: [
          {
            id: 1,
            title: 'Lễ hội phim mùa hè',
            image: 'https://example.com/banner.jpg',
            start_time: '2025-06-01T09:00:00.000Z',
            end_time: '2025-06-30T17:00:00.000Z'
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
  @ApiQuery({ name: 'search', required: false, example: 'summer', description: 'Tìm kiếm theo ID lễ hội hoặc tiêu đề' })
  async list(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    const result = await this.service.findAll({ page: Number(page ?? 1), limit: Number(limit ?? 10), search: search ?? '' });
    return {
      ...result,
      items: result.items.map(FestivalResponseDto.fromEntity),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một lễ hội' })
  @ApiParam({ name: 'id', description: 'ID của lễ hội' })
  @ApiOkResponse({ description: 'Chi tiết lễ hội', type: FestivalResponseDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy lễ hội' })
  async detail(@Param('id', ParseIntPipe) id: number) {
    const ent = await this.service.findOne(id);
    return FestivalResponseDto.fromEntity(ent);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Tạo lễ hội mới - Chỉ admin' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: 'Tạo lễ hội thành công', type: FestivalResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  @ApiBody({
    description: 'Create festival (supports image upload)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh banner (tùy chọn)',
        },
        title: { type: 'string', example: 'Lễ hội phim mùa hè' },
        image: { type: 'string', example: 'https://example.com/banner.jpg', description: 'URL banner (nếu không upload file)' },
        content: { type: 'string', example: 'Nội dung chi tiết về lễ hội...', description: 'Nội dung mô tả lễ hội' },
        start_time: { type: 'string', example: '2030-01-01T09:00:00.000Z' },
        end_time: { type: 'string', example: '2030-01-05T17:00:00.000Z' },
      },
      required: ['title', 'start_time', 'end_time'],
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async create(@Body() body: any, @UploadedFile() file?: Express.Multer.File) {
   
    if (file?.buffer) {
      validateImageFile(file);
      try {
        const uploadResult = await this.cloudinaryService.uploadBuffer(
          file.buffer,
          'festivals/banners',
        );
        body.image = uploadResult.secure_url;
      } catch (e: any) {
        throw new BadRequestException(e?.message ?? 'Upload image failed');
      }
    }
    
    const dto: CreateFestivalRequestDto = {
      title: body.title,
      image: body.image || null,
      content: body.content || null,
      start_time: body.start_time,
      end_time: body.end_time,
    };
    const ent = await this.service.create(dto);
    return FestivalResponseDto.fromEntity(ent);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Cập nhật thông tin lễ hội - Chỉ admin' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID của lễ hội' })
  @ApiOkResponse({ description: 'Cập nhật lễ hội thành công', type: FestivalResponseDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy lễ hội' })
  @ApiBody({
    description: 'Update festival (supports image upload)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh banner (tùy chọn)',
        },
        title: { type: 'string', example: 'Lễ hội phim 2030' },
        image: { type: 'string', example: 'https://example.com/banner-new.jpg', description: 'URL banner (nếu không upload file)' },
        content: { type: 'string', example: 'Nội dung chi tiết về lễ hội...', description: 'Nội dung mô tả lễ hội' },
        start_time: { type: 'string', example: '2030-01-02T09:00:00.000Z' },
        end_time: { type: 'string', example: '2030-01-06T17:00:00.000Z' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @UploadedFile() file?: Express.Multer.File) {
   
    if (file?.buffer) {
      validateImageFile(file);
      try {
        const uploadResult = await this.cloudinaryService.uploadBuffer(
          file.buffer,
          'festivals/banners',
        );
        body.image = uploadResult.secure_url;
      } catch (e: any) {
        throw new BadRequestException(e?.message ?? 'Upload image failed');
      }
    }
    
    const dto: UpdateFestivalRequestDto = {
      title: body.title,
      image: body.image !== undefined ? body.image : undefined,
      content: body.content !== undefined ? body.content : undefined,
      start_time: body.start_time,
      end_time: body.end_time,
    };
    const ent = await this.service.update(id, dto);
    return FestivalResponseDto.fromEntity(ent);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Xóa một lễ hội - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của lễ hội cần xóa' })
  @ApiOkResponse({ description: 'Xóa lễ hội thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy lễ hội' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return { success: true };
  }
}


