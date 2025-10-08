/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Type } from '../../../constant/enum';
import { MovieGenre } from './movie-genre.entity';

@Entity({ name: 'movies' })
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: false })
  title: string;

  @Column({ length: 1000, nullable: true })
  description?: string;

  @Column({ length: 100, nullable: true })
  author?: string;

  @Column({ length: 255, nullable: true })
  image?: string;

  @Column({ length: 255, nullable: true })
  trailer?: string;

  @Column({ type: 'enum', enum: Type, default: Type.TwoD })
  type: Type;

  @Column({ type: 'int', nullable: true })
  duration?: number; // in minutes

  @Column({ name: 'release_date', type: 'datetime', nullable: true })
  releaseDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt?: Date;

  @OneToMany(() => MovieGenre, (mg) => mg.movie)
  movieGenres: MovieGenre[];
}
