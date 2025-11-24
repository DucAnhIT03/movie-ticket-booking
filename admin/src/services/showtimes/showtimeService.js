import axiosClient from "../axiosClient";

const showtimeService = {
  // Lấy danh sách suất chiếu
  getAllShowtimes(params = {}) {
    return axiosClient.get("/showtimes", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100,
        search: params.search || undefined,
        movieId: params.movieId || undefined,
        screenId: params.screenId || undefined,
        sortBy: params.sortBy || undefined,
        sortOrder: params.sortOrder || undefined,
      },
      validateStatus: () => true,
    });
  },

  // Lấy suất chiếu theo phim
  getShowtimesByMovie(movieId) {
    return axiosClient.get(`/showtimes/movie/${movieId}`, {
      validateStatus: () => true,
    });
  },

  // Lấy suất chiếu theo ngày
  getShowtimesByDate(date, timezoneOffset) {
    return axiosClient.get("/showtimes/date", {
      params: { 
        date,
        timezoneOffset: typeof timezoneOffset === "number" ? timezoneOffset : undefined,
      },
      validateStatus: () => true,
    });
  },

  // Lấy chi tiết suất chiếu
  getShowtimeById(id) {
    return axiosClient.get(`/showtimes/${id}`, {
      validateStatus: () => true,
    });
  },

  // Tạo suất chiếu mới
  createShowtime(data) {
    return axiosClient.post("/showtimes", data, {
      validateStatus: () => true,
    });
  },

  // Cập nhật suất chiếu
  updateShowtime(id, data) {
    return axiosClient.put(`/showtimes/${id}`, data, {
      validateStatus: () => true,
    });
  },

  // Xóa suất chiếu
  deleteShowtime(id) {
    return axiosClient.delete(`/showtimes/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default showtimeService;

