import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserPromotion } from './user-promotion.entity';
import { PromotionDiscountType, Status } from 'src/common/constants/enums';

@Entity({ name: 'promotions' })
export class Promotion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  code: string;

  @Column({ length: 255, nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 500, nullable: true })
  image?: string;

  @Column({
    type: 'enum',
    enum: PromotionDiscountType,
    default: PromotionDiscountType.PERCENT,
  })
  discountType: PromotionDiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ type: 'datetime', nullable: true })
  startAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  endAt?: Date;

  @Column({ type: 'enum', enum: Status, default: Status.ACTIVE })
  status: Status;

  @Column({ default: false })
  channelEmail: boolean;

  @Column({ default: true })
  channelInApp: boolean;

  @Column({ type: 'int', nullable: true })
  usageLimit?: number;

  @Column({ type: 'int', nullable: true })
  perUserLimit?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt?: Date;

  @OneToMany(() => UserPromotion, (up) => up.promotion)
  userPromotions: UserPromotion[];
  @Column({ default: true })
  active: boolean;
}
export { PromotionDiscountType };
