import axiosClient from "../axiosClient";

const authService = {
  login(data) {
    return axiosClient.post("/auth/login", data, {
      validateStatus: () => true,
    });
  },

  sendOtp(email) {
    return axiosClient.post("/auth/send-otp", { email }, {
      validateStatus: () => true,
    });
  },

  verifyOtp(email, otpCode, purpose) {
    return axiosClient.post("/auth/verify-otp", { email, otpCode, purpose }, {
      validateStatus: () => true,
    });
  },

  forgotPassword(email) {
    return axiosClient.post("/auth/forgot-password", { email }, {
      validateStatus: () => true,
    });
  },

  resetPassword(email, otpCode, newPassword) {
    return axiosClient.post("/auth/reset-password", { email, otpCode, newPassword }, {
      validateStatus: () => true,
    });
  },

  verifyResetOtp(email, otpCode) {
    return axiosClient.post("/auth/verify-reset-otp", { email, otpCode }, {
      validateStatus: () => true,
    });
  },

  resetWithCode(email, resetCode, newPassword) {
    return axiosClient.post("/auth/reset-with-code", { email, resetCode, newPassword }, {
      validateStatus: () => true,
    });
  },

  register(data) {
    return axiosClient.post("/auth/register", data, {
      validateStatus: () => true,
    });
  },

  loginWithGoogle(idToken) {
    return axiosClient.post("/auth/login/google", { idToken }, {
      validateStatus: () => true,
    });
  },

  loginWithApple(identityToken, user, email, fullName) {
    return axiosClient.post("/auth/login/apple", {
      identityToken,
      user,
      email,
      fullName,
    }, {
      validateStatus: () => true,
    });
  },
};

export default authService;

