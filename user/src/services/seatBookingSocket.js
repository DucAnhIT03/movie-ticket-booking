import { io } from "socket.io-client";

class SeatBookingSocket {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    // TODO: lấy base URL từ cấu hình chung nếu có
    const baseURL = "http://localhost:3000";
    this.socket = io(`${baseURL}/seat-booking`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("✅ Seat socket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Seat socket disconnected");
    });

    this.socket.on("connect_error", (err) => {
      console.error("❌ Seat socket error:", err?.message || err);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onSeatUpdate(callback) {
    this.socket?.on("seat_update", callback);
  }

  offSeatUpdate(callback) {
    this.socket?.off("seat_update", callback);
  }
}

const seatBookingSocket = new SeatBookingSocket();
export default seatBookingSocket;

