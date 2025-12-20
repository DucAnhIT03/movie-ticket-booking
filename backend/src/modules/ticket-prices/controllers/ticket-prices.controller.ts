import { Controller, Get, Post, Put, Delete, Body, Query, Param, ParseIntPipe, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TicketPricesService } from '../services/ticket-prices.service';
import { CreateTicketPriceDto } from '../dtos/request/create-ticket-price.dto';
import { UpdateTicketPriceDto } from '../dtos/request/update-ticket-price.dto';
import { BatchCreateTicketPriceDto } from '../dtos/request/batch-create-ticket-price.dto';
import { TicketPriceResponseDto } from '../dtos/response/ticket-prices.response.dto';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { CacheResponse, InvalidateCache } from '../../../providers/redis-cache';
import { RedisCacheService } from '../../../providers/redis-cache/redis-cache.service';

@ApiTags('🎫 Vé')
@Controller('ticket-prices')
export class TicketPricesController {
  constructor(private readonly ticketPricesService: TicketPricesService) {}

  @Get()
  @CacheResponse(RedisCacheService.KEYS.TICKET_PRICES, RedisCacheService.TTL.TICKET_PRICES)
  @ApiOperation({ 
    summary: 'Lấy giá vé hoặc danh sách giá vé',
    description: 'Nếu có typeSeat, typeMovie, date: lấy giá vé cụ thể. Nếu không: lấy danh sách tất cả giá vé'
  })
  @ApiQuery({ name: 'typeSeat', required: false, description: 'Loại ghế (STANDARD, VIP, SWEETBOX)', example: 'STANDARD' })
  @ApiQuery({ name: 'typeMovie', required: false, description: 'Loại phim (2D, 3D)', example: '2D' })
  @ApiQuery({ name: 'movieId', required: false, description: 'ID phim (ưu tiên hơn typeMovie)', example: 1 })
  @ApiQuery({ name: 'date', required: false, description: 'Ngày chiếu (YYYY-MM-DD)', example: '2023-12-15' })
  @ApiQuery({ name: 'time', required: false, description: 'Giờ chiếu (HH:MM)', example: '19:00' })
  @ApiQuery({ name: 'theaterId', required: false, description: 'ID rạp (để ưu tiên giá vé cụ thể cho rạp)', example: 1 })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng mỗi trang', example: 100 })
  @ApiResponse({ 
    status: 200, 
    description: 'Giá vé hoặc danh sách giá vé',
  })
  async getPriceOrList(
    @Query('typeSeat') typeSeat?: string,
    @Query('typeMovie') typeMovie?: string,
    @Query('movieId') movieId?: string,
    @Query('date') date?: string,
    @Query('time') time?: string,
    @Query('theaterId') theaterId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Nếu có đủ tham số để lấy giá cụ thể
    if (typeSeat && (typeMovie || movieId) && date) {
      const movieIdNum = movieId ? parseInt(movieId, 10) : undefined;
      const theaterIdNum = theaterId ? parseInt(theaterId, 10) : undefined;
      
      // Parse date string (YYYY-MM-DD) một cách chính xác để tránh timezone issue
      // Tạo Date object với local timezone để đảm bảo getDay() trả về đúng ngày
      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day); // month - 1 vì Date month bắt đầu từ 0
      
      return this.ticketPricesService.getPrice(
        typeSeat,
        typeMovie || '2D',
        dateObj,
        time,
        movieIdNum,
        theaterIdNum,
      );
    }
    
    // Nếu không, lấy danh sách tất cả
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const result = await this.ticketPricesService.findAll(pageNum, limitNum);
    
