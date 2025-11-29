import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { EventOrmEntity } from './event.orm-entity';

@Entity('EventRegistrations')
export class EventRegistrationOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  event_id!: number;

  @Column({ length: 255 })
  full_name!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ length: 20 })
  phone!: string;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @ManyToOne(() => EventOrmEntity, (event) => event.id, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event!: EventOrmEntity;
}


