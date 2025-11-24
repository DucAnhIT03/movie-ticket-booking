import type { MovieEntity } from '../../../shared/types/movie';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../../../shared/schemas/movie.entity';

@Injectable()
export class MoviesRepository {
  constructor(
    @InjectRepository(Movie) private readonly repo: Repository<Movie>,
  ) {}

  async findAll(): Promise<MovieEntity[]> {
    const rows = await this.repo.find({ order: { releaseDate: 'DESC' } });
    return rows as unknown as MovieEntity[];
  }

  async findById(id: number): Promise<MovieEntity | null> {
    const row = await this.repo.findOne({ where: { id } });
    return (row as unknown as MovieEntity) ?? null;
  }

  async findNowShowing(now: Date): Promise<MovieEntity[]> {
    // Phim đang chiếu = phim có thời gian công chiếu (start_date) <= ngày hiện tại
    // Ví dụ: Hôm nay 15/11, phim công chiếu 14/11 hoặc 15/11 → đang chiếu
    // Phim công chiếu 16/11 → KHÔNG phải đang chiếu (là sắp chiếu)
    // Đến ngày 16/11 thì phim đó mới là đang chiếu
    // Nếu start_date NULL thì dùng release_date làm fallback
    
    // So sánh theo ngày: lấy start of tomorrow (00:00:00 ngày mai)
    // Phim có COALESCE(start_date, release_date) < start of tomorrow → đang chiếu
    const startOfTomorrow = new Date(now);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);
    startOfTomorrow.setMinutes(0, 0);
    startOfTomorrow.setSeconds(0, 0);
    startOfTomorrow.setMilliseconds(0);
    
    // Lấy danh sách movies
    const movies = await this.repo
      .createQueryBuilder('movie')
      .where('COALESCE(movie.start_date, movie.release_date) < :startOfTomorrow', { startOfTomorrow })
      .orderBy('COALESCE(movie.start_date, movie.release_date)', 'DESC')
      .getMany();

    // Lấy genres cho từng movie
    const movieIds = movies.map(m => m.id);
    if (movieIds.length === 0) {
      return movies as unknown as MovieEntity[];
    }

    const genresData = await this.repo.manager
      .createQueryBuilder()
      .select('mg.movie_id', 'movieId')
      .addSelect('g.id', 'genreId')
      .addSelect('g.genre_name', 'genreName')
      .from('Movie_Genre', 'mg')
      .leftJoin('Genre', 'g', 'g.id = mg.genre_id')
      .where('mg.movie_id IN (:...movieIds)', { movieIds })
      .getRawMany();

    // Group genres theo movieId
    const genresByMovieId = new Map<number, any[]>();
    genresData.forEach((row: any) => {
      if (!genresByMovieId.has(row.movieId)) {
        genresByMovieId.set(row.movieId, []);
      }
      if (row.genreId) {
        genresByMovieId.get(row.movieId)!.push({
          genre: {
            id: row.genreId,
            genreName: row.genreName
          }
        });
      }
    });

    // Map genres vào movies
    return (movies as any[]).map(movie => ({
      ...movie,
      movieGenres: genresByMovieId.get(movie.id) || []
    })) as unknown as MovieEntity[];
  }

  async findComingSoon(now: Date): Promise<MovieEntity[]> {
    // Phim sắp chiếu = phim có thời gian công chiếu (start_date) > ngày hiện tại
    // Ví dụ: Hôm nay 15/11, phim công chiếu 16/11 hoặc sau đó → sắp chiếu
    // Đến ngày 16/11 thì phim đó sẽ chuyển sang đang chiếu
    // Nếu start_date NULL thì dùng release_date làm fallback
    
    // So sánh theo ngày: lấy start of tomorrow (00:00:00 ngày mai)
    // Phim có COALESCE(start_date, release_date) >= start of tomorrow → sắp chiếu
    const startOfTomorrow = new Date(now);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);
    startOfTomorrow.setMinutes(0, 0);
    startOfTomorrow.setSeconds(0, 0);
    startOfTomorrow.setMilliseconds(0);
    
    // Lấy danh sách movies
    const movies = await this.repo
      .createQueryBuilder('movie')
      .where('COALESCE(movie.start_date, movie.release_date) >= :startOfTomorrow', { startOfTomorrow })
      .orderBy('COALESCE(movie.start_date, movie.release_date)', 'ASC')
      .getMany();

    // Lấy genres cho từng movie
    const movieIds = movies.map(m => m.id);
    if (movieIds.length === 0) {
      return movies as unknown as MovieEntity[];
    }

    const genresData = await this.repo.manager
      .createQueryBuilder()
      .select('mg.movie_id', 'movieId')
      .addSelect('g.id', 'genreId')
      .addSelect('g.genre_name', 'genreName')
      .from('Movie_Genre', 'mg')
      .leftJoin('Genre', 'g', 'g.id = mg.genre_id')
      .where('mg.movie_id IN (:...movieIds)', { movieIds })
      .getRawMany();

    // Group genres theo movieId
    const genresByMovieId = new Map<number, any[]>();
    genresData.forEach((row: any) => {
      if (!genresByMovieId.has(row.movieId)) {
        genresByMovieId.set(row.movieId, []);
      }
      if (row.genreId) {
        genresByMovieId.get(row.movieId)!.push({
          genre: {
            id: row.genreId,
            genreName: row.genreName
          }
        });
      }
    });

    // Map genres vào movies
    return (movies as any[]).map(movie => ({
      ...movie,
      movieGenres: genresByMovieId.get(movie.id) || []
    })) as unknown as MovieEntity[];
  }
}

