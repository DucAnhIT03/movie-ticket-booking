import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { BannerType } from '../../common/constants/enums';

@Entity({ name: 'Banners' })
export class Banner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: false })
  url: string;

  @Column({ type: 'enum', enum: BannerType })
  type: BannerType;

  @Column({ type: 'varchar', length: 255 })
  position: string;

  @Column({ type: 'int', nullable: true })
  width?: number | null;

  @Column({ type: 'int', nullable: true })
  height?: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;

  @Column({ name: 'updated_at', type: 'datetime', nullable: true })
  updated_at!: Date | null;
}
