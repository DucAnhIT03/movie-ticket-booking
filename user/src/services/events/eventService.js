import axiosClient from "../axiosClient";

const eventService = {
  getAll: ({ page = 1, limit = 12, status, is_special } = {}) => {
    return axiosClient.get("/events", {
      params: {
        page,
        limit,
        status: status || undefined,
        is_special:
          typeof is_special === "boolean" ? is_special : undefined,
      },
      validateStatus: () => true,
    });
  },
  getById: (id) => {
    return axiosClient.get(`/events/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default eventService;


