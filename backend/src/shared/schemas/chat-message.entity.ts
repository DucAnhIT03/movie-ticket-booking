import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Users } from './users.entity';
import { TheaterOrmEntity } from './theater.orm-entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'staff_id', nullable: true })
  staffId?: number | null;

  @Column({ name: 'theater_id' })
  theaterId: number;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({ name: 'is_from_staff', type: 'boolean', default: false })
  isFromStaff: boolean;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: Users;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: 'staff_id' })
  staff?: Users;

  @ManyToOne(() => TheaterOrmEntity, { nullable: true })
  @JoinColumn({ name: 'theater_id' })
  theater?: TheaterOrmEntity;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  created_at: Date;
}


