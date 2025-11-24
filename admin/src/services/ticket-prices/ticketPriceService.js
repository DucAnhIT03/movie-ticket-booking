import axiosClient from "../axiosClient";

const ticketPriceService = {
  // Lấy giá vé dựa trên loại ghế, loại phim, ngày và giờ
  getPrice(typeSeat, typeMovie, date, time = null) {
    const params = {
      typeSeat,
      typeMovie,
      date,
    };
    
    if (time) {
      params.time = time;
    }
    
    return axiosClient.get("/ticket-prices", {
      params,
      validateStatus: () => true,
    });
  },

  // Lấy tất cả giá vé (có phân trang)
  getAllTicketPrices(params = {}) {
    return axiosClient.get("/ticket-prices", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100,
      },
      validateStatus: () => true,
    });
  },

  // Lấy chi tiết một giá vé
  getTicketPriceById(id) {
    return axiosClient.get(`/ticket-prices/${id}`, {
      validateStatus: () => true,
    });
  },

  // Tạo giá vé mới (chỉ admin)
  createTicketPrice(data) {
    return axiosClient.post("/ticket-prices", data, {
      validateStatus: () => true,
    });
  },

  // Tạo nhiều giá vé cùng lúc (setup đồng loạt)
  createBatchTicketPrices(ticketPrices) {
    return axiosClient.post("/ticket-prices/batch", {
      ticketPrices
    }, {
      validateStatus: () => true,
    });
  },

  // Cập nhật giá vé
  updateTicketPrice(id, data) {
    return axiosClient.put(`/ticket-prices/${id}`, data, {
      validateStatus: () => true,
    });
  },

  // Xóa giá vé
  deleteTicketPrice(id) {
    return axiosClient.delete(`/ticket-prices/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default ticketPriceService;

