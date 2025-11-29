import axiosClient from "../axiosClient";

const emailService = {
  
  sendEmail: async (data) => {
    try {
      const response = await axiosClient.post("/admin/emails/send", data, {
        validateStatus: () => true,
      });
      return response;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  },


  getEmailLogs: async (params = {}) => {
    try {
      const response = await axiosClient.get("/email-logs", {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          search: params.search || "",
          status: params.status || "",
          type: params.type || "",
        },
        validateStatus: () => true,
      });
      return response;
    } catch (error) {
      console.error("Error fetching email logs:", error);
      throw error;
    }
  },


  getEmailStats: async () => {
    try {
      const response = await axiosClient.get("/email-logs/stats", {
        validateStatus: () => true,
      });
      return response;
    } catch (error) {
      console.error("Error fetching email stats:", error);
      throw error;
    }
  },


  getEmailLogDetail: async (id) => {
    try {
      const response = await axiosClient.get(`/email-logs/${id}`, {
        validateStatus: () => true,
      });
      return response;
    } catch (error) {
      console.error("Error fetching email log detail:", error);
      throw error;
    }
  },
};

export default emailService;

