import axiosClient from "../axiosClient";

const bookingService = {
  createOfflineBooking(payload) {
    return axiosClient.post("/admin/bookings/offline", payload, {
      validateStatus: () => true,
    });
  },

  previewOfflineBooking(payload) {
    return axiosClient.post("/admin/bookings/offline/quote", payload, {
      validateStatus: () => true,
    });
  },

  getAdminBookings(params = {}) {
    return axiosClient.get("/admin/bookings", {
      params,
      validateStatus: () => true,
    });
  },

  deleteBooking(bookingId) {
    return axiosClient.delete(`/admin/bookings/${bookingId}`, {
      validateStatus: () => true,
    });
  },
};

export default bookingService;

