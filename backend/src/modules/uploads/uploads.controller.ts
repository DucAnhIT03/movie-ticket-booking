import { BadRequestException, Controller, Delete, Post, UploadedFile, UploadedFiles, UseInterceptors, Body, InternalServerErrorException } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../../providers/cloudinary/cloudinary.service';

type UploadResponse = { url: string; public_id: string };

function resolveFolder(params: { folder?: string; entity?: string; category?: string }): string | undefined {
  if (params.folder) return params.folder;
  const allowedEntities = new Set(['movies', 'users', 'banners', 'promotions']);
  const defaultCategory: Record<string, string> = { 
    movies: 'posters', 
    users: 'avatars', 
    banners: 'assets',
    promotions: 'images'
  };
  const entity = params.entity?.toLowerCase();
  if (!entity || !allowedEntities.has(entity)) return undefined;
  const category = (params.category || defaultCategory[entity]).toLowerCase();
  return `${entity}/${category}`;
}


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

@ApiTags('Tải ảnh (Cloudinary)')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post('single')
  @ApiOperation({ summary: 'Tải lên 1 file ảnh' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, folder: { type: 'string' }, entity: { type: 'string' }, category: { type: 'string' } } } })
  @ApiOkResponse({ description: 'Uploaded', schema: { example: { url: 'https://...', public_id: 'abc123' } } })
  @ApiBadRequestResponse({ description: 'File is required or invalid' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadSingle(
    @UploadedFile() file?: Express.Multer.File,
    @Body('folder') folder?: string,
    @Body('entity') entity?: string,
    @Body('category') category?: string,
  ): Promise<UploadResponse> {
    if (!file?.buffer) throw new BadRequestException('File is required');
    validateImageFile(file);
    try {
      const res = await this.cloudinary.uploadBuffer(file.buffer, resolveFolder({ folder, entity, category }));
      return { url: res.secure_url, public_id: res.public_id };
    } catch (e: any) {
      throw new InternalServerErrorException(e?.message ?? 'Upload failed');
    }
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Tải lên nhiều file ảnh' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } }, folder: { type: 'string' }, entity: { type: 'string' }, category: { type: 'string' } } } })
  @ApiOkResponse({ 
    description: 'Uploaded list', 
    schema: { 
      example: { 
        success: [{ url: 'https://...', public_id: 'id1' }], 
        failed: [] 
      } 
    } 
  })
  @ApiBadRequestResponse({ description: 'Files are required or invalid' })
  @UseInterceptors(FilesInterceptor('files', 10, { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadMultiple(
    @UploadedFiles() files?: Express.Multer.File[],
    @Body('folder') folder?: string,
    @Body('entity') entity?: string,
    @Body('category') category?: string,
  ): Promise<{ success: UploadResponse[]; failed: { fileName: string; error: string }[] }> {
    if (!files?.length) throw new BadRequestException('Files are required');
    
    
    for (const file of files) {
      try {
        validateImageFile(file);
      } catch (e: any) {
        throw new BadRequestException(`File ${file.originalname}: ${e.message}`);
      }
    }

    const success: UploadResponse[] = [];
    const failed: { fileName: string; error: string }[] = [];
    const folderPath = resolveFolder({ folder, entity, category });

    
    const uploadPromises = files.map(async (file) => {
      try {
        const res = await this.cloudinary.uploadBuffer(file.buffer, folderPath);
        return { success: true, data: { url: res.secure_url, public_id: res.public_id }, fileName: file.originalname };
      } catch (e: any) {
        return { success: false, error: e?.message ?? 'Upload failed', fileName: file.originalname };
      }
    });

    const results = await Promise.allSettled(uploadPromises);
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.success && result.value.data) {
          success.push(result.value.data);
        } else {
          failed.push({ fileName: result.value.fileName, error: result.value.error ?? 'Upload failed' });
        }
      } else {
        failed.push({ fileName: 'unknown', error: result.reason?.message ?? 'Upload failed' });
      }
    });

    return { success, failed };
  }

  @Delete('remove')
  @ApiOperation({ summary: 'Xóa 1 ảnh theo public_id' })
  @ApiOkResponse({ schema: { example: { result: 'ok' } } })
  @ApiBadRequestResponse({ description: 'public_id is required' })
  @ApiBody({ schema: { type: 'object', required: ['public_id'], properties: { public_id: { type: 'string' } } } })
  async remove(@Body('public_id') publicId?: string): Promise<{ result: string }> {
    if (!publicId) throw new BadRequestException('public_id is required');
    return this.cloudinary.deleteByPublicId(publicId);
  }

  @Delete('remove-many')
  @ApiOperation({ summary: 'Xóa nhiều ảnh theo danh sách public_id' })
  @ApiOkResponse({ schema: { example: { success: ['id1'], failed: [{ id: 'id2', error: 'not found' }] } } })
  @ApiBadRequestResponse({ description: 'public_ids invalid' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['public_ids'],
      properties: {
        public_ids: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
        },
      },
    },
  })
  async removeMany(@Body('public_ids') publicIds?: string[]): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      throw new BadRequestException('public_ids is required and must be a non-empty array');
    }
    return this.cloudinary.deleteManyByPublicIds(publicIds);
  }
}


