import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Users } from './users.entity';
import { TheaterOrmEntity } from './theater.orm-entity';

@Entity('chat_conversations')
export class ChatConversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'staff_id', nullable: true })
  staffId?: number | null;

  @Column({ name: 'theater_id' })
  theaterId: number;

  @Column({ name: 'last_message', type: 'text', nullable: true })
  lastMessage?: string | null;

  @Column({ name: 'last_message_at', type: 'datetime', nullable: true })
  lastMessageAt?: Date | null;

  @Column({ name: 'user_unread_count', type: 'int', default: 0 })
  userUnreadCount: number;

  @Column({ name: 'staff_unread_count', type: 'int', default: 0 })
  staffUnreadCount: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

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

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', nullable: true })
  updated_at?: Date;
}

