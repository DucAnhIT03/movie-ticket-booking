import axiosClient from "../axiosClient";

const movieService = {
  // Lấy danh sách phim đang chiếu
  getNowShowing() {
    return axiosClient.get("/movies/now-showing", {
      validateStatus: () => true,
    });
  },

  // Lấy danh sách phim sắp chiếu
  getComingSoon() {
    return axiosClient.get("/movies/coming-soon", {
      validateStatus: () => true,
    });
  },

  // Lấy chi tiết một phim
  getMovieById(id) {
    return axiosClient.get(`/movies/${id}`, {
      validateStatus: () => true,
    });
  },

  // Lấy danh sách phim (có phân trang và tìm kiếm)
  getAllMovies(params = {}) {
    return axiosClient.get("/movies", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100,
        search: params.search || undefined,
        genreId: params.genreId || undefined,
      },
      validateStatus: () => true,
    });
  },
};

export default movieService;

