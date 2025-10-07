import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, nullable: true })
  first_name?: string;

  @Column({ length: 100, nullable: true })
  last_name?: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @OneToMany(() => Booking, (b) => b.user)
  bookings: Booking[];
}
