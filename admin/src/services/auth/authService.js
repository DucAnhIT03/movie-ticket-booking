import axiosClient from "../axiosClient";

const authService = {
  login(data) {
    return axiosClient.post("/admin/auth/login", data, {
      validateStatus: () => true,
    });
  },
};

export default authService;
