import axiosClient from "../axiosClient";

const bannerPosterService = {
  // Lấy thông tin poster banner (chỉ có một poster duy nhất)
  get: () => {
    return axiosClient.get("/banner-poster", {
      validateStatus: () => true,
    });
  },
};

export default bannerPosterService;












