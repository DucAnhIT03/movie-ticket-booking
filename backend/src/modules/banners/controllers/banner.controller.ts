import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  Put,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { BannerService } from '../services/banner.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { ApiTags, ApiQuery, ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { CreateBannerDto } from '../dtos/request/create-banner.dto';
import { UpdateBannerDto } from '../dtos/request/update-banner.dto';
import { CacheResponse, InvalidateCache } from '../../../providers/redis-cache';
import { RedisCacheService } from '../../../providers/redis-cache/redis-cache.service';
import { QueryBannerDto } from '../dtos/request/query-banner.dto';
import { BannerType, Position } from 'src/common/constants/enums';
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

function parseDimension(raw: any, field: 'width' | 'height'): number | undefined {
  if (raw === undefined || raw === null || raw === '') {
    return undefined;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new BadRequestException(`${field} must be a positive number`);
  }
  return value;
}

@ApiTags('Banners')
@Controller('banners')
export class BannerController {
  constructor(
    private bannerService: BannerService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @Post()
  @InvalidateCache(RedisCacheService.KEYS.BANNERS)
  @ApiOperation({ summary: 'Tạo banner mới - Chỉ admin' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Banner được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiBody({
    description: 'Create banner (supports image upload)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh banner (tùy chọn)',
        },
        url: { type: 'string', example: 'https://example.com/banner.jpg', description: 'URL banner (nếu không upload file)' },
        type: { type: 'string', example: BannerType.IMAGE, enum: Object.values(BannerType) },
        position: { type: 'string', example: Position.Header },
        width: { type: 'number', example: 1440, description: 'Chiều ngang (px)' },
        height: { type: 'number', example: 480, description: 'Chiều dọc (px)' },
      },
      required: ['type', 'position'],
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async create(@Body() body: any, @UploadedFile() file?: Express.Multer.File) {
   
    if (file?.buffer) {
      validateImageFile(file);
      try {
        const uploadResult = await this.cloudinaryService.uploadBuffer(
          file.buffer,
          'banners/assets',
        );
        body.url = uploadResult.secure_url;
      } catch (e: any) {
        throw new BadRequestException(e?.message ?? 'Upload image failed');
      }
    }
    
    const dto: CreateBannerDto = {
      url: body.url,
      type: body.type,
      position: body.position,
      width: parseDimension(body.width, 'width'),
      height: parseDimension(body.height, 'height'),
    };
    return this.bannerService.create(dto);
  }

  @Get()
  @CacheResponse(RedisCacheService.KEYS.BANNERS, RedisCacheService.TTL.BANNERS)
  @ApiOperation({ 
    summary: 'Lấy danh sách banner (có phân trang và tìm kiếm)',
    description: 'Lấy danh sách banner với tìm kiếm và phân trang. Có thể tìm kiếm theo từ khóa và phân trang với page và limit.'
  })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'summer', description: 'Từ khóa tìm kiếm' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang (bắt đầu từ 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số bản ghi mỗi trang' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách banner (có phân trang)',
    schema: {
      example: {
        items: [
          {
            id: 1,
            url: 'https://example.com/banner.jpg',
            type: 'IMAGE',
            position: 'HEADER',
            created_at: '2025-01-01T00:00:00.000Z'
          }
        ],
        total: 10,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    }
  })
  async findAll(@Query() q: QueryBannerDto) {
    try {
      const search = q.search || undefined;
      const page = q.page ? Number(q.page) : 1;
      const limit = q.limit ? Number(q.limit) : 10;
      return await this.bannerService.searchAndPaginate(search, page, limit);
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  @Get('all')
  @CacheResponse(`${RedisCacheService.KEYS.BANNERS}:all`, RedisCacheService.TTL.BANNERS)
  @ApiOperation({ summary: 'Lấy tất cả banner (không phân trang)' })
  @ApiResponse({ status: 200, description: 'Danh sách tất cả banner' })
  async findAllNoPaging(@Query('search') search?: string) {
    try {
      return await this.bannerService.findAllNoPaging(search || undefined);
    } catch (error) {
      console.error('Error in findAllNoPaging:', error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một banner' })
  @ApiParam({ name: 'id', description: 'ID của banner' })
  @ApiResponse({ status: 200, description: 'Thông tin banner' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy banner' })
  findOne(@Param('id') id: string) {
    return this.bannerService.findOne(Number(id));
  }

  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @Put(':id')
  @InvalidateCache(RedisCacheService.KEYS.BANNERS)
  @ApiOperation({ summary: 'Cập nhật banner - Chỉ admin' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID của banner' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy banner' })
  @ApiBody({
    description: 'Update banner (supports image upload)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh banner (tùy chọn)',
        },
        url: { type: 'string', example: 'https://example.com/banner.jpg', description: 'URL banner (nếu không upload file)' },
        type: { type: 'string', example: BannerType.IMAGE, enum: Object.values(BannerType) },
        position: { type: 'string', example: Position.Header },
        width: { type: 'number', example: 1440, description: 'Chiều ngang (px)' },
        height: { type: 'number', example: 480, description: 'Chiều dọc (px)' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async update(@Param('id') id: string, @Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    
    if (file?.buffer) {
      validateImageFile(file);
      try {
        const uploadResult = await this.cloudinaryService.uploadBuffer(
          file.buffer,
          'banners/assets',
        );
        body.url = uploadResult.secure_url;
      } catch (e: any) {
        throw new BadRequestException(e?.message ?? 'Upload image failed');
      }
    }
    
    const dto: UpdateBannerDto = {
      url: body.url,
      type: body.type,
      position: body.position,
      width: parseDimension(body.width, 'width'),
      height: parseDimension(body.height, 'height'),
    };
    return this.bannerService.update(Number(id), dto);
  }

  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @Delete(':id')
  @InvalidateCache(RedisCacheService.KEYS.BANNERS)
  @ApiOperation({ summary: 'Xóa banner - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của banner cần xóa' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy banner' })
  remove(@Param('id') id: string) {
    return this.bannerService.remove(Number(id));
  }
}
