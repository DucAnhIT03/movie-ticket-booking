import axiosClient from "../axiosClient";

const festivalService = {
  getAll: (search = "", page = 1, limit = 10) => {
    return axiosClient.get("/festivals", {
      params: { search, page, limit },
      validateStatus: () => true,
    });
  },
  getAllNoPaging: () => {
    return axiosClient.get("/festivals/all", {
      validateStatus: () => true,
    });
  },
  getById: (id) => {
    return axiosClient.get(`/festivals/${id}`, {
      validateStatus: () => true,
    });
  },
  create: (formData) => {
    return axiosClient.post("/festivals", formData, {
      // Không set Content-Type, axios sẽ tự động set với boundary cho FormData
      validateStatus: () => true,
    });
  },
  update: (id, formData) => {
    return axiosClient.patch(`/festivals/${id}`, formData, {
      // Không set Content-Type, axios sẽ tự động set với boundary cho FormData
      validateStatus: () => true,
    });
  },
  delete: (id) => {
    return axiosClient.delete(`/festivals/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default festivalService;

