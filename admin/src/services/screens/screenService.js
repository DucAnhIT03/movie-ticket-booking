import axiosClient from "../axiosClient";

const screenService = {
  // Lấy danh sách phòng chiếu (có phân trang và tìm kiếm)
  getAllScreens(params = {}) {
    return axiosClient.get("/screens", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100, // Lấy tất cả, không phân trang
        search: params.search || undefined,
        theater_id: params.theater_id || undefined,
        sortBy: params.sortBy || undefined,
        sortOrder: params.sortOrder || undefined,
      },
      validateStatus: () => true,
    });
  },

  // Lấy chi tiết một phòng chiếu
  getScreenById(id) {
    return axiosClient.get(`/screens/${id}`, {
      validateStatus: () => true,
    });
  },

  // Tạo phòng chiếu mới
  createScreen(data) {
    return axiosClient.post("/screens", data, {
      validateStatus: () => true,
    });
  },

  // Cập nhật phòng chiếu
  updateScreen(id, data) {
    return axiosClient.patch(`/screens/${id}`, data, {
      validateStatus: () => true,
    });
  },

  // Xóa phòng chiếu
  deleteScreen(id) {
    return axiosClient.delete(`/screens/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default screenService;

