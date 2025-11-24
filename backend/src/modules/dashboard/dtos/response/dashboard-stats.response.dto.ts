import { ApiProperty } from '@nestjs/swagger';

class DashboardTotalsDto {
  @ApiProperty({ example: 120 })
  users!: number;

  @ApiProperty({ example: 110 })
  activeUsers!: number;

  @ApiProperty({ example: 15 })
  theaters!: number;

  @ApiProperty({ example: 40 })
  screens!: number;

  @ApiProperty({ example: 25 })
  movies!: number;

  @ApiProperty({ example: 60 })
  showtimesUpcoming!: number;
}

class DashboardBookingsDto {
  @ApiProperty({ example: 540 })
  total!: number;

  @ApiProperty({ example: 12 })
  today!: number;

  @ApiProperty({ example: 75 })
  thisWeek!: number;

  @ApiProperty({ example: 320 })
  thisMonth!: number;
}

class DashboardRevenueDto {
  @ApiProperty({ example: 125000000 })
  total!: number;

  @ApiProperty({ example: 1500000 })
  today!: number;

  @ApiProperty({ example: 9500000 })
  thisWeek!: number;

  @ApiProperty({ example: 28500000 })
  thisMonth!: number;
}

class DashboardTicketsDto {
  @ApiProperty({ example: 120 })
  soldToday!: number;

  @ApiProperty({ example: 1680 })
  soldThisMonth!: number;
}

class DashboardEmailStatsDto {
  @ApiProperty({ example: 1200 })
  total!: number;

  @ApiProperty({ example: 1100 })
  sent!: number;

  @ApiProperty({ example: 25 })
  failed!: number;

  @ApiProperty({ example: 75 })
  pending!: number;
}

class DashboardQueueStatsDto {
  @ApiProperty({ example: 3 })
  waiting!: number;

  @ApiProperty({ example: 1 })
  active!: number;

  @ApiProperty({ example: 250 })
  completed!: number;

  @ApiProperty({ example: 2 })
  failed!: number;

  @ApiProperty({ example: 4 })
  total!: number;

  @ApiProperty({ example: 'Redis is offline', nullable: true, required: false })
  error?: string;
}

export class DashboardStatsResponseDto {
  @ApiProperty({ type: DashboardTotalsDto })
  totals!: DashboardTotalsDto;

  @ApiProperty({ type: DashboardBookingsDto })
  bookings!: DashboardBookingsDto;

  @ApiProperty({ type: DashboardRevenueDto })
  revenue!: DashboardRevenueDto;

  @ApiProperty({ type: DashboardTicketsDto })
  tickets!: DashboardTicketsDto;

  @ApiProperty({ type: DashboardEmailStatsDto })
  emails!: DashboardEmailStatsDto;

  @ApiProperty({ type: DashboardQueueStatsDto })
  queue!: DashboardQueueStatsDto;

  @ApiProperty({
    description: 'Dữ liệu biểu đồ',
    example: {
      revenueDaily: [{ date: '2025-11-01', amount: 1500000 }],
      revenueMonthly: [{ month: '2025-11', amount: 45000000 }],
      ticketsDaily: [{ date: '2025-11-01', count: 120 }],
    },
  })
  charts!: {
    revenueDaily: Array<{ date: string; amount: number }>;
    revenueMonthly: Array<{ month: string; amount: number }>;
    ticketsDaily: Array<{ date: string; count: number }>;
  };

  @ApiProperty({
    description: 'Top doanh thu',
    example: {
      topMoviesByRevenue: [{ movieId: 1, title: 'Movie A', revenue: 123000000 }],
      topTheatersByRevenue: [{ theaterId: 2, name: 'CGV Vincom', revenue: 89000000 }],
    },
  })
  top!: {
    topMoviesByRevenue: Array<{ movieId: number; title: string; revenue: number }>;
    topTheatersByRevenue: Array<{ theaterId: number; name: string; revenue: number }>;
  };

  @ApiProperty({
    description: 'Doanh thu theo phương thức thanh toán',
    example: [{ method: 'VNPAY', amount: 123000000 }],
  })
  revenueByPaymentMethod!: Array<{ method: string; amount: number }>;
}



