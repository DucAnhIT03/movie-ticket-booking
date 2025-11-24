
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  BadRequestException,
  NotFoundException,
  UseGuards,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { MovieService } from '../services/movie.service';
import { CreateMovieDto } from '../dtos/request/create-movie.dto';
import { UpdateMovieDto } from '../dtos/request/update-movie.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { AddGenreDto } from '../dtos/request/add-genre.dto';
import { SetGenresDto } from '../dtos/request/set-genres.dto';
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

@ApiTags('Movies')
@Controller('movies')
export class MovieController {
  constructor(
    private service: MovieService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @Post()
  @ApiOperation({ summary: 'Tạo phim mới (có thể tạo 1 hoặc nhiều phim) - Chỉ admin' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Phim được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiBody({
    description: 'Create a movie (supports image upload)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh poster (tùy chọn)',
        },
        title: { type: 'string', example: 'The Great Adventure' },
        description: { type: 'string', example: 'An action movie' },
        author: { type: 'string', example: 'John Doe' },
        image: { type: 'string', example: 'https://example.com/poster.jpg', description: 'URL poster (nếu không upload file)' },
        trailer: { type: 'string', example: 'https://youtube.com/watch?v=...' },
        type: { type: 'string', example: '2D', enum: ['2D', '3D'] },
        duration: { type: 'number', example: 120 },
        releaseDate: { type: 'string', example: '2025-01-01T00:00:00.000Z' },
      },
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
          'movies/posters',
        );
        body.image = uploadResult.secure_url;
      } catch (e: any) {
        throw new BadRequestException(e?.message ?? 'Upload image failed');
      }
    }
    
    // Xử lý convert dữ liệu từ form-data (các giá trị số có thể là string)
    const normalizeBody = (data: any) => {
      if (!data || typeof data !== 'object') return data;
      const normalized = { ...data };
      
      // Convert duration từ string sang number nếu có
      if (normalized.duration !== undefined && normalized.duration !== null && normalized.duration !== '') {
        const durationNum = Number(normalized.duration);
        normalized.duration = isNaN(durationNum) ? undefined : durationNum;
      } else {
        normalized.duration = undefined;
      }
      
      return normalized;
    };
    
    const dto = normalizeBody(body);
    
    if (Array.isArray(dto)) {
      const instances = plainToInstance(CreateMovieDto, dto.map(normalizeBody) as object[], {
        enableImplicitConversion: true,
      });
      const errors = [] as string[];
      for (const inst of instances) {
        const errs = await validate(inst as any);
        if (errs.length) {
          errors.push(
            ...errs.map((e) => Object.values(e.constraints || {}).join(', ')),
          );
        }
      }
      if (errors.length) throw new BadRequestException(errors);
      return this.service.createMany(instances as CreateMovieDto[]);
    }

    const inst = plainToInstance(CreateMovieDto, dto as object, {
      enableImplicitConversion: true,
    });
    const errs = await validate(inst as any);
    if (errs.length)
      throw new BadRequestException(
        errs.map((e) => Object.values(e.constraints || {}).join(', ')),
      );
    
