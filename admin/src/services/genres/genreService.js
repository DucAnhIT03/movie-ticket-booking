import axiosClient from "../axiosClient";

const genreService = {
  // Lấy danh sách thể loại (có phân trang và tìm kiếm)
  getAllGenres(params = {}) {
    return axiosClient.get("/genres", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100, // Lấy tất cả, không phân trang
        search: params.search || undefined,
      },
      validateStatus: () => true,
    });
  },

  // Lấy chi tiết một thể loại
  getGenreById(id) {
    return axiosClient.get(`/genres/${id}`, {
      validateStatus: () => true,
    });
  },

  // Tạo thể loại mới
  createGenre(data) {
    return axiosClient.post("/genres", data, {
      validateStatus: () => true,
    });
  },

  // Cập nhật thể loại
  updateGenre(id, data) {
    return axiosClient.put(`/genres/${id}`, data, {
      validateStatus: () => true,
    });
  },

  // Xóa thể loại
  deleteGenre(id) {
    return axiosClient.delete(`/genres/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default genreService;

