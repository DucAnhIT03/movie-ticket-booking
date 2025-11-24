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

  verifyOtp(email, otpCode) {
    return axiosClient.post("/auth/verify-otp", { email, otpCode }, {
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