    try {
      return await this.service.create(inst as CreateMovieDto);
    } catch (error: any) {
      // Xử lý lỗi database hoặc các lỗi khác
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        error?.message || 'Có lỗi xảy ra khi tạo phim. Vui lòng kiểm tra lại dữ liệu.'
      );
    }
  }

  @Get()
  @ApiOperation({ 
    summary: 'Lấy danh sách phim (có tìm kiếm và phân trang)',
    description: 'Lấy danh sách phim với tìm kiếm, phân trang và lọc theo thể loại'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang (bắt đầu từ 1, tối thiểu 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số lượng mỗi trang (tối thiểu 1, tối đa 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm kiếm theo ID phim, tên phim hoặc tác giả' })
  @ApiQuery({ name: 'genreId', required: false, type: Number, description: 'Lọc theo ID thể loại' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách phim đã phân trang',
    schema: {
      example: {
        items: [
          {
            id: 1,
            title: 'The Great Adventure',
            description: 'An action-packed adventure movie',
            author: 'John Doe',
            image: 'https://example.com/poster.jpg',
            trailer: 'https://youtube.com/watch?v=...',
            type: '2D',
            duration: 120,
            releaseDate: '2025-01-01T00:00:00.000Z',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: null,
            genres: ['Action', 'Adventure']
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
    @Query('genreId') genreId?: string,
  ) {
    return this.service.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      genreId: genreId ? Number(genreId) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Lấy thông tin chi tiết một phim',
    description: 'Lấy thông tin chi tiết của một phim theo ID'
  })
  @ApiParam({ name: 'id', description: 'ID của phim', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Thông tin phim',
    schema: {
      example: {
        id: 1,
        title: 'The Great Adventure',
        descriptions: 'An action-packed adventure movie',
        author: 'John Doe',
        image: 'https://example.com/poster.jpg',
        trailer: 'https://youtube.com/watch?v=...',
        type: '2D',
        duration: 120,
        release_date: '2025-01-01T00:00:00.000Z',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: null
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Không tìm thấy phim',
    schema: {
      example: {
        statusCode: 404,
        message: 'Movie not found',
        error: 'Not Found'
      }
    }
  })
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Cập nhật thông tin phim - Chỉ admin',
    description: 'Cập nhật một hoặc nhiều thông tin của phim. Tất cả các trường đều optional, chỉ cập nhật các trường được gửi lên. Hỗ trợ upload ảnh poster.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID của phim cần cập nhật', example: 1 })
  @ApiBody({
    description: 'Dữ liệu cập nhật phim (tất cả fields đều optional)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh poster (tùy chọn)',
        },
        title: { type: 'string', example: 'The Great Adventure 2' },
        description: { type: 'string', example: 'Updated description' },
        author: { type: 'string', example: 'John Doe' },
        image: { type: 'string', example: 'https://example.com/poster.jpg', description: 'URL poster (nếu không upload file)' },
        trailer: { type: 'string', example: 'https://youtube.com/watch?v=...' },
        type: { type: 'string', example: '3D', enum: ['2D', '3D'] },
        duration: { type: 'number', example: 150 },
        releaseDate: { type: 'string', example: '2025-06-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật phim thành công',
    schema: {
      example: {
        id: 1,
        title: 'The Great Adventure 2',
        description: 'Updated description',
        author: 'John Doe',
        image: 'https://example.com/poster.jpg',
        trailer: 'https://youtube.com/watch?v=...',
        type: '3D',
        duration: 150,
        releaseDate: '2025-06-01T00:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-15T10:30:00.000Z',
        genres: ['Action', 'Adventure']
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dữ liệu không hợp lệ',
    schema: {
      example: {
        statusCode: 400,
        message: ['Ngày phát hành không hợp lệ'],
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Không tìm thấy phim',
    schema: {
      example: {
        statusCode: 404,
        message: 'Movie not found',
        error: 'Not Found'
      }
    }
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async update(@Param('id') id: string, @Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    // Xử lý upload ảnh nếu có
    if (file?.buffer) {
      validateImageFile(file);
      try {
        const uploadResult = await this.cloudinaryService.uploadBuffer(
          file.buffer,
          'movies/posters',
        );
        body.image = uploadResult.secure_url;
      } catch (e: any) {
        throw new BadRequestException(e?.message ?? 'Upload image failed');
      }
    }
    
    const dto = body;
    const inst = plainToInstance(UpdateMovieDto, dto as object, {
      enableImplicitConversion: true,
    });
    const errs = await validate(inst as any);
    if (errs.length) {
      throw new BadRequestException(
        errs.map((e) => Object.values(e.constraints || {}).join(', ')),
      );
    }
    return this.service.update(Number(id), inst as UpdateMovieDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Xóa một phim - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của phim cần xóa' })
  @ApiResponse({ status: 200, description: 'Xóa phim thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phim' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }

  @Post(':id/genres')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Thêm thể loại cho phim' })
  @ApiParam({ name: 'id', description: 'ID của phim' })
  @ApiResponse({ status: 200, description: 'Thêm thể loại thành công' })
  @ApiBody({
    type: AddGenreDto,
    examples: {
      byId: { summary: 'Theo ID', value: { genreId: 2 } },
      snake: { summary: 'snake_case', value: { genre_id: 2 } },
      byName: { summary: 'Theo tên', value: { genreName: 'Action' } },
    },
  })
  addGenre(@Param('id') id: string, @Body() dto: AddGenreDto) {
    const genreInput = (dto.genreName && dto.genreName.trim()) ? dto.genreName.trim() : (dto.genreId as any);
    return this.service.addGenre(Number(id), genreInput);
  }

  @Delete(':id/genres/:genreId')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Xóa thể loại khỏi phim' })
  @ApiParam({ name: 'id', description: 'ID của phim' })
  @ApiParam({ name: 'genreId', description: 'ID của thể loại cần xóa' })
  @ApiResponse({ status: 200, description: 'Xóa thể loại thành công' })
  removeGenre(@Param('id') id: string, @Param('genreId') genreId: string) {
    return this.service.removeGenre(Number(id), Number(genreId));
  }

  @Get(':id/genres')
  @ApiOperation({ summary: 'Lấy danh sách thể loại của phim' })
  @ApiParam({ name: 'id', description: 'ID của phim' })
  @ApiResponse({ status: 200, description: 'Danh sách thể loại' })
  getGenres(@Param('id') id: string) {
    return this.service.getGenresForMovie(Number(id));
  }

  @Put(':id/genres')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Thay thế toàn bộ thể loại của phim' })
  @ApiParam({ name: 'id', description: 'ID của phim' })
  @ApiBody({
    type: SetGenresDto,
    description: 'Set (replace) genre IDs for a movie',
  })
  async setGenres(@Param('id') id: string, @Body() dto: SetGenresDto) {
    return this.service.setGenres(Number(id), dto.genreIds || []);
  }
}
