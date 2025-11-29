import axiosClient from "../axiosClient";

const ticketPriceService = {
  
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

  
  getAllTicketPrices(params = {}) {
    return axiosClient.get("/ticket-prices", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100,
      },
      validateStatus: () => true,
    });
  },

  
  getTicketPriceById(id) {
    return axiosClient.get(`/ticket-prices/${id}`, {
      validateStatus: () => true,
    });
  },

  
  createTicketPrice(data) {
    return axiosClient.post("/ticket-prices", data, {
      validateStatus: () => true,
    });
  },


  createBatchTicketPrices(ticketPrices) {
    return axiosClient.post("/ticket-prices/batch", {
      ticketPrices
    }, {
      validateStatus: () => true,
    });
  },

  
  updateTicketPrice(id, data) {
    return axiosClient.put(`/ticket-prices/${id}`, data, {
      validateStatus: () => true,
    });
  },

  
  deleteTicketPrice(id) {
    return axiosClient.delete(`/ticket-prices/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default ticketPriceService;

