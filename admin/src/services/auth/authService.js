import axiosClient from "../axiosClient";

const authService = {
  login(data) {
    return axiosClient.post("/admin/auth/login", data, {
      validateStatus: () => true,
    });
  },

  forgotPassword(email) {
    return axiosClient.post("/auth/forgot-password", { email }, {
      validateStatus: () => true,
    });
  },

  verifyResetOtp(email, otpCode) {
    return axiosClient.post("/auth/verify-reset-otp", { email, otpCode }, {
      validateStatus: () => true,
    });
  },

  getResetStatus(email) {
    return axiosClient.get("/auth/reset-request-status", {
      params: { email },
      validateStatus: () => true,
    });
  },

  resetWithCode(email, resetCode, newPassword) {
    return axiosClient.post("/auth/reset-with-code", { 
      email, 
      resetCode, 
      newPassword 
    }, {
      validateStatus: () => true,
    });
  },
};

export default authService;
