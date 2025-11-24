import axiosClient from "../axiosClient";

const festivalService = {
  // Lấy danh sách lễ hội có phân trang và tìm kiếm
  getAll(search, page = 1, limit = 10) {
    const params = {};
    if (search) params.search = search;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    
    return axiosClient.get("/festivals", {
      params,
      validateStatus: () => true,
    });
  },

  // Lấy thông tin chi tiết một lễ hội
  getById(id) {
    return axiosClient.get(`/festivals/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default festivalService;












