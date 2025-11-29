import axiosClient from "../axiosClient";

const posterService = {

  get: () => {
    return axiosClient.get("/poster", {
      validateStatus: () => true,
    });
  },

  update: (formData) => {
    return axiosClient.put("/poster", formData, {
    
      validateStatus: () => true,
    });
  },
};

export default posterService;

