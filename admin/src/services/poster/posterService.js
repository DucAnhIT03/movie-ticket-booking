import axiosClient from "../axiosClient";

const posterService = {
  // Lấy thông tin poster (chỉ có một poster duy nhất)
  get: () => {
    return axiosClient.get("/poster", {
      validateStatus: () => true,
    });
  },
  // Cập nhật poster (chỉ có một poster duy nhất)
  update: (formData) => {
    return axiosClient.put("/poster", formData, {
      // Không set Content-Type, axios sẽ tự động set với boundary cho FormData
      validateStatus: () => true,
    });
  },
};

export default posterService;

