
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PromotionRepository } from '../repositories/promotion.repository';
import { UserPromotionRepository } from '../repositories/user-promotion.repository';
import { CreatePromotionDto } from '../dtos/request/create-promotion.dto';
import { ApplyPromotionDto } from '../dtos/request/apply-promotion.dto';
import { DataSource } from 'typeorm';
import { Promotion } from '../../../shared/schemas/promotion.entity';
import { Users } from '../../../shared/schemas/users.entity';
import { UserPromotion } from '../../../shared/schemas/user-promotion.entity';
import { MailService } from '../../../providers/mail/mail.service';
import { PromotionNotificationEmailDto } from '../../../providers/mail/dto/email.dto';

@Injectable()
export class PromotionService {
  constructor(
    private readonly repo: PromotionRepository,
    private readonly userPromoRepo: UserPromotionRepository,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreatePromotionDto) {
    try {
      const {
        startAt,
        endAt,
        usageLimit,
        perUserLimit,
        channelEmail,
        channelInApp,
        ...rest
      } = dto as Partial<CreatePromotionDto> & {
        startAt?: string;
        endAt?: string;
        usageLimit?: number;
        perUserLimit?: number;
      };
      const p = this.repo.create({
        ...rest,
        channelEmail: !!channelEmail,
        channelInApp: channelInApp !== false,
        active: true,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        usageLimit: usageLimit ?? null,
        perUserLimit: perUserLimit ?? null,
      } as Partial<Promotion>);
      return await this.repo.save(p);
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Promotion code already exists');
      }
      throw err;
    }
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const p = await this.repo.findOne({ where: { id } } as any);
    if (!p) throw new NotFoundException('Promotion not found');
    return p;
  }

  async update(id: number, dto: Partial<any>) {
    const p = await this.repo.findOne({ where: { id } } as any);
    if (!p) throw new NotFoundException('Promotion not found');

    if (dto.code !== undefined) p.code = dto.code;
    if (dto.title !== undefined) p.title = dto.title;
    if (dto.description !== undefined) p.description = dto.description;
    if (dto.discountType !== undefined) p.discountType = dto.discountType;
    if (dto.discountValue !== undefined) p.discountValue = dto.discountValue;
    if (dto.channelEmail !== undefined) p.channelEmail = !!dto.channelEmail;
    if (dto.channelInApp !== undefined) p.channelInApp = !!dto.channelInApp;
    if (dto.startAt !== undefined)
      p.startAt = dto.startAt ? new Date(dto.startAt) : undefined;
    if (dto.endAt !== undefined)
      p.endAt = dto.endAt ? new Date(dto.endAt) : undefined;
    if (dto.usageLimit !== undefined) p.usageLimit = dto.usageLimit;
    if (dto.perUserLimit !== undefined) p.perUserLimit = dto.perUserLimit;
    if (dto.active !== undefined) p.active = !!dto.active;

    return this.repo.save(p as any);
  }

  async sendPromotion(
    promoId: number,
    userId: number,
    channel: 'email' | 'inapp' = 'inapp',
  ) {
    const p = await this.findOne(promoId);
    
    // Kiểm tra user có tồn tại không
    const user = await this.dataSource
      .getRepository(Users)
      .findOne({ where: { id: userId } } as any);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (channel === 'email' && p.channelEmail) {
      // Kiểm tra user có email không
      if (!user.email) {
        throw new BadRequestException('User does not have an email address');
      }

      try {
        // Gửi email khuyến mãi
        const userName = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.firstName || user.lastName || `User #${user.id}`;
        
        const emailData: PromotionNotificationEmailDto = {
          to: user.email,
          userName: userName,
          promotionTitle: p.title || p.code,
          promotionDescription: p.description || '',
          discountCode: p.code,
          discountValue: Number(p.discountValue),
          discountType: p.discountType,
          validUntil: p.endAt ? new Date(p.endAt) : undefined,
          imageUrl: p.image || undefined,
        };

        await this.mailService.sendPromotionNotificationEmail(emailData);
        
        console.log(
          `[PromotionService] Email sent successfully to user=${userId} (${user.email}) promo=${p.code}`,
        );
        
        return { 
          success: true, 
          message: `Email sent successfully to ${user.email}` 
        };
      } catch (error: any) {
        console.error(
          `[PromotionService] Failed to send email to user=${userId} promo=${p.code}:`,
          error.message,
        );
        throw new BadRequestException(
          `Failed to send email: ${error.message || 'Unknown error'}`,
        );
      }
    }
    
    if (channel === 'inapp' && p.channelInApp) {
      // Tạo hoặc cập nhật UserPromotion để lưu vào hệ thống
      let userPromo = await this.userPromoRepo.findOne({
        where: { userId, promotionId: p.id },
      } as any);

      if (!userPromo) {
        userPromo = this.userPromoRepo.create({
          userId,
          promotionId: p.id,
          usedCount: 0,
        } as any);
        await this.userPromoRepo.save(userPromo);
      }

      console.log(
        `[PromotionService] Promotion saved to user account: user=${userId} promo=${p.code}`,
      );
      
      return { 
        success: true, 
        message: 'Promotion saved to user account' 
      };
    }
    
    throw new BadRequestException('Channel not supported for this promotion');
  }

  async applyCode(userId: number | undefined, code: string) {
    console.log(`🔍 [Promotion] applyCode called: userId=${userId}, code="${code}"`);
    
    if (userId === undefined || userId === null)
      throw new BadRequestException('User not authenticated');
    if (!Number.isInteger(userId) || userId <= 0)
      throw new BadRequestException('Invalid user');
    const userExists = await this.dataSource
      .getRepository(Users)
      .exist({ where: { id: userId } });
    if (!userExists) throw new BadRequestException('User does not exist');
    
    // Tìm kiếm mã khuyến mãi không phân biệt hoa/thường
    const trimmedCode = code.trim();
    const p = await this.dataSource
      .getRepository(Promotion)
      .createQueryBuilder('promotion')
      .where('LOWER(promotion.code) = LOWER(:code)', { code: trimmedCode })
      .getOne();
    
    console.log(`📋 [Promotion] Found promotion:`, p ? {
      id: p.id,
      code: p.code,
      active: p.active,
      startAt: p.startAt,
      endAt: p.endAt,
      usageLimit: p.usageLimit,
      perUserLimit: p.perUserLimit
    } : 'null');
    
    if (!p)
      throw new NotFoundException('Promotion not found');
    if (!p.active)
      throw new NotFoundException('Promotion is inactive');
    const now = new Date();
    if (p.startAt && now < new Date(p.startAt))
      throw new BadRequestException('Promotion not started');
    if (p.endAt && now > new Date(p.endAt))
      throw new BadRequestException('Promotion expired');
    // Kiểm tra usageLimit (tổng số lần sử dụng của toàn bộ hệ thống)
    // Chỉ kiểm tra nếu usageLimit không null và > 0
    if (p.usageLimit != null && Number(p.usageLimit) > 0) {
      const currentUsageLimit = Number(p.usageLimit);
      if (currentUsageLimit <= 0) {
        throw new BadRequestException('Promotion usage exhausted');
      }
    }
    
    // Kiểm tra perUserLimit (số lần mỗi user được dùng)
    const up = await this.userPromoRepo.findOne({
      where: { userId, promotionId: p.id },
    } as any);
    const userUsed = up ? (up.usedCount || 0) : 0;
    
    // Chỉ kiểm tra perUserLimit nếu nó được set và > 0
    // Logic: nếu perUserLimit = 1, user có thể dùng 1 lần (userUsed = 0 -> OK, userUsed = 1 -> ERROR)
    // Nếu perUserLimit = null hoặc 0 hoặc undefined, không giới hạn
    const perUserLimitValue = p.perUserLimit != null ? Number(p.perUserLimit) : null;
    
    console.log(`🔍 [Promotion] Checking perUserLimit for user ${userId} and code ${p.code}:`, {
      userUsed,
      perUserLimit: perUserLimitValue,
      perUserLimitRaw: p.perUserLimit,
      promotionId: p.id,
      code: p.code,
      hasUserPromotion: !!up,
      userPromotionData: up
    });
    
    if (perUserLimitValue != null && perUserLimitValue > 0) {
      if (userUsed >= perUserLimitValue) {
        console.log(`❌ [Promotion] User ${userId} reached perUserLimit for promotion ${p.code}:`, {
          userUsed,
          perUserLimit: perUserLimitValue,
          promotionId: p.id,
          code: p.code
        });
        throw new BadRequestException(
          `Bạn đã sử dụng hết số lần cho phép của mã khuyến mãi này (${perUserLimitValue} lần)`,
        );
      }
    } else {
      console.log(`ℹ️ [Promotion] perUserLimit is null/0/undefined for promotion ${p.code}, no limit applied`);
    }
    
    console.log(`✅ [Promotion] Validation passed for user ${userId} and code ${p.code}:`, {
      userUsed,
      perUserLimit: perUserLimitValue,
      usageLimit: p.usageLimit,
      active: p.active,
      startAt: p.startAt,
      endAt: p.endAt
    });

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      if (p.usageLimit != null) {
        await qr.manager.decrement(Promotion, { id: p.id } as any, 'usageLimit', 1);
      }

      if (up) {
        await qr.manager.increment(
          UserPromotion,
          { userId: Number(userId), promotionId: p.id } as any,
          'usedCount',
          1,
        );
      } else {
        await qr.manager.insert(UserPromotion, {
          userId: Number(userId),
          promotionId: p.id,
          usedCount: 1,
        });
      }

      await qr.commitTransaction();
      console.log(`✅ [Promotion] Transaction committed successfully for user ${userId} and code ${p.code}`);
    } catch (err) {
      console.error(`❌ [Promotion] Transaction error for user ${userId} and code ${p.code}:`, err);
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    const result = {
      id: p.id,
      code: p.code,
      title: p.title,
      description: p.description,
      discountType: p.discountType,
      discountValue: p.discountValue,
    };
    
    console.log(`✅ [Promotion] Returning result for user ${userId} and code ${p.code}:`, result);
    return result;
  }

  async remove(id: number) {
    const p = await this.repo.findOne({ where: { id } } as any);
    if (!p) throw new NotFoundException('Promotion not found');
    return this.repo.remove(p as any);
  }

  async getUserPromotions(userId: number) {
    // Lấy tất cả promotions đã được gửi cho user qua kênh inapp
    const userPromotions = await this.userPromoRepo.find({
      where: { userId } as any,
    } as any);

    // Lấy thông tin chi tiết của từng promotion
    const promotions = await Promise.all(
      userPromotions.map(async (up) => {
        const promotion = await this.repo.findOne({ where: { id: up.promotionId } } as any);
        if (!promotion || !promotion.active) return null;
        
        // Kiểm tra promotion còn hiệu lực không
        const now = new Date();
        if (promotion.startAt && now < new Date(promotion.startAt)) return null;
        if (promotion.endAt && now > new Date(promotion.endAt)) return null;

        return {
          id: promotion.id,
          code: promotion.code,
          title: promotion.title,
          description: promotion.description,
          image: promotion.image,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          startAt: promotion.startAt,
          endAt: promotion.endAt,
          usedCount: up.usedCount || 0,
          perUserLimit: promotion.perUserLimit,
          createdAt: promotion.createdAt, // Dùng createdAt của promotion
        };
      })
    );

    // Lọc bỏ các promotion null và sắp xếp theo thời gian tạo (mới nhất trước)
    return promotions
      .filter((p) => p !== null)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }
}
