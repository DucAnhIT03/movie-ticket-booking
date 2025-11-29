import axiosClient from "../axiosClient";

const newsService = {
 
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


  getAllNoPaging() {
    return axiosClient.get("/news/all", {
      validateStatus: () => true,
    });
  },

  
  getById(id) {
    return axiosClient.get(`/news/${id}`, {
      validateStatus: () => true,
    });
  },

 
  create(data) {
    return axiosClient.post("/news", data, {
      validateStatus: () => true,
    });
  },

 
  update(id, data) {
    return axiosClient.put(`/news/${id}`, data, {
      validateStatus: () => true,
    });
  },

  delete(id) {
    return axiosClient.delete(`/news/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default newsService;