    // Map tất cả items qua DTO để đảm bảo trả về đầy đủ dữ liệu
    return {
      ...result,
      items: result.items.map(item => TicketPriceResponseDto.fromEntity(item)),
    };
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Lấy chi tiết một giá vé - Chỉ admin' })
  @ApiParam({ name: 'id', description: 'ID giá vé' })
  @ApiResponse({ status: 200, description: 'Chi tiết giá vé', type: TicketPriceResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy giá vé' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const ticketPrice = await this.ticketPricesService.findOne(id);
    return TicketPriceResponseDto.fromEntity(ticketPrice);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Tạo giá vé mới - Chỉ admin',
    description: 'Thêm một mức giá vé mới vào hệ thống'
  })
  @ApiBody({ 
    description: 'Thông tin giá vé mới',
    type: CreateTicketPriceDto
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Giá vé đã được tạo thành công',
    type: TicketPriceResponseDto
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async create(@Body() dto: CreateTicketPriceDto) {
    // Convert startDate và endDate từ string sang Date nếu có
    const ticketData: any = { ...dto };
    if (ticketData.startDate && typeof ticketData.startDate === 'string') {
      ticketData.startDate = new Date(ticketData.startDate);
    }
    if (ticketData.endDate && typeof ticketData.endDate === 'string') {
      ticketData.endDate = new Date(ticketData.endDate);
    }
    const ticketPrice = await this.ticketPricesService.create(ticketData);
    return TicketPriceResponseDto.fromEntity(ticketPrice);
  }

  @Post('batch')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @InvalidateCache(RedisCacheService.KEYS.TICKET_PRICES)
  @ApiOperation({ 
    summary: 'Tạo nhiều giá vé cùng lúc - Chỉ admin',
    description: 'Thêm nhiều mức giá vé vào hệ thống cùng lúc (setup đồng loạt)'
  })
  @ApiBody({ 
    description: 'Danh sách giá vé cần tạo',
    type: BatchCreateTicketPriceDto
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Danh sách giá vé đã được tạo thành công',
    type: [TicketPriceResponseDto]
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async createBatch(@Body() dto: BatchCreateTicketPriceDto) {
    // Validate: mỗi item phải có typeMovie hoặc movieId
    for (const item of dto.ticketPrices) {
      if (!item.typeMovie && !item.movieId) {
        throw new BadRequestException('Mỗi giá vé phải có typeMovie hoặc movieId');
      }
    }
    
    // Convert startDate và endDate từ string sang Date nếu có
    const processedData = dto.ticketPrices.map(item => {
      const ticketData: any = { ...item };
      
      // Đảm bảo có typeMovie (nếu có movieId thì lấy từ movie, nếu không thì dùng giá trị đã có)
      if (!ticketData.typeMovie && ticketData.movieId) {
        // Nếu chỉ có movieId mà không có typeMovie, cần fetch từ movie
        // Tạm thời set mặc định là 2D, hoặc có thể fetch từ database
        ticketData.typeMovie = '2D'; // Sẽ được cập nhật sau khi fetch movie
      }
      
      if (ticketData.startDate && typeof ticketData.startDate === 'string') {
        ticketData.startDate = new Date(ticketData.startDate);
      }
      if (ticketData.endDate && typeof ticketData.endDate === 'string') {
        ticketData.endDate = new Date(ticketData.endDate);
      }
      return ticketData;
    });
    const ticketPrices = await this.ticketPricesService.createBatch(processedData);
    return ticketPrices.map(tp => TicketPriceResponseDto.fromEntity(tp));
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ 
    summary: 'Cập nhật giá vé - Chỉ admin',
    description: 'Cập nhật thông tin một mức giá vé'
  })
  @ApiParam({ name: 'id', description: 'ID giá vé' })
  @ApiBody({ 
    description: 'Thông tin cần cập nhật',
    type: UpdateTicketPriceDto
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Giá vé đã được cập nhật thành công',
    type: TicketPriceResponseDto
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy giá vé' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTicketPriceDto) {
    // Convert startDate và endDate từ string sang Date nếu có
    const ticketData: any = { ...dto };
    if (ticketData.startDate && typeof ticketData.startDate === 'string') {
      ticketData.startDate = new Date(ticketData.startDate);
    }
    if (ticketData.endDate && typeof ticketData.endDate === 'string') {
      ticketData.endDate = new Date(ticketData.endDate);
    }
    const ticketPrice = await this.ticketPricesService.update(id, ticketData);
    return TicketPriceResponseDto.fromEntity(ticketPrice);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('jwt')
  @InvalidateCache(RedisCacheService.KEYS.TICKET_PRICES)
  @ApiOperation({ 
    summary: 'Xóa giá vé - Chỉ admin',
    description: 'Xóa một mức giá vé khỏi hệ thống'
  })
  @ApiParam({ name: 'id', description: 'ID giá vé' })
  @ApiResponse({ 
    status: 200, 
    description: 'Giá vé đã được xóa thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Giá vé đã được xóa thành công' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy giá vé' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketPricesService.remove(id);
  }
}
