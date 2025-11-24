import axiosClient from "../axiosClient";

const seatService = {
  // Lấy danh sách ghế theo showtimeId với trạng thái đặt
  getByShowtime(showtimeId) {
    return axiosClient.get(`/seats/showtime/${showtimeId}`, {
      validateStatus: () => true,
    });
  },

  // Lấy danh sách ghế theo screenId
  getByScreen(screenId, showtimeId = null) {
    const params = {};
    if (showtimeId) {
      params.showtimeId = showtimeId;
    }
    return axiosClient.get(`/seats/screen/${screenId}`, {
      params,
      validateStatus: () => true,
    });
  },

  // Lấy tất cả ghế
  getAll(params = {}) {
    return axiosClient.get("/seats", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100,
        ...params,
      },
      validateStatus: () => true,
    });
  },

  // Lấy thông tin chi tiết một ghế
  getById(id) {
    return axiosClient.get(`/seats/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default seatService;
