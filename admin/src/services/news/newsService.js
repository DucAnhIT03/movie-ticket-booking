import axiosClient from "../axiosClient";

const newsService = {
  // Lấy danh sách tin tức có phân trang và tìm kiếm
  getAll(search, page = 1, limit = 10) {
    const params = {};
    if (search) params.search = search;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    
    return axiosClient.get("/news", {
      params,
      validateStatus: () => true,
    });
  },

  // Lấy tất cả tin tức (không phân trang)
  getAllNoPaging() {
    return axiosClient.get("/news/all", {
      validateStatus: () => true,
    });
  },

  // Lấy thông tin chi tiết một tin tức
  getById(id) {
    return axiosClient.get(`/news/${id}`, {
      validateStatus: () => true,
    });
  },

  // Tạo tin tức mới
  create(data) {
    return axiosClient.post("/news", data, {
      validateStatus: () => true,
    });
  },

  // Cập nhật tin tức
  update(id, data) {
    return axiosClient.put(`/news/${id}`, data, {
      validateStatus: () => true,
    });
  },

  // Xóa tin tức
  delete(id) {
    return axiosClient.delete(`/news/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default newsService;












