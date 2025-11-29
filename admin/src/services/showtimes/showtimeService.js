import axiosClient from "../axiosClient";

const showtimeService = {
  
  getAllShowtimes(params = {}) {
    return axiosClient.get("/showtimes", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100,
        search: params.search || undefined,
        movieId: params.movieId || undefined,
        screenId: params.screenId || undefined,
        sortBy: params.sortBy || undefined,
        sortOrder: params.sortOrder || undefined,
      },
      validateStatus: () => true,
    });
  },

  getShowtimesByMovie(movieId) {
    return axiosClient.get(`/showtimes/movie/${movieId}`, {
      validateStatus: () => true,
    });
  },

  
  getShowtimesByDate(date, timezoneOffset) {
    return axiosClient.get("/showtimes/date", {
      params: { 
        date,
        timezoneOffset: typeof timezoneOffset === "number" ? timezoneOffset : undefined,
      },
      validateStatus: () => true,
    });
  },

 
  getShowtimeById(id) {
    return axiosClient.get(`/showtimes/${id}`, {
      validateStatus: () => true,
    });
  },

  
  createShowtime(data) {
    return axiosClient.post("/showtimes", data, {
      validateStatus: () => true,
    });
  },


  updateShowtime(id, data) {
    return axiosClient.put(`/showtimes/${id}`, data, {
      validateStatus: () => true,
    });
  },

  deleteShowtime(id) {
    return axiosClient.delete(`/showtimes/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default showtimeService;

