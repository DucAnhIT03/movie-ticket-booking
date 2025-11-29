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

  
  applyCode(code) {
    return axiosClient.post("/promotions/apply", { code }, {
      validateStatus: () => true,
    });
  },
};

export default promotionService;

