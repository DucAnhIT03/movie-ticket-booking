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

  // method name getPrice — keeps controller/service consistent
  async getPrice(type_seat: string, type_movie: string, date: Date, time?: string, movieId?: number, theaterId?: number): Promise<number | null> {
    // dayType: false = ngày thường (T2-T5), true = cuối tuần (T6, T7, CN)
    // date.getDay(): 0 = CN, 1 = T2, 2 = T3, 3 = T4, 4 = T5, 5 = T6, 6 = T7
    // Đảm bảo date được set về local timezone để getDay() trả về đúng
    const dateLocal = new Date(date);
    dateLocal.setHours(12, 0, 0, 0); // Set về giữa ngày để tránh timezone issue
    const dayOfWeek = dateLocal.getDay();
    // Ngày thường: T2 (1), T3 (2), T4 (3), T5 (4) -> dayType = false
    // Cuối tuần: T6 (5), T7 (6), CN (0) -> dayType = true
    const dayType = (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6); // T6, T7, CN = cuối tuần (boolean)
    
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    console.log('📅 [BACKEND] Calculating dayType:', {
      typeSeat: type_seat,
      inputDate: date,
      localDate: dateLocal,
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      dayType,
      dayTypeName: dayType ? 'Cuối tuần (T6, T7, CN)' : 'Ngày thường (T2-T5)',
      dayTypeValue: dayType ? 1 : 0
    });
    
    // TypeORM sẽ tự động convert boolean sang bit (0/1) khi query MySQL
    // Kiểm tra ngày áp dụng (nếu có startDate và endDate)
    // Sử dụng nhiều cách để đảm bảo so sánh đúng với BIT type trong MySQL
    const dayTypeValue = dayType ? 1 : 0;
    const queryBuilder = this.ticketPriceRepository.createQueryBuilder('tp')
      .where('tp.typeSeat = :typeSeat', { typeSeat: type_seat })
      // Thử nhiều cách so sánh BIT type
      .andWhere('(tp.dayType = :dayType OR CAST(tp.dayType AS UNSIGNED) = :dayType OR tp.dayType = :dayTypeBool)', { 
        dayType: dayTypeValue,
        dayTypeBool: dayType 
      });
    
    // Logic ưu tiên: 
    // 1. Nếu có movieId: tìm ticket có movieId cụ thể HOẶC movieId = NULL (áp dụng cho tất cả phim cùng type)
    // 2. Nếu không có movieId: chỉ tìm ticket có movieId = NULL và typeMovie khớp
    if (movieId) {
      // Tìm ticket có movieId cụ thể HOẶC movieId = NULL (áp dụng cho tất cả)
      queryBuilder.andWhere('(tp.movieId = :movieId OR tp.movieId IS NULL)', { movieId });
      // Nếu ticket có movieId = NULL, phải khớp typeMovie
      queryBuilder.andWhere('(tp.movieId IS NOT NULL OR tp.typeMovie = :typeMovie)', { typeMovie: type_movie });
    } else {
      // Không có movieId, chỉ tìm ticket có movieId = NULL và typeMovie khớp
      queryBuilder.andWhere('tp.movieId IS NULL');
      queryBuilder.andWhere('tp.typeMovie = :typeMovie', { typeMovie: type_movie });
    }
    
    // Kiểm tra ngày áp dụng: nếu có startDate/endDate thì phải nằm trong khoảng
    // Chỉ so sánh phần date, không so sánh time
    // Format date để so sánh: YYYY-MM-DD (dùng local date để tránh timezone issue)
    const year = dateLocal.getFullYear();
    const month = String(dateLocal.getMonth() + 1).padStart(2, '0');
    const day = String(dateLocal.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD (local timezone)
    
    // Nếu có startDate thì date phải >= startDate
    // Nếu có endDate thì date phải <= endDate
    // Nếu không có startDate/endDate thì áp dụng cho tất cả ngày
    queryBuilder.andWhere(
      '(tp.startDate IS NULL OR DATE(tp.startDate) <= :dateStr) AND (tp.endDate IS NULL OR DATE(tp.endDate) >= :dateStr)',
      { dateStr }
    );
    
    // Kiểm tra giờ nếu có: nếu có startTime/endTime thì phải nằm trong khoảng
    // So sánh time dạng HH:MM:SS
    // Lưu ý: Nếu time là '00:00' hoặc '00:00:00', có thể là giá trị mặc định, nên cần xử lý đặc biệt
    if (time && time !== '00:00' && time !== '00:00:00') {
      // Đảm bảo time có format HH:MM:SS
      const timeStr = time.length === 5 ? `${time}:00` : time;
      queryBuilder.andWhere(
        '(tp.startTime IS NULL OR tp.startTime <= :time) AND (tp.endTime IS NULL OR tp.endTime >= :time)',
        { time: timeStr }
      );
    }
    // Nếu time là '00:00' hoặc không có, bỏ qua filter thời gian (lấy ticket áp dụng cho cả ngày)
    
    // Logic ưu tiên theaterId:
    // 1. Nếu có theaterId, ưu tiên giá vé có theaterId cụ thể trước
    // 2. Nếu không có, mới dùng giá vé có theaterId = null (áp dụng cho tất cả)
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
      
      // Fallback: Nếu không tìm thấy ticket với dayType đúng, thử tìm với dayType khác (hoặc bỏ filter dayType)
      console.log('🔄 Trying fallback: searching without dayType filter...');
      const fallbackQueryBuilder = this.ticketPriceRepository.createQueryBuilder('tp')
        .where('tp.typeSeat = :typeSeat', { typeSeat: type_seat });
      
      if (movieId) {
        fallbackQueryBuilder.andWhere('tp.movieId = :movieId', { movieId });
      } else {
        fallbackQueryBuilder.andWhere('tp.typeMovie = :typeMovie', { typeMovie: type_movie });
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
        console.log('✅ Fallback found tickets:', fallbackTickets.length);
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
