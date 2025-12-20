import axiosClient from "../axiosClient";

const passwordResetService = {
  list(status) {
    const query = status ? `?status=${status}` : "";
    return axiosClient.get(`/auth/admin/password-resets${query}`, {
      validateStatus: () => true,
    });
  },

  approve(id) {
    return axiosClient.post(`/auth/admin/password-resets/${id}/approve`, {}, {
      validateStatus: () => true,
    });
  },
};

export default passwordResetService;


