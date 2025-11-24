import axiosClient from "../axiosClient";

const seatService = {
  // Lấy danh sách tất cả ghế
  getAllSeats() {
    return axiosClient.get("/seats", {
      validateStatus: () => true,
    });
  },

  // Lấy ghế theo phòng chiếu
  getSeatsByScreen(screenId, showtimeId) {
    const url = showtimeId 
      ? `/seats/screen/${screenId}?showtimeId=${showtimeId}`
      : `/seats/screen/${screenId}`;
    return axiosClient.get(url, {
      validateStatus: () => true,
    });
  },

  // Lấy ghế theo suất chiếu (kèm trạng thái đặt)
  getSeatsByShowtime(showtimeId) {
    return axiosClient.get(`/seats/showtime/${showtimeId}`, {
      validateStatus: () => true,
    });
  },

  // Lấy chi tiết một ghế
  getSeatById(id) {
    return axiosClient.get(`/seats/${id}`, {
      validateStatus: () => true,
    });
  },

  // Tạo ghế mới
  createSeat(data) {
    return axiosClient.post("/seats", data, {
      validateStatus: () => true,
    });
  },

  // Cập nhật ghế
  updateSeat(id, data) {
    return axiosClient.patch(`/seats/${id}`, data, {
      validateStatus: () => true,
    });
  },

  // Xóa ghế
  deleteSeat(id) {
    return axiosClient.delete(`/seats/${id}`, {
      validateStatus: () => true,
    });
  },

  // Tạo nhiều ghế cùng lúc (batch create)
  // Sử dụng Promise.allSettled để xử lý cả thành công và thất bại
  createSeatsBatch(seats) {
    const promises = seats.map(seat => 
      this.createSeat(seat).catch(error => ({
        error: true,
        message: error.response?.data?.message || error.message,
        status: error.response?.status || 500,
        seat
      }))
    );
    return Promise.allSettled(promises);
  },
};

export default seatService;


