import axiosClient from "../axiosClient";

const promotionService = {
  // Lấy danh sách tất cả khuyến mãi
  getAll() {
    return axiosClient.get("/promotions", {
      validateStatus: () => true,
    });
  },

  // Lấy thông tin chi tiết một khuyến mãi
  getById(id) {
    return axiosClient.get(`/promotions/${id}`, {
      validateStatus: () => true,
    });
  },

  // Tạo khuyến mãi mới
  create(data) {
    return axiosClient.post("/promotions", data, {
      validateStatus: () => true,
    });
  },

  // Cập nhật khuyến mãi
  update(id, data) {
    return axiosClient.put(`/promotions/${id}`, data, {
      validateStatus: () => true,
    });
  },

  // Xóa khuyến mãi
  delete(id) {
    return axiosClient.delete(`/promotions/${id}`, {
      validateStatus: () => true,
    });
  },

  // Gửi khuyến mãi cho người dùng
  sendPromotion(id, userId, channel = 'inapp') {
    return axiosClient.post(`/promotions/${id}/send`, {
      userId,
      channel
    }, {
      validateStatus: () => true,
    });
  },

  // Áp dụng mã khuyến mãi (cho user)
  applyCode(code) {
    return axiosClient.post("/promotions/apply", { code }, {
      validateStatus: () => true,
    });
  },
};

export default promotionService;

