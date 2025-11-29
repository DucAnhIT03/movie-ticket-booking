import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('Events')
export class EventOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image!: string | null;

  @Column({ type: 'longtext', nullable: true })
  content!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ type: 'datetime' })
  start_time!: Date;

  @Column({ type: 'datetime' })
  end_time!: Date;

  @Column({
    type: 'enum',
    enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'],
    default: 'UPCOMING',
  })
  status!: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

  @Column({ type: 'tinyint', width: 1, default: false })
  is_special!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_at!: Date | null;
}


