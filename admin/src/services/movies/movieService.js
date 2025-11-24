import axiosClient from "../axiosClient";

const movieService = {
  // Lấy danh sách phim (có phân trang và tìm kiếm)
  getAllMovies(params = {}) {
    return axiosClient.get("/movies", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100, // Lấy tất cả, không phân trang
        search: params.search || undefined,
        genreId: params.genreId || undefined,
      },
      validateStatus: () => true,
    });
  },

  // Lấy chi tiết một phim
  getMovieById(id) {
    return axiosClient.get(`/movies/${id}`, {
      validateStatus: () => true,
    });
  },

  // Tạo phim mới
  createMovie(data) {
    const formData = new FormData();
    
    // Thêm các field text
    Object.keys(data).forEach(key => {
      if (key !== 'file' && key !== 'genreIds') {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      }
    });

    // Thêm file nếu có
    if (data.file) {
      formData.append('file', data.file);
    }

    return axiosClient.post("/movies", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      validateStatus: () => true,
    });
  },

  // Cập nhật phim
  updateMovie(id, data) {
    const formData = new FormData();
    
    // Thêm các field text
    Object.keys(data).forEach(key => {
      if (key !== 'file' && key !== 'genreIds') {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      }
    });

    // Thêm file nếu có
    if (data.file) {
      formData.append('file', data.file);
    }

    return axiosClient.put(`/movies/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      validateStatus: () => true,
    });
  },

  // Xóa phim
  deleteMovie(id) {
    return axiosClient.delete(`/movies/${id}`, {
      validateStatus: () => true,
    });
  },

  // Lấy danh sách thể loại của phim
  getMovieGenres(movieId) {
    return axiosClient.get(`/movies/${movieId}/genres`, {
      validateStatus: () => true,
    });
  },

  // Set thể loại cho phim (thay thế toàn bộ)
  setMovieGenres(movieId, genreIds) {
    return axiosClient.put(`/movies/${movieId}/genres`, { genreIds }, {
      validateStatus: () => true,
    });
  },

  // Thêm thể loại cho phim
  addMovieGenre(movieId, genreId) {
    return axiosClient.post(`/movies/${movieId}/genres`, { genreId }, {
      validateStatus: () => true,
    });
  },

  // Xóa thể loại khỏi phim
  removeMovieGenre(movieId, genreId) {
    return axiosClient.delete(`/movies/${movieId}/genres/${genreId}`, {
      validateStatus: () => true,
    });
  },
};

export default movieService;

