import axiosClient from "../axiosClient";

const theaterService = {
  // Lấy danh sách rạp phim (có phân trang và tìm kiếm)
  getAllTheaters(params = {}) {
    return axiosClient.get("/theaters", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100, // Lấy tất cả, không phân trang
        search: params.search || undefined,
        location: params.location || undefined,
        sortBy: params.sortBy || undefined,
        sortOrder: params.sortOrder || undefined,
      },
      validateStatus: () => true,
    });
  },

  // Lấy chi tiết một rạp phim
  getTheaterById(id) {
    return axiosClient.get(`/theaters/${id}`, {
      validateStatus: () => true,
    });
  },

  // Tạo rạp phim mới
  createTheater(data) {
    return axiosClient.post("/theaters", data, {
      validateStatus: () => true,
    });
  },

  // Cập nhật rạp phim
  updateTheater(id, data) {
    return axiosClient.patch(`/theaters/${id}`, data, {
      validateStatus: () => true,
    });
  },

  // Xóa rạp phim
  deleteTheater(id) {
    return axiosClient.delete(`/theaters/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default theaterService;

