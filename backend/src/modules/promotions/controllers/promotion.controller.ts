
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  Put,
  Delete,
} from '@nestjs/common';
import { PromotionService } from '../services/promotion.service';
import { CreatePromotionDto } from '../dtos/request/create-promotion.dto';
import { ApplyPromotionDto } from '../dtos/request/apply-promotion.dto';
import { UpdatePromotionDto } from '../dtos/request/update-promotion.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionController {
  constructor(private readonly service: PromotionService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Tạo khuyến mãi mới - Chỉ admin' })
  @ApiResponse({ status: 201, description: 'Khuyến mãi được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiBody({
    type: CreatePromotionDto,
    examples: {
      basic: {
        summary: 'Create percent discount',
        value: {
          code: 'SUMMER2025',
          title: 'Summer discount',
          description: '10% off for festival tickets',
          discountType: 'PERCENT',
          discountValue: 10,
          channelEmail: true,
          channelInApp: true,
        },
      },
      amount: {
        summary: 'Create fixed amount discount',
        value: {
          code: 'WELCOME50K',
          title: 'Welcome voucher',
          description: '50,000 VND off for new users',
          discountType: 'AMOUNT',
          discountValue: 50000,
          channelEmail: false,
          channelInApp: true,
        },
      },
    },
  })
  create(@Body() dto: CreatePromotionDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Lấy danh sách tất cả khuyến mãi',
    description: 'Lấy danh sách tất cả các khuyến mãi trong hệ thống'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách khuyến mãi',
    schema: {
      example: [
        {
          id: 1,
          code: 'SUMMER2025',
          title: 'Summer discount',
          description: '10% off for festival tickets',
          discountType: 'PERCENT',
          discountValue: 10,
          channelEmail: true,
          channelInApp: true,
          startDate: '2025-06-01T00:00:00.000Z',
          endDate: '2025-08-31T23:59:59.000Z'
        }
      ]
    }
  })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một khuyến mãi' })
  @ApiParam({ name: 'id', description: 'ID của khuyến mãi' })
  @ApiResponse({ status: 200, description: 'Thông tin khuyến mãi' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khuyến mãi' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post(':id/send')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Gửi khuyến mãi cho người dùng - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của khuyến mãi' })
  @ApiResponse({ status: 200, description: 'Gửi khuyến mãi thành công' })
  @ApiBody({
    schema: {
      example: { userId: 123, channel: 'email' },
    },
  })
  send(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId: number; channel?: 'email' | 'inapp' },
  ) {
    const ch = body && body.channel ? body.channel : 'inapp';
    return this.service.sendPromotion(id, Number(body.userId), ch);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Áp dụng mã khuyến mãi' })
  @ApiResponse({ status: 200, description: 'Áp dụng mã thành công' })
  @ApiResponse({ status: 400, description: 'Mã không hợp lệ hoặc đã hết hạn' })
  @ApiBody({
    type: ApplyPromotionDto,
    examples: {
      basic: { summary: 'Apply promo code', value: { code: 'SUMMER2025' } },
    },
  })
  apply(@Request() req: any, @Body() dto: ApplyPromotionDto) {
    const userId = req.user?.sub;
    if (!userId) {
      
      throw new (require('@nestjs/common').UnauthorizedException)(
        'Unauthorized: missing or invalid token',
      );
    }
    return this.service.applyCode(Number(userId), dto.code);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Cập nhật khuyến mãi - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của khuyến mãi' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khuyến mãi' })
  @ApiBody({ type: UpdatePromotionDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.service.update(id, dto as any);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Xóa khuyến mãi - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID của khuyến mãi cần xóa' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy khuyến mãi' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get('my/notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Lấy danh sách khuyến mãi đã được gửi cho user (thông báo)' })
  @ApiResponse({ status: 200, description: 'Danh sách khuyến mãi của user' })
  getMyNotifications(@Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new (require('@nestjs/common').UnauthorizedException)(
        'Unauthorized: missing or invalid token',
      );
    }
    return this.service.getUserPromotions(Number(userId));
  }
}
