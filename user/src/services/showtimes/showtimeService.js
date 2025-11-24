import axiosClient from "../axiosClient";

const showtimeService = {
  // Lấy suất chiếu theo ngày
  getByDate(date, timezoneOffset) {
    // date format: YYYY-MM-DD
    return axiosClient.get("/showtimes/date", {
      params: { 
        date,
        timezoneOffset: typeof timezoneOffset === "number" ? timezoneOffset : undefined,
      },
      validateStatus: () => true,
    });
  },

  // Lấy suất chiếu theo phim
  getByMovie(movieId) {
    return axiosClient.get(`/showtimes/movie/${movieId}`, {
      validateStatus: () => true,
    });
  },

  // Lấy tất cả suất chiếu (có phân trang)
  getAll(params = {}) {
    return axiosClient.get("/showtimes", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100,
        search: params.search || undefined,
        movieId: params.movieId || undefined,
        screenId: params.screenId || undefined,
      },
      validateStatus: () => true,
    });
  },

  // Lấy showtime theo ID
  getById(showtimeId) {
    return axiosClient.get(`/showtimes/${showtimeId}`, {
      validateStatus: () => true,
    });
  },
};

export default showtimeService;

