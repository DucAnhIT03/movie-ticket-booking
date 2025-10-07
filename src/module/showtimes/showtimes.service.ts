import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Showtime } from './entities/showtime.entity';
import { CreateShowtimeDto } from './dto/create-showtime.dto';

@Injectable()
export class ShowtimesService {
  constructor(
    @InjectRepository(Showtime)
    private readonly showtimeRepo: Repository<Showtime>,
  ) {}

  findAll() {
    return this.showtimeRepo.find({
      where: { isActive: true },
      order: { startTime: 'ASC' },
    });
  }

  findByMovie(movieId: number) {
    return this.showtimeRepo.find({
      where: { movieId, isActive: true },
      order: { startTime: 'ASC' },
    });
  }

  findByDate(date: string) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);
    return this.showtimeRepo.find({
      where: { startTime: Between(start, end), isActive: true },
      order: { startTime: 'ASC' },
    });
  }

  findByRoom(room: string) {
    return this.showtimeRepo.find({
      where: { room, isActive: true },
      order: { startTime: 'ASC' },
    });
  }

  create(dto: CreateShowtimeDto) {
    const showtime = this.showtimeRepo.create(dto);
    return this.showtimeRepo.save(showtime);
  }
}
