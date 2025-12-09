import axiosClient from "../axiosClient";

const paymentService = {
  // Tạo payment mới
  createPayment: async (data) => {
    try {
      const response = await axiosClient.post("/payments", data);
      return response;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  },

  // Lấy thông tin payment
  getPayment: async (paymentId) => {
    try {
      const response = await axiosClient.get(`/payments/${paymentId}`);
      return response;
    } catch (error) {
      console.error("Error getting payment:", error);
      throw error;
    }
  },

  // Hoàn thành payment
  completePayment: async (paymentId, transactionId, success = true) => {
    try {
      const response = await axiosClient.patch(`/payments/${paymentId}/complete`, {
        transactionId,
        success,
      });
      return response;
    } catch (error) {
      console.error("Error completing payment:", error);
      throw error;
    }
  },

  // Tạo VNPAY payment URL
  createVnpayUrl: async (paymentId, returnUrl) => {
    try {
      const response = await axiosClient.post(`/payments/${paymentId}/vnpay/url`, {
        returnUrl,
      });
      return response;
    } catch (error) {
      console.error("Error creating VNPAY URL:", error);
      throw error;
    }
  },

  // Tạo MoMo payment URL
  createMomoUrl: async (paymentId, returnUrl, ipnUrl) => {
    try {
      const response = await axiosClient.post(`/payments/${paymentId}/momo/url`, {
        returnUrl,
        ipnUrl,
      });
      return response;
    } catch (error) {
      console.error("Error creating MoMo URL:", error);
      throw error;
    }
  },

  // Tạo phiên thanh toán SePay
  createSepayCheckout: async (paymentId) => {
    try {
      const response = await axiosClient.post(`/payments/${paymentId}/sepay/checkout`);
      return response;
    } catch (error) {
      console.error("Error initializing SePay checkout:", error);
      throw error;
    }
  },

  // Lấy trạng thái đơn hàng SePay
  getSepayStatus: async (paymentId) => {
    try {
      const response = await axiosClient.get(`/payments/${paymentId}/sepay/status`);
      return response;
    } catch (error) {
      console.error("Error fetching SePay status:", error);
      throw error;
    }
  },
};

export default paymentService;

