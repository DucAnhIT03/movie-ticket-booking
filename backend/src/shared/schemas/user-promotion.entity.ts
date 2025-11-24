import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Users } from './users.entity';
import { Promotion } from './promotion.entity';

@Entity({ name: 'user_promotions' })
export class UserPromotion {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @PrimaryColumn({ name: 'promotion_id' })
  promotionId: number;

  @ManyToOne(() => Users, (u) => (u as any).userPromotions)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Promotion, (p) => p.userPromotions)
  @JoinColumn({ name: 'promotion_id' })
  promotion: Promotion;

  @Column({ name: 'used_count', type: 'int', default: 0 })
  usedCount: number;
}
