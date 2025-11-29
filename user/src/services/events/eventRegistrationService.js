import axiosClient from "../axiosClient";

const eventRegistrationService = {
  register: (eventId, payload) => {
    return axiosClient.post(`/events/${eventId}/registrations`, payload, {
      validateStatus: () => true,
    });
  },
};

export default eventRegistrationService;


