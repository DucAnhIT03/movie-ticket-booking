import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Brackets } from 'typeorm';
import { Showtime } from 'src/shared/schemas/showtime.entity';
import { Movie } from 'src/shared/schemas/movie.entity';
import { Screen } from 'src/shared/schemas/screen.entity';
import { CreateShowtimeDto } from 'src/modules/showtimes/dtos/request/create-showtime.dto';
import { PaymentStatus } from 'src/common/constrants/enums';
import { ShowtimeRepository } from '../repositories/showtime.repository';

@Injectable()
export class ShowtimesService {
  constructor(
    private readonly showtimeRepo: ShowtimeRepository,
    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,
    @InjectRepository(Screen)
    private readonly screenRepo: Repository<Screen>,
  ) {}

  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'startTime' | 'endTime' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    movieId?: number;
    screenId?: number;
  }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params?.limit) || 10)); // Max 100 items per page
    const skip = (page - 1) * limit;

    const query = this.showtimeRepo.createQueryBuilder('showtime');

 
    query
      .leftJoinAndSelect('showtime.screen', 'screen')
      .leftJoinAndSelect('showtime.movie', 'movie');

    
    if (params?.search) {
      const searchId = Number(params.search);
      const isValidId = !isNaN(searchId) && searchId > 0;
      
      query.andWhere(
        new Brackets((qb) => {
          if (isValidId) {
            qb.where('showtime.id = :searchId', { searchId })
              .orWhere('movie.title LIKE :search', { search: `%${params.search}%` })
              .orWhere('screen.name LIKE :search', { search: `%${params.search}%` });
          } else {
            qb.where('movie.title LIKE :search', { search: `%${params.search}%` })
              .orWhere('screen.name LIKE :search', { search: `%${params.search}%` });
          }
        }),
      );
    }


    if (params?.movieId) {
      query.andWhere('showtime.movieId = :movieId', { movieId: params.movieId });
    }

  
    if (params?.screenId) {
      query.andWhere('showtime.screenId = :screenId', { screenId: params.screenId });
    }


    const sortBy = params?.sortBy || 'startTime';
    const sortOrder = params?.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    query.orderBy(`showtime.${sortBy}`, sortOrder);

 
    query.skip(skip).take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const showtime = await this.showtimeRepo.findOne({
      where: { id },
      relations: ['screen', 'screen.theater', 'movie', 'bookings', 'bookings.payments'],
    });
    if (!showtime) {
      throw new NotFoundException('Không tìm thấy suất chiếu');
    }
    return showtime;
  }

  findByMovie(movieId: number) {
    return this.showtimeRepo.find({
      where: { movieId },
      relations: ['screen'],
      order: { startTime: 'ASC' },
    });
  }

  async findByDate(date: string, timezoneOffset?: number) {
  
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD');
    }

    const offsetMinutes =
      typeof timezoneOffset === 'number' && !isNaN(timezoneOffset) ? timezoneOffset : 0;

    const offsetSign = offsetMinutes <= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const offsetMins = String(absOffset % 60).padStart(2, '0');
    const offsetStr = `${offsetSign}${offsetHours}:${offsetMins}`;

    const start = new Date(`${date}T00:00:00.000${offsetStr}`);
    const end = new Date(`${date}T23:59:59.999${offsetStr}`);

    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ');
    }

    return this.showtimeRepo.find({
      where: { startTime: Between(start, end) },
      relations: ['screen', 'screen.theater', 'movie'],
      order: { startTime: 'ASC' },
    });
  }


  private async checkTimeConflict(
    screenId: number,
    startTime: Date,
    endTime: Date,
    excludeId?: number,
  ): Promise<{ hasConflict: boolean; conflictingShowtimes?: any[] }> {
    const bufferMinutes = 10;
    const bufferMs = bufferMinutes * 60 * 1000;
    
    // Lấy ngày của suất chiếu mới dưới dạng chuỗi YYYY-MM-DD
    const newShowtimeDateStr = startTime.toISOString().split('T')[0];
    
    // Tính khoảng thời gian để kiểm tra: từ 00:00:00 ngày hiện tại đến 23:59:59 ngày hiện tại
    const dayStart = new Date(newShowtimeDateStr + 'T00:00:00.000Z');
    const dayEnd = new Date(newShowtimeDateStr + 'T23:59:59.999Z');
    
    // Tính ngày hôm trước để kiểm tra các suất chiếu kéo dài từ hôm trước
    const prevDay = new Date(dayStart);
    prevDay.setDate(prevDay.getDate() - 1);
    const prevDayStr = prevDay.toISOString().split('T')[0];
    const prevDayStart = new Date(prevDayStr + 'T00:00:00.000Z');
    const prevDayEnd = new Date(prevDayStr + 'T23:59:59.999Z');
    
    // Tạo buffer: thêm 10 phút trước startTime và sau endTime
    // Cho phép buffer vượt qua ranh giới ngày để kiểm tra đúng
    const paddedStart = new Date(startTime.getTime() - bufferMs);
    const paddedEnd = new Date(endTime.getTime() + bufferMs);
    
    // Logic kiểm tra xung đột: 
    // Hai suất chiếu xung đột nếu:
    // 1. Cùng phòng chiếu (screenId)
    // 2. Có thời gian giao nhau (có buffer 10 phút)
    // 3. Kiểm tra cả:
    //    - Các suất chiếu bắt đầu trong ngày hiện tại
    //    - Các suất chiếu từ ngày hôm trước kéo dài sang ngày hiện tại (endTime trong ngày hiện tại)
    const query = this.showtimeRepo
      .createQueryBuilder('showtime')
      .where('showtime.screenId = :screenId', { screenId })
      .andWhere(
        new Brackets((qb) => {
          // Kiểm tra các suất chiếu bắt đầu trong ngày hiện tại
          qb.where(
            '(showtime.startTime >= :dayStart AND showtime.startTime <= :dayEnd)',
            { dayStart, dayEnd }
          )
          // HOẶC các suất chiếu từ ngày hôm trước kéo dài sang ngày hiện tại
          // Chỉ kiểm tra các suất chiếu có endTime sau 00:00 của ngày hiện tại
          .orWhere(
            '(showtime.startTime >= :prevDayStart AND showtime.startTime <= :prevDayEnd AND showtime.endTime >= :dayStart)',
            { prevDayStart, prevDayEnd, dayStart }
          );
        }),
      )
      .andWhere(
        new Brackets((qb) => {
          // Kiểm tra xem có suất chiếu nào giao nhau với khoảng thời gian (paddedStart, paddedEnd) không
          // Điều kiện: startTime của suất chiếu cũ < paddedEnd VÀ endTime của suất chiếu cũ > paddedStart
          // Điều này đảm bảo có ít nhất 10 phút nghỉ giữa các suất chiếu
          qb.where(
            '(showtime.startTime < :paddedEnd AND showtime.endTime > :paddedStart)',
            { paddedStart, paddedEnd },
          );
        }),
      );

    if (excludeId) {
      query.andWhere('showtime.id != :excludeId', { excludeId });
    }

    // Lấy tất cả các suất chiếu có thể xung đột để log chi tiết
    const potentialConflicts = await query.getMany();
    
    // Nếu có xung đột, log thông tin để debug
    if (potentialConflicts.length > 0) {
      console.log('⚠️ Phát hiện xung đột suất chiếu:', {
        screenId,
        newShowtime: {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          date: newShowtimeDateStr,
          paddedStart: paddedStart.toISOString(),
          paddedEnd: paddedEnd.toISOString(),
        },
        dayRange: {
          dayStart: dayStart.toISOString(),
          dayEnd: dayEnd.toISOString(),
          prevDayStart: prevDayStart.toISOString(),
          prevDayEnd: prevDayEnd.toISOString(),
        },
        conflictingShowtimes: potentialConflicts.map(conflicting => {
          const conflictingDateStr = conflicting.startTime.toISOString().split('T')[0];
          const conflictingEndDateStr = conflicting.endTime.toISOString().split('T')[0];
          const timeDiffMinutes = Math.abs(startTime.getTime() - conflicting.startTime.getTime()) / (1000 * 60);
          const isFromPrevDay = conflictingDateStr !== newShowtimeDateStr;
          
          // Kiểm tra xem có thực sự xung đột không
          // Xung đột khi: suất chiếu cũ kết thúc SAU khi suất chiếu mới bắt đầu (có buffer)
          // VÀ suất chiếu cũ bắt đầu TRƯỚC khi suất chiếu mới kết thúc (có buffer)
          const actuallyConflicts = 
            conflicting.startTime < paddedEnd && 
            conflicting.endTime > paddedStart;
          
          // Tính khoảng cách thời gian giữa 2 suất chiếu
          let gapMinutes = 0;
          if (conflicting.endTime <= startTime) {
            // Suất chiếu cũ kết thúc trước suất chiếu mới
            gapMinutes = (startTime.getTime() - conflicting.endTime.getTime()) / (1000 * 60);
          } else if (conflicting.startTime >= endTime) {
            // Suất chiếu cũ bắt đầu sau suất chiếu mới
            gapMinutes = (conflicting.startTime.getTime() - endTime.getTime()) / (1000 * 60);
          } else {
            // Hai suất chiếu giao nhau
            gapMinutes = 0;
          }
          
          return {
            id: conflicting.id,
            startTime: conflicting.startTime.toISOString(),
            endTime: conflicting.endTime.toISOString(),
            startDate: conflictingDateStr,
            endDate: conflictingEndDateStr,
            isFromPrevDay,
            timeDiffMinutes: Math.round(timeDiffMinutes) + ' phút',
            gapMinutes: Math.round(gapMinutes) + ' phút',
            actuallyConflicts,
            hasEnoughGap: gapMinutes >= bufferMinutes,
          };
        }),
        bufferMinutes,
      });
      
      // Chỉ trả về true nếu thực sự có xung đột
      // Xung đột khi: suất chiếu cũ giao nhau với khoảng thời gian (paddedStart, paddedEnd)
      // Điều này đảm bảo có ít nhất buffer (10 phút) nghỉ giữa các suất chiếu
      const realConflicts = potentialConflicts.filter(conflicting => {
        // Kiểm tra xem có giao nhau không
        // Giao nhau khi: startTime của suất chiếu cũ < paddedEnd VÀ endTime của suất chiếu cũ > paddedStart
        const overlaps = conflicting.startTime < paddedEnd && conflicting.endTime > paddedStart;
        
        if (overlaps) {
          return true;
        }
        
        // Nếu không giao nhau, kiểm tra khoảng cách
        // Tính khoảng cách giữa 2 suất chiếu
        let gapMinutes = 0;
        if (conflicting.endTime <= startTime) {
          // Suất chiếu cũ kết thúc trước suất chiếu mới
          gapMinutes = (startTime.getTime() - conflicting.endTime.getTime()) / (1000 * 60);
        } else if (conflicting.startTime >= endTime) {
          // Suất chiếu cũ bắt đầu sau suất chiếu mới
          gapMinutes = (conflicting.startTime.getTime() - endTime.getTime()) / (1000 * 60);
        }
        
        // Chỉ xung đột nếu khoảng cách < buffer (cần ít nhất 10 phút nghỉ)
        return gapMinutes < bufferMinutes && gapMinutes >= 0;
      });
      
      return { hasConflict: realConflicts.length > 0, conflictingShowtimes: realConflicts };
    }
    
    return { hasConflict: false };
  }

  async create(dto: CreateShowtimeDto) {
  
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestException('Định dạng ngày giờ không hợp lệ');
    }

   
    if (endTime <= startTime) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
    }

 
    // Kiểm tra thời gian bắt đầu phải trong tương lai (ít nhất 1 giờ từ bây giờ)
    const now = new Date();
    const minStartTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 giờ từ bây giờ
    
    if (startTime < minStartTime) {
      const timeDiff = Math.round((minStartTime.getTime() - startTime.getTime()) / (1000 * 60)); // phút
      throw new BadRequestException(
        `Không thể tạo suất chiếu trong quá khứ hoặc quá gần. Thời gian bắt đầu phải ít nhất 1 giờ từ bây giờ. ` +
        `(Thời gian hiện tại: ${now.toISOString()}, Thời gian yêu cầu: ${startTime.toISOString()})`
      );
    }


    const movie = await this.movieRepo.findOne({ where: { id: dto.movieId } });
    if (!movie) {
      throw new NotFoundException(`Không tìm thấy phim với ID: ${dto.movieId}`);
    }

    // Kiểm tra showtime có nằm trong khoảng thời gian công chiếu của phim không
    if (movie.startDate || movie.endDate) {
      // Helper function để lấy ngày local (YYYY-MM-DD) từ Date object
      // Sử dụng local timezone thay vì UTC để tránh vấn đề timezone
      const getLocalDateString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // Lấy ngày của suất chiếu theo local timezone
      const showtimeDateStr = getLocalDateString(startTime);
      
      if (movie.startDate) {
        const startDate = new Date(movie.startDate);
        const startDateStr = getLocalDateString(startDate);
        
        // So sánh chuỗi ngày: suất chiếu phải >= ngày bắt đầu công chiếu
        if (showtimeDateStr < startDateStr) {
          throw new BadRequestException(
            `Suất chiếu phải nằm trong khoảng thời gian công chiếu của phim. ` +
            `Ngày suất chiếu: ${showtimeDateStr}, ` +
            `Ngày bắt đầu công chiếu: ${startDateStr}`
          );
        }
      }
      
      if (movie.endDate) {
        const endDate = new Date(movie.endDate);
        const endDateStr = getLocalDateString(endDate);
        
        // So sánh chuỗi ngày: suất chiếu phải <= ngày kết thúc công chiếu
        if (showtimeDateStr > endDateStr) {
          throw new BadRequestException(
            `Suất chiếu phải nằm trong khoảng thời gian công chiếu của phim. ` +
            `Ngày suất chiếu: ${showtimeDateStr}, ` +
            `Ngày kết thúc công chiếu: ${endDateStr}`
          );
        }
      }
    }

    // Kiểm tra thời lượng showtime có khớp với duration của phim không (cho phép sai số 5 phút)
    const actualDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // phút
    const expectedDuration = movie.duration || 120;
    const durationDiff = Math.abs(actualDuration - expectedDuration);
    
    if (durationDiff > 5) {
      throw new BadRequestException(
        `Thời lượng suất chiếu (${Math.round(actualDuration)} phút) không khớp với thời lượng phim ` +
        `(${expectedDuration} phút). Chênh lệch: ${Math.round(durationDiff)} phút.`
      );
    }

    const screen = await this.screenRepo.findOne({ where: { id: dto.screenId } });
    if (!screen) {
      throw new NotFoundException(`Không tìm thấy phòng chiếu với ID: ${dto.screenId}`);
    }

    // Kiểm tra xem có suất chiếu nào trong cùng phòng và cùng ngày không (để debug)
    const existingShowtimes = await this.showtimeRepo.find({
      where: { screenId: dto.screenId },
      order: { startTime: 'ASC' },
    });
    
    const showtimeDateStr = startTime.toISOString().split('T')[0];
    const dayStart = new Date(showtimeDateStr + 'T00:00:00.000Z');
    
    // Lọc các suất chiếu:
    // 1. Bắt đầu trong ngày hiện tại
    // 2. Từ ngày hôm trước nhưng kéo dài sang ngày hiện tại
    const relevantShowtimes = existingShowtimes.filter(st => {
      const stStartDateStr = st.startTime.toISOString().split('T')[0];
      const stEndDateStr = st.endTime.toISOString().split('T')[0];
      
      // Suất chiếu bắt đầu trong ngày hiện tại
      if (stStartDateStr === showtimeDateStr) {
        return true;
      }
      
      // Suất chiếu từ ngày hôm trước kéo dài sang ngày hiện tại
      if (stEndDateStr === showtimeDateStr || st.endTime > dayStart) {
        return true;
      }
      
      return false;
    });
    
    console.log('📅 Kiểm tra suất chiếu TRƯỚC KHI kiểm tra xung đột:', {
      date: showtimeDateStr,
      screenId: dto.screenId,
      totalExisting: existingShowtimes.length,
      relevantCount: relevantShowtimes.length,
      relevantShowtimes: relevantShowtimes.map(st => {
        const stStartDateStr = st.startTime.toISOString().split('T')[0];
        const stEndDateStr = st.endTime.toISOString().split('T')[0];
        return {
          id: st.id,
          startTime: st.startTime.toISOString(),
          endTime: st.endTime.toISOString(),
          startDate: stStartDateStr,
          endDate: stEndDateStr,
          isFromPrevDay: stStartDateStr !== showtimeDateStr,
        };
      }),
      newShowtime: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    });
    
    // Kiểm tra xung đột thời gian với các suất chiếu khác trong cùng phòng
    // Logic bên trong checkTimeConflict sẽ chỉ kiểm tra các suất chiếu trong cùng ngày
    const conflictResult = await this.checkTimeConflict(dto.screenId, startTime, endTime);
    if (conflictResult.hasConflict) {
      console.error('❌ PHÁT HIỆN XUNG ĐỘT - Không thể tạo suất chiếu');
      
      // Tạo thông báo lỗi chi tiết
      let errorMessage = 'Phòng chiếu cần tối thiểu 10 phút nghỉ giữa các suất chiếu. Vui lòng chọn giờ khác.';
      
      if (conflictResult.conflictingShowtimes && conflictResult.conflictingShowtimes.length > 0) {
        const conflictDetails = conflictResult.conflictingShowtimes.map(conflict => {
          const conflictStart = new Date(conflict.startTime);
          const conflictEnd = new Date(conflict.endTime);
          const conflictStartStr = conflictStart.toLocaleString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          const conflictEndStr = conflictEnd.toLocaleString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit'
          });
          return `Suất chiếu ${conflictStartStr} - ${conflictEndStr}`;
        }).join(', ');
        
        errorMessage += ` Đang xung đột với: ${conflictDetails}`;
      }
      
      throw new BadRequestException(errorMessage);
    }
    
    // Nếu không có suất chiếu liên quan, không cần kiểm tra xung đột
    if (relevantShowtimes.length === 0) {
      console.log('✅ Không có suất chiếu nào trong cùng ngày hoặc từ ngày hôm trước - Cho phép tạo suất chiếu');
    } else {
      console.log('✅ Không có xung đột - Cho phép tạo suất chiếu');
    }
    
    const showtime = this.showtimeRepo.create({
      movieId: dto.movieId,
      screenId: dto.screenId,
      startTime: startTime,
      endTime: endTime,
    });
    return this.showtimeRepo.save(showtime);
  }

  async update(id: number, dto: Partial<CreateShowtimeDto>) {
    const showtime = await this.findOne(id);

    let newStartTime = showtime.startTime;
    let newEndTime = showtime.endTime;
    let newScreenId = showtime.screenId;

    if (dto.startTime && dto.endTime) {
      const startTime = new Date(dto.startTime);
      const endTime = new Date(dto.endTime);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new BadRequestException('Định dạng ngày giờ không hợp lệ');
      }

      if (endTime <= startTime) {
        throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
      }

      newStartTime = startTime;
      newEndTime = endTime;
    } else if (dto.startTime) {
      const startTime = new Date(dto.startTime);
      if (isNaN(startTime.getTime())) {
        throw new BadRequestException('Định dạng ngày giờ không hợp lệ');
      }
      if (showtime.endTime <= startTime) {
        throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
      newStartTime = startTime;
    } else if (dto.endTime) {
      const endTime = new Date(dto.endTime);
      if (isNaN(endTime.getTime())) {
        throw new BadRequestException('Định dạng ngày giờ không hợp lệ');
      }
      if (endTime <= showtime.startTime) {
        throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
      newEndTime = endTime;
    }

    // Lấy thông tin phim để validate
    const movieId = dto.movieId !== undefined ? dto.movieId : showtime.movieId;
    const movie = await this.movieRepo.findOne({ where: { id: movieId } });
    if (!movie) {
      throw new NotFoundException(`Không tìm thấy phim với ID: ${movieId}`);
    }

    // Kiểm tra showtime có nằm trong khoảng thời gian công chiếu của phim không
    if (movie.startDate || movie.endDate) {
      // Lấy ngày của suất chiếu dưới dạng chuỗi YYYY-MM-DD để so sánh chính xác
      const showtimeDateStr = newStartTime.toISOString().split('T')[0];
      
      if (movie.startDate) {
        const startDate = new Date(movie.startDate);
        const startDateStr = startDate.toISOString().split('T')[0];
        
        // So sánh chuỗi ngày: suất chiếu phải >= ngày bắt đầu công chiếu
        if (showtimeDateStr < startDateStr) {
          throw new BadRequestException(
            `Suất chiếu phải nằm trong khoảng thời gian công chiếu của phim. ` +
            `Ngày suất chiếu: ${showtimeDateStr}, ` +
            `Ngày bắt đầu công chiếu: ${startDateStr}`
          );
        }
      }
      
      if (movie.endDate) {
        const endDate = new Date(movie.endDate);
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // So sánh chuỗi ngày: suất chiếu phải <= ngày kết thúc công chiếu
        if (showtimeDateStr > endDateStr) {
          throw new BadRequestException(
            `Suất chiếu phải nằm trong khoảng thời gian công chiếu của phim. ` +
            `Ngày suất chiếu: ${showtimeDateStr}, ` +
            `Ngày kết thúc công chiếu: ${endDateStr}`
          );
        }
      }
    }

    // Kiểm tra thời lượng showtime có khớp với duration của phim không
    const actualDuration = (newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60); // phút
    const expectedDuration = movie.duration || 120;
    const durationDiff = Math.abs(actualDuration - expectedDuration);
    
    if (durationDiff > 5) {
      throw new BadRequestException(
        `Thời lượng suất chiếu (${Math.round(actualDuration)} phút) không khớp với thời lượng phim ` +
        `(${expectedDuration} phút). Chênh lệch: ${Math.round(durationDiff)} phút.`
      );
    }
   
    if (dto.movieId !== undefined) {
      showtime.movieId = dto.movieId;
    }

    
    if (dto.screenId !== undefined) {
      const screen = await this.screenRepo.findOne({ where: { id: dto.screenId } });
      if (!screen) {
        throw new NotFoundException(`Không tìm thấy phòng chiếu với ID: ${dto.screenId}`);
      }
      newScreenId = dto.screenId;
      showtime.screenId = dto.screenId;
    }

    // Kiểm tra xung đột thời gian với các suất chiếu khác trong cùng phòng
    if (
      (dto.startTime || dto.endTime || dto.screenId) &&
      (newStartTime.getTime() !== showtime.startTime.getTime() ||
        newEndTime.getTime() !== showtime.endTime.getTime() ||
        newScreenId !== showtime.screenId)
    ) {
      const conflictResult = await this.checkTimeConflict(newScreenId, newStartTime, newEndTime, id);
      if (conflictResult.hasConflict) {
        // Tạo thông báo lỗi chi tiết
        let errorMessage = 'Phòng chiếu cần tối thiểu 10 phút nghỉ giữa các suất chiếu. Vui lòng chọn giờ khác.';
        
        if (conflictResult.conflictingShowtimes && conflictResult.conflictingShowtimes.length > 0) {
          const conflictDetails = conflictResult.conflictingShowtimes.map(conflict => {
            const conflictStart = new Date(conflict.startTime);
            const conflictEnd = new Date(conflict.endTime);
            const conflictStartStr = conflictStart.toLocaleString('vi-VN', { 
              timeZone: 'Asia/Ho_Chi_Minh',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            const conflictEndStr = conflictEnd.toLocaleString('vi-VN', { 
              timeZone: 'Asia/Ho_Chi_Minh',
              hour: '2-digit',
              minute: '2-digit'
            });
            return `Suất chiếu ${conflictStartStr} - ${conflictEndStr}`;
          }).join(', ');
          
          errorMessage += ` Đang xung đột với: ${conflictDetails}`;
        }
        
        throw new BadRequestException(errorMessage);
      }
    }

   
    showtime.startTime = newStartTime;
    showtime.endTime = newEndTime;

    return this.showtimeRepo.save(showtime);
  }

  async remove(id: number) {
    const showtime = await this.findOne(id);

   
    if (showtime.bookings && showtime.bookings.length > 0) {
      const hasCompletedPayment = showtime.bookings.some((booking) =>
        booking.payments?.some((payment) => payment.payment_status === PaymentStatus.COMPLETED),
      );
      
      if (hasCompletedPayment) {
        throw new BadRequestException(
          'Không thể xóa suất chiếu đã có đặt vé đã thanh toán thành công. Vui lòng hủy tất cả các đặt vé trước khi xóa.',
        );
      }
      
     
      throw new BadRequestException(
        'Suất chiếu đã có đặt vé. Vui lòng hủy tất cả các đặt vé trước khi xóa.',
      );
    }

    
    if (new Date(showtime.startTime) <= new Date()) {
      throw new BadRequestException('Không thể xóa suất chiếu đã bắt đầu hoặc đã kết thúc');
    }

    await this.showtimeRepo.remove(showtime);
    return { message: 'Xóa suất chiếu thành công' };
  }
}