import axiosClient from "../axiosClient";

const genreService = {
  
  getAllGenres(params = {}) {
    return axiosClient.get("/genres", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100, 
        search: params.search || undefined,
      },
      validateStatus: () => true,
    });
  },

  getGenreById(id) {
    return axiosClient.get(`/genres/${id}`, {
      validateStatus: () => true,
    });
  },

  
  createGenre(data) {
    return axiosClient.post("/genres", data, {
      validateStatus: () => true,
    });
  },

  updateGenre(id, data) {
    return axiosClient.put(`/genres/${id}`, data, {
      validateStatus: () => true,
    });
  },

  
  deleteGenre(id) {
    return axiosClient.delete(`/genres/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default genreService;

