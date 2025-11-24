import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Screen } from './screen.entity';

@Entity('Theaters')
export class TheaterOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 255 })
  location!: string;

  @Column({ length: 20 })
  phone!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at!: Date;

  @Column({ name: 'updated_at', type: 'datetime', nullable: true })
  updated_at!: Date | null;

  @OneToMany(() => Screen, (s) => s.theater)
  screens!: Screen[];
}


