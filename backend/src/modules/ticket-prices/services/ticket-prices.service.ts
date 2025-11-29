import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TicketPrice } from '../../../shared/schemas/ticket-price.entity';
import { SeatTypeEnum } from 'src/common/constrants/enums';
import { TicketPriceRepository } from '../repositories/ticket-price.repository';

@Injectable()
export class TicketPricesService {
  constructor(
    private readonly ticketPriceRepository: TicketPriceRepository,
  ) {}

  // Lấy tất cả giá vé (có phân trang)
  async findAll(page: number = 1, limit: number = 100) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.ticketPriceRepository.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });
    
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Lấy một giá vé theo ID
  async findOne(id: number): Promise<TicketPrice> {
    const ticketPrice = await this.ticketPriceRepository.findOne({ where: { id } });
    if (!ticketPrice) {
      throw new NotFoundException(`Không tìm thấy giá vé với ID: ${id}`);
    }
    return ticketPrice;
  }


  async getPrice(type_seat: string, type_movie: string, date: Date, time?: string, movieId?: number, theaterId?: number): Promise<number | null> {
    
    // Đảm bảo date được xử lý đúng với local timezone
    // Tạo date mới từ year, month, day để tránh timezone issues
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dateLocal = new Date(year, month, day, 12, 0, 0, 0); // Set 12:00 để tránh timezone shift
    const dayOfWeek = dateLocal.getDay();
   
    
    const dayType = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    console.log('📅 [BACKEND] Calculating dayType:', {
      typeSeat: type_seat,
      inputDate: date,
      inputDateISO: date.toISOString(),
      year,
      month,
      day,
      localDate: dateLocal,
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      dayType,
      dayTypeName: dayType ? 'Cuối tuần (T6, T7, CN)' : 'Ngày thường (T2-T5)',
      dayTypeValue: dayType ? 1 : 0
    });
    
    
    const dayTypeValue = dayType ? 1 : 0;
    // Ưu tiên tìm giá vé có dayType khớp với ngày hiện tại (không chấp nhận NULL)
    // Chỉ dùng dayType = NULL làm fallback nếu không tìm thấy giá vé cụ thể
    const queryBuilder = this.ticketPriceRepository.createQueryBuilder('tp')
      .where('tp.typeSeat = :typeSeat', { typeSeat: type_seat })
      // Chỉ lấy giá vé có dayType khớp với ngày hiện tại (không chấp nhận NULL)
      // Sử dụng CAST để đảm bảo so sánh đúng với BIT type trong MySQL
      .andWhere(
        'CAST(tp.dayType AS UNSIGNED) = :dayTypeValue',
        {
          dayTypeValue: dayTypeValue,
        },
      );
    

    if (movieId) {
      // Ưu tiên giá dành riêng cho phim, nếu không có thì dùng giá chung (movieId = NULL)
      queryBuilder.andWhere('(tp.movieId = :movieId OR tp.movieId IS NULL)', { movieId });
      // Nếu price áp dụng chung (movieId = NULL) thì chấp nhận typeMovie null hoặc khớp
      queryBuilder.andWhere(
        '(tp.movieId IS NOT NULL OR tp.typeMovie IS NULL OR tp.typeMovie = :typeMovie)',
        { typeMovie: type_movie },
      );
    } else {
      // Không chọn phim cụ thể => chỉ lấy price áp dụng chung
      queryBuilder.andWhere('tp.movieId IS NULL');
      queryBuilder.andWhere('(tp.typeMovie IS NULL OR tp.typeMovie = :typeMovie)', {
        typeMovie: type_movie,
      });
    }
    
    
    const yearStr = String(dateLocal.getFullYear());
    const monthStr = String(dateLocal.getMonth() + 1).padStart(2, '0');
    const dayStr = String(dateLocal.getDate()).padStart(2, '0');
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`; // YYYY-MM-DD (local timezone)
    
   
    queryBuilder.andWhere(
      '(tp.startDate IS NULL OR DATE(tp.startDate) <= :dateStr) AND (tp.endDate IS NULL OR DATE(tp.endDate) >= :dateStr)',
      { dateStr }
    );
    
 
    if (time && time !== '00:00' && time !== '00:00:00') {
      // Đảm bảo time có format HH:MM:SS
      const timeStr = time.length === 5 ? `${time}:00` : time;
      queryBuilder.andWhere(
        '(tp.startTime IS NULL OR tp.startTime <= :time) AND (tp.endTime IS NULL OR tp.endTime >= :time)',
        { time: timeStr }
      );
    }
    
    if (theaterId) {
      // Tìm giá vé có theaterId cụ thể trước
      queryBuilder.andWhere('(tp.theaterId = :theaterId OR tp.theaterId IS NULL)', { theaterId });
    } else {
      // Nếu không có theaterId, chỉ lấy giá vé áp dụng cho tất cả (theaterId = null)
      queryBuilder.andWhere('tp.theaterId IS NULL');
    }
    
    // Sắp xếp: ưu tiên giá vé mới nhất (theo created_at DESC) để luôn lấy giá mới nhất
    queryBuilder.orderBy('tp.created_at', 'DESC')
      .addOrderBy('tp.updated_at', 'DESC');
    
    // Debug: log query SQL để kiểm tra
    const sql = queryBuilder.getSql();
    const params = queryBuilder.getParameters();
    console.log('🔍 Ticket Price Query:', {
      sql,
      params,
      typeSeat: type_seat,
      dayType,
      dayTypeValue: dayType ? 1 : 0,
      movieId,
      typeMovie: type_movie,
      date: dateStr,
      time,
      theaterId
    });
    
    // Lấy tất cả kết quả và chọn giá vé theo thứ tự ưu tiên
    const tickets = await queryBuilder.getMany();
    
    console.log('📋 Found tickets:', tickets.length, `for ${type_seat}`);
    if (tickets.length > 0) {
      console.log('📋 Ticket details:', tickets.map(t => ({
        id: t.id,
        typeSeat: t.typeSeat,
        price: t.price,
        theaterId: t.theaterId,
        movieId: t.movieId,
        typeMovie: t.typeMovie,
        dayType: t.dayType,
        dayTypeType: typeof t.dayType,
        dayTypeValue: t.dayType ? 1 : 0,
        startDate: t.startDate,
        endDate: t.endDate,
        startTime: t.startTime,
        endTime: t.endTime,
        created_at: t.created_at,
        updated_at: t.updated_at
      })));
    } else {
      console.log('❌ No tickets found matching criteria for:', {
        typeSeat: type_seat,
        dayType,
        dayTypeValue: dayType ? 1 : 0,
        date: dateStr
      });
    }
    
    if (tickets.length === 0) {
      console.log('❌ No tickets found for:', { 
        typeSeat: type_seat, 
        dayType, 
        dayTypeValue: dayType ? 1 : 0,
        movieId, 
        typeMovie: type_movie, 
        date: dateStr, 
        time, 
        theaterId 
      });
      
      // Fallback: Nếu không tìm thấy ticket với dayType cụ thể, thử tìm với dayType = NULL (áp dụng mọi ngày)
      // CHỈ dùng fallback này nếu thực sự không có giá vé cụ thể cho ngày này
      console.log('🔄 Trying fallback: searching for tickets with dayType = NULL (applies to all days)...');
      const fallbackQueryBuilder = this.ticketPriceRepository.createQueryBuilder('tp')
        .where('tp.typeSeat = :typeSeat', { typeSeat: type_seat })
        .andWhere('tp.dayType IS NULL'); // CHỈ lấy giá vé có dayType = NULL
      
      if (movieId) {
        fallbackQueryBuilder.andWhere('(tp.movieId = :movieId OR tp.movieId IS NULL)', {
          movieId,
        });
        fallbackQueryBuilder.andWhere(
          '(tp.movieId IS NOT NULL OR tp.typeMovie IS NULL OR tp.typeMovie = :typeMovie)',
          { typeMovie: type_movie },
        );
      } else {
        fallbackQueryBuilder.andWhere('tp.movieId IS NULL');
        fallbackQueryBuilder.andWhere('(tp.typeMovie IS NULL OR tp.typeMovie = :typeMovie)', {
          typeMovie: type_movie,
        });
      }
      
      // Kiểm tra ngày áp dụng
      fallbackQueryBuilder.andWhere(
        '(tp.startDate IS NULL OR DATE(tp.startDate) <= :dateStr) AND (tp.endDate IS NULL OR DATE(tp.endDate) >= :dateStr)',
        { dateStr }
      );
      
      // Kiểm tra giờ nếu có
      if (time) {
        const timeStr = time.length === 5 ? `${time}:00` : time;
        fallbackQueryBuilder.andWhere(
          '(tp.startTime IS NULL OR tp.startTime <= :time) AND (tp.endTime IS NULL OR tp.endTime >= :time)',
          { time: timeStr }
        );
      }
      
      // Kiểm tra theaterId
      if (theaterId) {
        fallbackQueryBuilder.andWhere('(tp.theaterId = :theaterId OR tp.theaterId IS NULL)', { theaterId });
      } else {
        fallbackQueryBuilder.andWhere('tp.theaterId IS NULL');
      }
      
      fallbackQueryBuilder.orderBy('tp.created_at', 'DESC')
        .addOrderBy('tp.updated_at', 'DESC');
      
      const fallbackTickets = await fallbackQueryBuilder.getMany();
      
      if (fallbackTickets.length > 0) {
        console.log('✅ Fallback found tickets with dayType = NULL:', fallbackTickets.length);
        console.log('⚠️ WARNING: Using fallback ticket (dayType = NULL) because no specific ticket found for', dayType ? 'weekend' : 'weekday');
        // Sử dụng ticket đầu tiên từ fallback query
        const ticket = fallbackTickets[0];
        console.log('💰 Using fallback ticket price:', ticket.price, 'for', type_seat);
        return ticket.price;
      }
      
      // Thử query lại với cách khác để debug - lấy tất cả tickets của typeSeat này
      const allTicketsForSeat = await this.ticketPriceRepository
        .createQueryBuilder('tp')
        .where('tp.typeSeat = :typeSeat', { typeSeat: type_seat })
        .getMany();
      console.log('🔍 Debug: All tickets for', type_seat, ':', allTicketsForSeat.length);
      if (allTicketsForSeat.length > 0) {
        console.log('🔍 Debug: Sample tickets:', allTicketsForSeat.slice(0, 3).map(t => ({
          id: t.id,
          typeSeat: t.typeSeat,
          dayType: t.dayType,
          dayTypeValue: t.dayType ? 1 : 0,
          price: t.price,
          startDate: t.startDate,
          endDate: t.endDate,
          created_at: t.created_at
        })));
      }
      
      // Log thêm thông tin để debug
      console.log('🔍 Debug: Query params:', {
        typeSeat: type_seat,
        dayType: dayType,
        dayTypeValue: dayTypeValue,
        dateStr: dateStr,
        movieId,
        typeMovie: type_movie,
        theaterId
      });
      
      return null;
    }
    
    // Logic ưu tiên:
    // 1. Nếu có theaterId: ưu tiên giá vé có theaterId cụ thể (theaterId khớp) - lấy mới nhất
    // 2. Nếu không có: lấy giá vé có theaterId = null (áp dụng cho tất cả) - lấy mới nhất
    if (theaterId) {
      // Tìm giá vé có theaterId cụ thể trước (theaterId khớp) - đã được sắp xếp theo created_at DESC
      const specificTickets = tickets.filter(t => t.theaterId !== null && t.theaterId !== undefined && t.theaterId === theaterId);
      if (specificTickets.length > 0) {
        // Lấy giá vé mới nhất (đầu tiên trong danh sách đã sắp xếp)
        console.log(`✅ Found specific ticket for theater ${theaterId}:`, specificTickets[0].price);
        return Number(specificTickets[0].price);
      }
      // Nếu không có giá vé cụ thể, lấy giá vé áp dụng cho tất cả (theaterId = null)
      const generalTickets = tickets.filter(t => t.theaterId === null || t.theaterId === undefined);
      if (generalTickets.length > 0) {
        // Lấy giá vé mới nhất
        console.log(`✅ Found general ticket (theaterId=null):`, generalTickets[0].price);
        return Number(generalTickets[0].price);
      }
    }
    
    // Nếu không có theaterId hoặc không tìm thấy, lấy giá vé đầu tiên (mới nhất)
    // Đảm bảo lấy giá vé có theaterId = null (áp dụng cho tất cả) nếu có
    const generalTickets = tickets.filter(t => t.theaterId === null || t.theaterId === undefined);
    const selectedTicket = generalTickets.length > 0 ? generalTickets[0] : tickets[0];
    console.log(`✅ Selected ticket:`, selectedTicket.price, `(theaterId: ${selectedTicket.theaterId})`);
    return Number(selectedTicket.price);
  }

  async create(data: Partial<TicketPrice>): Promise<TicketPrice> {
    // Convert startDate và endDate từ string sang Date nếu có
    const ticketData = { ...data };
    if (ticketData.startDate && typeof ticketData.startDate === 'string') {
      ticketData.startDate = new Date(ticketData.startDate);
    }
    if (ticketData.endDate && typeof ticketData.endDate === 'string') {
      ticketData.endDate = new Date(ticketData.endDate);
    }
    const newTicket = this.ticketPriceRepository.create(ticketData);
    return this.ticketPriceRepository.save(newTicket);
  }

  // Tạo nhiều giá vé cùng lúc
  async createBatch(dataArray: Partial<TicketPrice>[]): Promise<TicketPrice[]> {
    // Convert startDate và endDate từ string sang Date nếu có
    const processedData = dataArray.map(data => {
      const ticketData = { ...data };
      if (ticketData.startDate && typeof ticketData.startDate === 'string') {
        ticketData.startDate = new Date(ticketData.startDate);
      }
      if (ticketData.endDate && typeof ticketData.endDate === 'string') {
        ticketData.endDate = new Date(ticketData.endDate);
      }
      return ticketData;
    });
    const tickets = processedData.map(data => this.ticketPriceRepository.create(data));
    return this.ticketPriceRepository.save(tickets);
  }

  // Cập nhật giá vé
  async update(id: number, data: Partial<TicketPrice>): Promise<TicketPrice> {
    const ticketPrice = await this.findOne(id);
    Object.assign(ticketPrice, data);
    ticketPrice.updated_at = new Date();
    return this.ticketPriceRepository.save(ticketPrice);
  }

  // Xóa giá vé
  async remove(id: number): Promise<{ message: string }> {
    const ticketPrice = await this.findOne(id);
    await this.ticketPriceRepository.remove(ticketPrice);
    return { message: 'Giá vé đã được xóa thành công' };
  }
}
