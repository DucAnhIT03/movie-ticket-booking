import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { BannerPosterService } from '../services/banner-poster.service';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { UpdateBannerPosterDto } from '../dtos/request/update-banner-poster.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../../../providers/cloudinary/cloudinary.service';
import { BannerPosterResponseDto } from '../dtos/response/banner-poster.response.dto';

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

@ApiTags('BannerPoster')
@Controller('banner-poster')
export class BannerPosterController {
  constructor(
    private bannerPosterService: BannerPosterService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy thông tin poster banner (chỉ có một poster duy nhất)' })
  @ApiResponse({ status: 200, description: 'Thông tin poster banner', type: BannerPosterResponseDto })
  async findOne() {
    const poster = await this.bannerPosterService.findOne();
    if (!poster) {
      return { id: null, image_url: null, created_at: null, updated_at: null };
    }
    return BannerPosterResponseDto.fromEntity(poster);
  }

  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @Put()
  @ApiOperation({ summary: 'Cập nhật poster banner - Chỉ admin (chỉ có một poster duy nhất)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Cập nhật thành công', type: BannerPosterResponseDto })
  @ApiBody({
    description: 'Update banner poster (supports image upload). Poster có kích thước khuyến nghị: 1440x810px',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh poster (tùy chọn, kích thước khuyến nghị: 1440x810px)',
        },
        image_url: { type: 'string', example: 'https://example.com/poster.jpg', description: 'URL poster (nếu không upload file)' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async update(@Body() body: any, @UploadedFile() file?: Express.Multer.File) {
  
    if (file?.buffer) {
      validateImageFile(file);
      try {
        const uploadResult = await this.cloudinaryService.uploadBuffer(
          file.buffer,
          'banner-posters',
        );
        body.image_url = uploadResult.secure_url;
      } catch (e: any) {
        throw new BadRequestException(e?.message ?? 'Upload image failed');
      }
    }
    
    const dto: UpdateBannerPosterDto = {
      image_url: body.image_url,
    };
    const updated = await this.bannerPosterService.update(dto);
    return BannerPosterResponseDto.fromEntity(updated);
  }
}












