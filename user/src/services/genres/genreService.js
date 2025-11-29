import axiosClient from "../axiosClient";

const genreService = {
  // Lấy tất cả thể loại
  getAll: async (params = {}) => {
    try {
      const response = await axiosClient.get("/genres", {
        params: {
          page: params.page || 1,
          limit: params.limit || 100,
          search: params.search || undefined,
        },
        validateStatus: () => true,
      });
      return response;
    } catch (error) {
      console.error("Error getting genres:", error);
      throw error;
    }
  },

  // Lấy thể loại theo ID
  getById: async (genreId) => {
    try {
      const response = await axiosClient.get(`/genres/${genreId}`, {
        validateStatus: () => true,
      });
      return response;
    } catch (error) {
      console.error("Error getting genre:", error);
      throw error;
    }
  },
};

export default genreService;

