import axiosClient from "../axiosClient";

const bannerService = {
  getAll: (search = "", page = 1, limit = 10) => {
    return axiosClient.get("/banners", {
      params: { search, page, limit },
      validateStatus: () => true,
    });
  },
  getAllNoPaging: () => {
    return axiosClient.get("/banners/all", {
      validateStatus: () => true,
    });
  },
  getById: (id) => {
    return axiosClient.get(`/banners/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default bannerService;












