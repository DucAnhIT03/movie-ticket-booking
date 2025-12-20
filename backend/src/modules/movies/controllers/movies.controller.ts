import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MoviesService } from '../services/movies.service';
import { MovieResponseDto } from '../dtos/response/movies.response.dto';
import { CacheResponse } from '../../../providers/redis-cache';
import { RedisCacheService } from '../../../providers/redis-cache/redis-cache.service';

@ApiTags('Phim (Movies)')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get('now-showing')
  @CacheResponse(`${RedisCacheService.KEYS.MOVIES}:now-showing`, RedisCacheService.TTL.MOVIES)
  @ApiOperation({ summary: 'Lấy danh sách phim đang chiếu' })
  @ApiOkResponse({
    description: 'Danh sách phim đang chiếu',
    type: [MovieResponseDto],
  })
  async getNowShowing(): Promise<MovieResponseDto[]> {
    const movies = await this.moviesService.findNowShowing();
    return MovieResponseDto.fromEntities(movies);
  }

  @Get('coming-soon')
  @CacheResponse(`${RedisCacheService.KEYS.MOVIES}:coming-soon`, RedisCacheService.TTL.MOVIES)
  @ApiOperation({ summary: 'Lấy danh sách phim sắp chiếu' })
  @ApiOkResponse({
    description: 'Danh sách phim sắp chiếu',
    type: [MovieResponseDto],
  })
  async getComingSoon(): Promise<MovieResponseDto[]> {
    const movies = await this.moviesService.findComingSoon();
    return MovieResponseDto.fromEntities(movies);
  }
}

