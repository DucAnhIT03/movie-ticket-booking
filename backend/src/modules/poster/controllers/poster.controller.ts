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
import { PosterService } from '../services/poster.service';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { UpdatePosterDto } from '../dtos/request/update-poster.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../../../providers/cloudinary/cloudinary.service';
import { PosterResponseDto } from '../dtos/response/poster.response.dto';

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

@ApiTags('Poster')
@Controller('poster')
export class PosterController {
  constructor(
    private posterService: PosterService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy thông tin poster (chỉ có một poster duy nhất)' })
  @ApiResponse({ status: 200, description: 'Thông tin poster', type: PosterResponseDto })
  async findOne() {
    const poster = await this.posterService.findOne();
    if (!poster) {
      return { id: null, image_url: null, created_at: null, updated_at: null };
    }
    return PosterResponseDto.fromEntity(poster);
  }

  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @Put()
  @ApiOperation({ summary: 'Cập nhật poster - Chỉ admin (chỉ có một poster duy nhất)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Cập nhật thành công', type: PosterResponseDto })
  @ApiBody({
    description: 'Update poster (supports image upload). Poster có kích thước cố định: 1440x810px',
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
    // Xử lý upload ảnh nếu có
    if (file?.buffer) {
      validateImageFile(file);
      try {
        const uploadResult = await this.cloudinaryService.uploadBuffer(
          file.buffer,
          'posters',
        );
        body.image_url = uploadResult.secure_url;
      } catch (e: any) {
        throw new BadRequestException(e?.message ?? 'Upload image failed');
      }
    }
    
    const dto: UpdatePosterDto = {
      image_url: body.image_url,
    };
    const updated = await this.posterService.update(dto);
    return PosterResponseDto.fromEntity(updated);
  }
}












