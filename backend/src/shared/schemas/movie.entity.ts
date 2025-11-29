import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MovieType } from '../../common/constants/enums';
import { MovieGenre } from './movie-genre.entity';

@Entity({ name: 'Movies' })
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: false })
  title: string;

  @Column({ name: 'descriptions', type: 'text', nullable: true })
  description?: string;

  @Column({ length: 100, nullable: true })
  author?: string;

  @Column({ length: 100, nullable: true })
  country?: string;

  @Column({ length: 255, nullable: true })
  image?: string;

  @Column({ length: 255, nullable: true })
  trailer?: string;

  @Column({ type: 'enum', enum: MovieType, nullable: false })
  type: MovieType;

  @Column({ type: 'int', nullable: false })
  duration: number; // in minutes

  @Column({ name: 'release_date', type: 'datetime', nullable: false })
  releaseDate: Date;

  @Column({ name: 'start_date', type: 'datetime', nullable: true })
  startDate?: Date; // Ngày bắt đầu công chiếu

  @Column({ name: 'end_date', type: 'datetime', nullable: true })
  endDate?: Date; // Ngày kết thúc công chiếu

  @Column({ name: 'rating_warning', type: 'text', nullable: true })
  ratingWarning?: string; // Cảnh báo yêu cầu của phim (ví dụ: PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI XEM TỪ ĐỦ 13 TUỔI TRỞ LÊN (13+))

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt?: Date;

  @OneToMany(() => MovieGenre, (mg) => mg.movie)
  movieGenres: MovieGenre[];
}
