import axiosClient from "../axiosClient";

const screenService = {

  getAllScreens(params = {}) {
    return axiosClient.get("/screens", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100,
        search: params.search || undefined,
        theater_id: params.theater_id || undefined,
        sortBy: params.sortBy || undefined,
        sortOrder: params.sortOrder || undefined,
      },
      validateStatus: () => true,
    });
  },

 
  getScreenById(id) {
    return axiosClient.get(`/screens/${id}`, {
      validateStatus: () => true,
    });
  },

  
  createScreen(data) {
    return axiosClient.post("/screens", data, {
      validateStatus: () => true,
    });
  },

  
  updateScreen(id, data) {
    return axiosClient.patch(`/screens/${id}`, data, {
      validateStatus: () => true,
    });
  },

  
  deleteScreen(id) {
    return axiosClient.delete(`/screens/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default screenService;

