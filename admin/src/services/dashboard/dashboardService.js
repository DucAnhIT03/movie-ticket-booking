import axiosClient from "../axiosClient";

const dashboardService = {

  getStats: async () => {
    try {
      const response = await axiosClient.get("/dashboard/stats");
      return response;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },
};

export default dashboardService;

