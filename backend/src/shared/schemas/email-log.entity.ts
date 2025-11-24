import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'email_logs' })
export class EmailLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  to!: string;

  @Column({ type: 'varchar', length: 500 })
  subject!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type?: string;

  @Column({ type: 'enum', enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' })
  status!: 'PENDING' | 'SENT' | 'FAILED';

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({ name: 'message_id', type: 'varchar', length: 255, nullable: true })
  messageId?: string;

  @CreateDateColumn({ 
    name: 'sent_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP'
  })
  sentAt!: Date;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;
}


