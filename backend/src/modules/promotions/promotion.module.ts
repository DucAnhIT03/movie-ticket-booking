import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from '../../shared/schemas/promotion.entity';
import { UserPromotion } from '../../shared/schemas/user-promotion.entity';
import { Users } from '../../shared/schemas/users.entity';
import { PromotionService } from './services/promotion.service';
import { PromotionController } from './controllers/promotion.controller';
import { PromotionRepository } from './repositories/promotion.repository';
import { UserPromotionRepository } from './repositories/user-promotion.repository';
import { MailModule } from '../../providers/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Promotion, UserPromotion, Users]),
    MailModule,
  ],
  providers: [PromotionService, PromotionRepository, UserPromotionRepository],
  controllers: [PromotionController],
  exports: [PromotionService],
})
export class PromotionModule {}
