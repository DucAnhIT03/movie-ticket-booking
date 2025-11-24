import axiosClient from "../axiosClient";

const bookingService = {
  // Tạo booking mới
  createBooking: async (data) => {
    try {
      const response = await axiosClient.post("/bookings", data);
      return response;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },

  // Lấy danh sách vé của tôi
  getMyTickets: async (params = {}) => {
    try {
      const response = await axiosClient.get("/bookings/my-tickets", { params });
      return response;
    } catch (error) {
      console.error("Error getting my tickets:", error);
      throw error;
    }
  },

  // Hủy booking
  cancelBooking: async (bookingId) => {
    try {
      const response = await axiosClient.patch("/bookings/cancel", { bookingId });
      return response;
    } catch (error) {
      console.error("Error canceling booking:", error);
      throw error;
    }
  },
};

export default bookingService;

