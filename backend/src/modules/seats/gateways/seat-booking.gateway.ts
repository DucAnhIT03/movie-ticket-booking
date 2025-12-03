import {
  Logger,
} from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  namespace: '/seat-booking',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class SeatBookingGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SeatBookingGateway.name);

  async broadcastSeatUpdate(
    showtimeId: number,
    seatIds?: number[],
    action: 'BOOKED' | 'RELEASED' | 'SYNC' = 'SYNC',
  ) {
    try {
      if (!this.server) {
        this.logger.warn(
          `Socket server not initialized. Cannot broadcast seat update for showtime ${showtimeId}`,
        );
        return;
      }

      this.logger.debug(
        `Broadcasting seat update for showtimeId=${showtimeId}, action=${action}, seatIds=${
          seatIds?.length ?? 0
        }`,
      );
      this.server.emit('seat_update', { showtimeId, seatIds, action });
    } catch (error) {
      this.logger.error(
        `Failed to broadcast seat update for showtimeId=${showtimeId}: ${error?.message}`,
      );
    }
  }
}


