import axiosClient from "../axiosClient";

const promotionService = {
  getAll: (params) => {
    return axiosClient.get("/promotions", { params });
  },
  getPublic: (limit = 20) => {
    return axiosClient.get("/promotions/public", { params: { limit } });
  },
  getById: (id) => {
    return axiosClient.get(`/promotions/${id}`);
  },
  applyCode: (code) => {
    return axiosClient.post("/promotions/apply", { code });
  },
  getMyNotifications: () => {
    return axiosClient.get("/promotions/my/notifications", {
      validateStatus: () => true,
    });
  },
};

export default promotionService;

