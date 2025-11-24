import axiosClient from "../axiosClient";

const dashboardService = {
  // Lấy thống kê tổng quan cho dashboard
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

