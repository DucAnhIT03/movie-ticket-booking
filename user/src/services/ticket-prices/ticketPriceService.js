import axiosClient from "../axiosClient";

const ticketPriceService = {
  // Lấy giá vé dựa trên loại ghế, loại phim, ngày và giờ
  // movieId: ưu tiên hơn typeMovie nếu có
  // theaterId: để ưu tiên giá vé cụ thể cho rạp
  getPrice(typeSeat, typeMovie, date, time = null, movieId = null, theaterId = null) {
    const params = {
      typeSeat,
      date,
    };
    
    // Ưu tiên movieId nếu có
    if (movieId) {
      params.movieId = movieId;
    } else {
      params.typeMovie = typeMovie;
    }
    
    if (time) {
      params.time = time;
    }
    
    // Thêm theaterId nếu có để ưu tiên giá vé cụ thể cho rạp
    if (theaterId) {
      params.theaterId = theaterId;
    }
    
    return axiosClient.get("/ticket-prices", {
      params,
      validateStatus: () => true,
    });
  },

  // Lấy tất cả giá vé (nếu cần)
  getAllTicketPrices(params = {}) {
    return axiosClient.get("/ticket-prices", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100,
        ...params,
      },
      validateStatus: () => true,
    });
  },
};

export default ticketPriceService;

