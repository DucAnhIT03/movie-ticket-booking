/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../entities/movie.entity';
import { CreateMovieDto } from '../dtos/create-movie.dto';
import { Genre } from '../entities/genres.entity';
import { MovieGenre } from '../entities/movie-genre.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie) private repo: Repository<Movie>,
    @InjectRepository(Genre) private genresRepo: Repository<Genre>,
    @InjectRepository(MovieGenre) private movieGenreRepo: Repository<MovieGenre>,
  ) {}

  async create(dto: CreateMovieDto) {
    const m = this.repo.create({
      title: dto.title,
      description: dto.description,
      author: dto.author,
      image: dto.image,
      trailer: dto.trailer,
      type: dto.type as any,
      duration: dto.duration,
    });
    return this.repo.save(m);
  }

  async createMany(dtos: CreateMovieDto[]) {
    if (!dtos || dtos.length === 0) return [];
    const entities = dtos.map((d) =>
      this.repo.create({
        title: d.title,
        description: d.description,
        author: d.author,
        image: d.image,
        trailer: d.trailer,
        type: d.type as any,
        duration: d.duration,
      }),
    );
    return this.repo.save(entities);
  }

  async addGenre(movieId: number, genreId: number) {
    const movie = await this.repo.findOne({ where: { id: movieId } });
    if (!movie) throw new NotFoundException('Movie not found');
    const genre = await this.genresRepo.findOne({ where: { id: genreId } });
    if (!genre) throw new NotFoundException('Genre not found');
    const exists = await this.movieGenreRepo.findOne({ where: { movieId, genreId } });
    if (!exists) {
      const mapping = this.movieGenreRepo.create({ movieId, genreId });
      mapping.movie = movie;
      mapping.genre = genre;
      await this.movieGenreRepo.save(mapping);
    }
    return { success: true };
  }

  async removeGenre(movieId: number, genreId: number) {
    const mapping = await this.movieGenreRepo.findOne({ where: { movieId, genreId } });
    if (!mapping) return { success: true };
    await this.movieGenreRepo.remove(mapping);
    return { success: true };
  }

  async getGenresForMovie(movieId: number) {
    const movie = await this.repo.findOne({ where: { id: movieId } });
    if (!movie) throw new NotFoundException('Movie not found');
    const mappings = await this.movieGenreRepo.find({ where: { movieId }, relations: ['genre'] });
    return (mappings || []).map((m) => ({ id: m.genre.id, genreName: m.genre.genreName }));
  }

  async findAll() {
    const movies = await this.repo.find({ relations: ['movieGenres', 'movieGenres.genre'] });
    return (movies || []).map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      author: m.author,
      image: m.image,
      trailer: m.trailer,
      type: m.type,
      duration: m.duration,
      releaseDate: m.releaseDate,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
  genres: (m.movieGenres || []).map((mg) => mg.genre?.genreName).filter(Boolean),
    }));
  }

  async findOne(id: number) {
    const m = await this.repo.findOne({ where: { id }, relations: ['movieGenres', 'movieGenres.genre'] });
    if (!m) throw new NotFoundException('Movie not found');
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      author: m.author,
      image: m.image,
      trailer: m.trailer,
      type: m.type,
      duration: m.duration,
      releaseDate: m.releaseDate,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      genres: (m.movieGenres || []).map((mg) => mg.genre?.genreName).filter(Boolean),
    };
  }

  async remove(id: number) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Movie not found');
    await this.repo.remove(entity);
    return { success: true };
  }
}
