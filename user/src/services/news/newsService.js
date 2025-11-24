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

  // Lấy tin tức theo displayPage (có thể filter ở frontend nếu backend chưa hỗ trợ)
  getByDisplayPage(displayPage, limit = 10) {
    // Không gửi params nếu backend không hỗ trợ, sẽ filter ở frontend
    return axiosClient.get("/news/all", {
      validateStatus: () => true,
    });
  },
};

export default newsService;












