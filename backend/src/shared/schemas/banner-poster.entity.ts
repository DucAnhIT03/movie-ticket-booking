import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'BannerPoster' })
export class BannerPoster {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  image_url!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;

  @Column({ name: 'updated_at', type: 'datetime', nullable: true })
  updated_at!: Date | null;
}












