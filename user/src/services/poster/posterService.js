import axiosClient from "../axiosClient";

const posterService = {
  // Lấy thông tin poster (chỉ có một poster duy nhất)
  get: () => {
    return axiosClient.get("/poster", {
      validateStatus: () => true,
    });
  },
};

export default posterService;



