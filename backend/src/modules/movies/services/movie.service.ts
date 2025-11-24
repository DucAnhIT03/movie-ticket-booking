
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateMovieDto } from '../dtos/request/create-movie.dto';
import { UpdateMovieDto } from '../dtos/request/update-movie.dto';
import { MovieRepository } from '../repositories/movie.repository';
import { GenreRepository } from '../repositories/genre.repository';
import { MovieGenreRepository } from '../repositories/movie-genre.repository';
import { Movie } from '../../../shared/schemas/movie.entity';
import { MovieGenre } from '../../../shared/schemas/movie-genre.entity';
import { Showtime } from '../../../shared/schemas/showtime.entity';
import { Booking } from '../../../shared/schemas/booking.entity';
import { DataSource } from 'typeorm';
import { Brackets } from 'typeorm';

@Injectable()
export class MovieService {
  constructor(
    private readonly movieRepo: MovieRepository,
    private readonly genreRepo: GenreRepository,
    private readonly movieGenreRepo: MovieGenreRepository,
    private readonly dataSource: DataSource,
    @InjectRepository(Showtime)
    private readonly showtimeRepo: Repository<Showtime>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  async create(dto: CreateMovieDto) {
    const releaseDate = dto.releaseDate ? new Date(dto.releaseDate) : new Date();
    
    if (isNaN(releaseDate.getTime())) {
      throw new BadRequestException('Ngày phát hành không hợp lệ');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    if (startDate && isNaN(startDate.getTime())) {
      throw new BadRequestException('Ngày bắt đầu công chiếu không hợp lệ');
    }

    if (endDate && isNaN(endDate.getTime())) {
      throw new BadRequestException('Ngày kết thúc công chiếu không hợp lệ');
    }

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException('Ngày kết thúc công chiếu phải sau hoặc bằng ngày bắt đầu');
    }

    const movieType = dto.type ?? '2D';
    
    // Validate duration - phải là số nguyên dương
    const duration = dto.duration ? Number(dto.duration) : 0;
    if (isNaN(duration) || duration < 0) {
      throw new BadRequestException('Thời lượng phim phải là số nguyên dương (tính bằng phút)');
    }
    
    const m = this.movieRepo.create({
      title: dto.title,
      description: dto.description,
      author: dto.author,
      country: dto.country,
      image: dto.image,
      trailer: dto.trailer,
      type: movieType as any,
      duration: duration,
      releaseDate: releaseDate,
      startDate: startDate,
      endDate: endDate,
    });
    return this.movieRepo.save(m);
  }

  async createMany(dtos: CreateMovieDto[]) {
    if (!dtos || dtos.length === 0) return [];
    const entities = dtos.map((d) => {
      const releaseDate = d.releaseDate ? new Date(d.releaseDate) : new Date();
      
      if (isNaN(releaseDate.getTime())) {
        throw new BadRequestException(`Ngày phát hành không hợp lệ cho phim: ${d.title}`);
      }

      const startDate = d.startDate ? new Date(d.startDate) : undefined;
      const endDate = d.endDate ? new Date(d.endDate) : undefined;

      if (startDate && isNaN(startDate.getTime())) {
        throw new BadRequestException(`Ngày bắt đầu công chiếu không hợp lệ cho phim: ${d.title}`);
      }

      if (endDate && isNaN(endDate.getTime())) {
        throw new BadRequestException(`Ngày kết thúc công chiếu không hợp lệ cho phim: ${d.title}`);
      }

      if (startDate && endDate && endDate < startDate) {
        throw new BadRequestException(`Ngày kết thúc công chiếu phải sau hoặc bằng ngày bắt đầu cho phim: ${d.title}`);
      }

      const movieType = d.type ?? '2D';
      
      // Validate duration - phải là số nguyên dương
      const duration = d.duration ? Number(d.duration) : 0;
      if (isNaN(duration) || duration < 0) {
        throw new BadRequestException(`Thời lượng phim phải là số nguyên dương (tính bằng phút) cho phim: ${d.title}`);
      }
      
      return this.movieRepo.create({
        title: d.title,
        description: d.description,
        author: d.author,
        country: d.country,
        image: d.image,
        trailer: d.trailer,
        type: movieType as any,
        duration: duration,
        releaseDate: releaseDate,
        startDate: startDate,
        endDate: endDate,
      });
    });
    return this.movieRepo.save(entities);
  }

  async addGenre(movieId: number, genre: number | string) {
    const movie = await this.movieRepo.findOne({ where: { id: movieId } });
    if (!movie) throw new NotFoundException('Movie not found');

    let gid = Number(genre as any);
    let genreEntity = null as any;
    if (!Number.isNaN(gid)) {
      genreEntity = await this.genreRepo.findOne({ where: { id: gid } });
    } else if (typeof genre === 'string' && genre.trim().length > 0) {
      const name = genre.trim();
      // Tìm genre không phân biệt hoa thường
      const found = await this.genreRepo
        .createQueryBuilder('genre')
        .where('LOWER(genre.genreName) = LOWER(:name)', { name })
        .getOne();
      if (!found) {
        throw new NotFoundException(
          `Thể loại "${name}" không tồn tại. Vui lòng tạo thể loại trước hoặc sử dụng ID thể loại.`,
        );
      }
      gid = found.id;
      genreEntity = found;
    } else {
      throw new NotFoundException('Invalid genre');
    }
    if (!genreEntity) throw new NotFoundException('Genre not found');
    const exists = await this.movieGenreRepo.findOne({
      where: { movieId, genreId: gid },
    });
    if (!exists) {
      const mapping = this.movieGenreRepo.create({ movieId, genreId: gid });
      mapping.movie = movie;
      mapping.genre = genreEntity;
      await this.movieGenreRepo.save(mapping);
    }
    return { success: true };
  }

  async removeGenre(movieId: number, genreId: number) {
    const mapping = await this.movieGenreRepo.findOne({
      where: { movieId, genreId },
    });
    if (!mapping) return { success: true };
    await this.movieGenreRepo.remove(mapping);
    return { success: true };
  }

  async getGenresForMovie(movieId: number) {
    const movie = await this.movieRepo.findOne({ where: { id: movieId } });
    if (!movie) throw new NotFoundException('Movie not found');
    const mappings = await this.movieGenreRepo.find({
      where: { movieId },
      relations: ['genre'],
    });
    return (mappings || []).map((m) => ({
      id: m.genre.id,
      genreName: m.genre.genreName,
    }));
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    genreId?: number;
  }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params?.limit) || 10));
    const skip = (page - 1) * limit;

    const query = this.movieRepo.createQueryBuilder('movie');
    query.leftJoinAndSelect('movie.movieGenres', 'movieGenres');
    query.leftJoinAndSelect('movieGenres.genre', 'genre');

    if (params?.search) {
      const searchId = Number(params.search);
      const isValidId = !isNaN(searchId) && searchId > 0;
      
      query.where(
        new Brackets((qb) => {
          if (isValidId) {
            qb.where('movie.id = :searchId', { searchId })
              .orWhere('movie.title LIKE :search', { search: `%${params.search}%` })
              .orWhere('movie.author LIKE :search', { search: `%${params.search}%` });
          } else {
            qb.where('movie.title LIKE :search', { search: `%${params.search}%` })
              .orWhere('movie.author LIKE :search', { search: `%${params.search}%` });
          }
        }),
      );
    }

    if (params?.genreId) {
      query.andWhere('genre.id = :genreId', { genreId: params.genreId });
    }

    query.orderBy('movie.releaseDate', 'DESC');
    query.skip(skip).take(limit);

    const [movies, total] = await query.getManyAndCount();

    return {
      items: (movies || []).map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        author: m.author,
        country: m.country,
        image: m.image,
        trailer: m.trailer,
        type: m.type,
        duration: m.duration,
        releaseDate: m.releaseDate,
        startDate: m.startDate,
        endDate: m.endDate,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        genres: (m.movieGenres || [])
          .map((mg) => mg.genre?.genreName)
          .filter(Boolean),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const m = await this.movieRepo.findOne({
      where: { id },
      relations: ['movieGenres', 'movieGenres.genre'],
    });
    if (!m) throw new NotFoundException('Movie not found');
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      author: m.author,
      country: m.country,
      image: m.image,
      trailer: m.trailer,
      type: m.type,
      duration: m.duration,
      releaseDate: m.releaseDate,
      startDate: m.startDate,
      endDate: m.endDate,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      genres: (m.movieGenres || [])
        .map((mg) => mg.genre?.genreName)
        .filter(Boolean),
    };
  }

  async update(id: number, dto: UpdateMovieDto) {
    const movie = await this.movieRepo.findOne({ where: { id } });
    if (!movie) throw new NotFoundException('Movie not found');

    // Chuẩn bị dữ liệu cập nhật
    const updateData: Partial<Movie> = {};

    if (dto.title !== undefined) {
      updateData.title = dto.title;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    if (dto.author !== undefined) {
      updateData.author = dto.author;
    }

    if (dto.country !== undefined) {
      updateData.country = dto.country;
    }

    if (dto.image !== undefined) {
      updateData.image = dto.image;
    }

    if (dto.trailer !== undefined) {
      updateData.trailer = dto.trailer;
    }

    if (dto.type !== undefined) {
      updateData.type = dto.type as any;
    }

    if (dto.duration !== undefined) {
      updateData.duration = dto.duration;
    }

    if (dto.releaseDate !== undefined) {
      const releaseDate = new Date(dto.releaseDate);
      if (isNaN(releaseDate.getTime())) {
        throw new BadRequestException('Ngày phát hành không hợp lệ');
      }
      updateData.releaseDate = releaseDate;
    }

    if (dto.startDate !== undefined) {
      const startDate = dto.startDate ? new Date(dto.startDate) : null;
      if (startDate && isNaN(startDate.getTime())) {
        throw new BadRequestException('Ngày bắt đầu công chiếu không hợp lệ');
      }
      updateData.startDate = startDate as any;
    }

    if (dto.endDate !== undefined) {
      const endDate = dto.endDate ? new Date(dto.endDate) : null;
      if (endDate && isNaN(endDate.getTime())) {
        throw new BadRequestException('Ngày kết thúc công chiếu không hợp lệ');
      }
      updateData.endDate = endDate as any;
    }

    // Validate startDate <= endDate nếu cả hai đều được cập nhật
    const finalStartDate = updateData.startDate !== undefined ? updateData.startDate : movie.startDate;
    const finalEndDate = updateData.endDate !== undefined ? updateData.endDate : movie.endDate;
    if (finalStartDate && finalEndDate && finalEndDate < finalStartDate) {
      throw new BadRequestException('Ngày kết thúc công chiếu phải sau hoặc bằng ngày bắt đầu');
    }

    // Cập nhật nếu có dữ liệu
    if (Object.keys(updateData).length > 0) {
      await this.movieRepo.update(id, updateData);
    }

    // Trả về thông tin phim đã cập nhật
    return this.findOne(id);
  }

  async remove(id: number) {
    try {
      const entity = await this.movieRepo.findOne({ where: { id } });
      if (!entity) throw new NotFoundException('Movie not found');
      
      // Kiểm tra xem có showtimes nào của movie này không bằng query builder
      const showtimesCount = await this.showtimeRepo
        .createQueryBuilder('showtime')
        .where('showtime.movieId = :movieId', { movieId: id })
        .getCount();
      
      if (showtimesCount > 0) {
        // Kiểm tra xem có bookings nào liên quan đến các showtimes này không
        // Lấy danh sách showtime IDs trước
        const showtimes = await this.showtimeRepo
          .createQueryBuilder('showtime')
          .select('showtime.id', 'id')
          .where('showtime.movieId = :movieId', { movieId: id })
          .getRawMany();
        
        const showtimeIds = showtimes.map(st => st.id);
        
        if (showtimeIds.length > 0) {
          // Kiểm tra bookings với showtime IDs
          const bookingsCount = await this.bookingRepo
            .createQueryBuilder('booking')
            .where('booking.showtimeId IN (:...showtimeIds)', { showtimeIds })
            .getCount();
        
          if (bookingsCount > 0) {
            throw new BadRequestException(
              `Không thể xóa phim này vì đang có ${bookingsCount} đặt vé liên quan đến ${showtimesCount} suất chiếu. Vui lòng hủy tất cả các đặt vé trước khi xóa phim.`
            );
          }
        }
      }
      
      await this.movieRepo.remove(entity);
      return { success: true };
    } catch (error) {
      // Nếu đã là BadRequestException hoặc NotFoundException thì throw lại
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Các lỗi khác (có thể là database constraint) thì throw BadRequestException với message rõ ràng
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Không thể xóa phim này. Có thể phim đang được sử dụng trong các suất chiếu hoặc đặt vé. Chi tiết: ${errorMessage}`
      );
    }
  }

  async setGenres(movieId: number, genreIds: number[]) {
    const movie = await this.movieRepo.findOne({ where: { id: movieId } });
    if (!movie) throw new NotFoundException('Movie not found');

    
    const gids = (genreIds || [])
      .map((g) => Number(g))
      .filter((g) => !Number.isNaN(g));

    
    // Sử dụng In() để tìm nhiều genres cùng lúc
    const foundGenres = await this.genreRepo.find({
      where: { id: In(gids) },
    });
    if ((foundGenres || []).length !== gids.length) {
      throw new NotFoundException('One or more genres not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Xóa các mapping cũ sử dụng entity class với property name đúng
      await queryRunner.manager.delete(MovieGenre, { movieId: movieId });

      // Thêm các mapping mới
      if (gids.length) {
        const mappings = gids.map((gid) => ({
          movieId: movieId,
          genreId: gid,
        }));
        await queryRunner.manager.insert(MovieGenre, mappings);
      }

      await queryRunner.commitTransaction();
     
      return this.findOne(movieId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
