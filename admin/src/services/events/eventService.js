import axiosClient from "../axiosClient";

const eventService = {
  getAll: ({ search = "", status = "", is_special, page = 1, limit = 10 } = {}) => {
    return axiosClient.get("/events", {
      params: {
        search,
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
  create: (formData) => {
    return axiosClient.post("/events", formData, {
      validateStatus: () => true,
    });
  },
  update: (id, formData) => {
    return axiosClient.patch(`/events/${id}`, formData, {
      validateStatus: () => true,
    });
  },
  delete: (id) => {
    return axiosClient.delete(`/events/${id}`, {
      validateStatus: () => true,
    });
  },
  getRegistrations: (id) => {
    return axiosClient.get(`/events/${id}/registrations`, {
      validateStatus: () => true,
    });
  },
};

export default eventService;


