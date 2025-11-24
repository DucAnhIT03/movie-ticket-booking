import axiosClient from "../axiosClient";

const theaterService = {
  // Lấy tất cả rạp
  getAll: async (params = {}) => {
    try {
      const response = await axiosClient.get("/theaters", { 
        params,
        validateStatus: () => true 
      });
      return response;
    } catch (error) {
      console.error("Error getting theaters:", error);
      throw error;
    }
  },

  // Lấy rạp theo ID
  getById: async (theaterId) => {
    try {
      const response = await axiosClient.get(`/theaters/${theaterId}`, {
        validateStatus: () => true
      });
      return response;
    } catch (error) {
      console.error("Error getting theater:", error);
      throw error;
    }
  },
};

export default theaterService;

