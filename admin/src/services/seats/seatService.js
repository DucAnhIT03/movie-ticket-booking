import axiosClient from "../axiosClient";

const seatService = {
  
  getAllSeats() {
    return axiosClient.get("/seats", {
      validateStatus: () => true,
    });
  },

  
  getSeatsByScreen(screenId, showtimeId) {
    const url = showtimeId 
      ? `/seats/screen/${screenId}?showtimeId=${showtimeId}`
      : `/seats/screen/${screenId}`;
    return axiosClient.get(url, {
      validateStatus: () => true,
    });
  },

 
  getSeatsByShowtime(showtimeId) {
    return axiosClient.get(`/seats/showtime/${showtimeId}`, {
      validateStatus: () => true,
    });
  },

  
  getSeatById(id) {
    return axiosClient.get(`/seats/${id}`, {
      validateStatus: () => true,
    });
  },

 
  createSeat(data) {
    return axiosClient.post("/seats", data, {
      validateStatus: () => true,
    });
  },

  
  updateSeat(id, data) {
    return axiosClient.patch(`/seats/${id}`, data, {
      validateStatus: () => true,
    });
  },

  
  deleteSeat(id) {
    return axiosClient.delete(`/seats/${id}`, {
      validateStatus: () => true,
    });
  },

  
  createSeatsBatch(seats) {
    const promises = seats.map(seat => 
      this.createSeat(seat).catch(error => ({
        error: true,
        message: error.response?.data?.message || error.message,
        status: error.response?.status || 500,
        seat
      }))
    );
    return Promise.allSettled(promises);
  },
};

export default seatService;


