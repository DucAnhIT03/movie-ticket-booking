import axiosClient from "../axiosClient";

const theaterService = {
  
  getAllTheaters(params = {}) {
    return axiosClient.get("/theaters", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100,
        search: params.search || undefined,
        location: params.location || undefined,
        sortBy: params.sortBy || undefined,
        sortOrder: params.sortOrder || undefined,
      },
      validateStatus: () => true,
    });
  },


  getTheaterById(id) {
    return axiosClient.get(`/theaters/${id}`, {
      validateStatus: () => true,
    });
  },

  
  createTheater(data) {
    return axiosClient.post("/theaters", data, {
      validateStatus: () => true,
    });
  },

  
  updateTheater(id, data) {
    return axiosClient.patch(`/theaters/${id}`, data, {
      validateStatus: () => true,
    });
  },

  
  deleteTheater(id) {
    return axiosClient.delete(`/theaters/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default theaterService;

