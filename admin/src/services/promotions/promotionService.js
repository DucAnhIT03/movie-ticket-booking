import axiosClient from "../axiosClient";

const promotionService = {
  
  getAll() {
    return axiosClient.get("/promotions", {
      validateStatus: () => true,
    });
  },

  
  getById(id) {
    return axiosClient.get(`/promotions/${id}`, {
      validateStatus: () => true,
    });
  },

 
  create(data) {
    return axiosClient.post("/promotions", data, {
      validateStatus: () => true,
    });
  },

 
  update(id, data) {
    return axiosClient.put(`/promotions/${id}`, data, {
      validateStatus: () => true,
    });
  },

  
  delete(id) {
    return axiosClient.delete(`/promotions/${id}`, {
      validateStatus: () => true,
    });
  },

 
  sendPromotion(id, userId, channel = 'inapp') {
    return axiosClient.post(`/promotions/${id}/send`, {
      userId,
      channel
    }, {
      validateStatus: () => true,
    });
  },

  
  // Áp dụng mã giảm giá
  // bypassUserLimit: true = Admin/Employee có thể dùng mã nhiều lần (bỏ qua giới hạn "mỗi user 1 lần")
  // Nhưng vẫn phải tuân theo giới hạn tổng số lượt sử dụng của mã
  applyCode(code, bypassUserLimit = false) {
    return axiosClient.post("/promotions/apply", { 
      code,
      bypassUserLimit // Bỏ qua giới hạn "mỗi user chỉ dùng 1 lần", nhưng vẫn kiểm tra tổng số lượt sử dụng
    }, {
      validateStatus: () => true,
    });
  },
};

export default promotionService;

