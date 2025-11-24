import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FestivalOrmEntity } from './festival.orm-entity';

@Entity({ name: 'News' })
export class News {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: false })
  title: string;

  @Column({ type: 'longtext', nullable: true })
  content?: string;

  @Column({ length: 500, nullable: true })
  image?: string;

  @Column({ name: 'festival_id', type: 'int', nullable: true })
  festivalId?: number;

  @ManyToOne(() => FestivalOrmEntity, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'festival_id' })
  festival?: FestivalOrmEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt?: Date;
}
