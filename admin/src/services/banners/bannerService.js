import axiosClient from "../axiosClient";

const buildFormData = (data = {}) => {
  const formData = new FormData();

  if (data.file) {
    formData.append("file", data.file);
  }

  const appendIfDefined = (key, value) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    formData.append(key, value);
  };

  appendIfDefined("url", data.url);
  appendIfDefined("type", data.type);
  appendIfDefined("position", data.position);
  appendIfDefined("width", data.width);
  appendIfDefined("height", data.height);

  return formData;
};

const bannerService = {
  getAll(search = "", page = 1, limit = 20) {
    return axiosClient.get("/banners", {
      params: { search, page, limit },
      validateStatus: () => true,
    });
  },

  getAllNoPaging(search = "") {
    return axiosClient.get("/banners/all", {
      params: search ? { search } : undefined,
      validateStatus: () => true,
    });
  },

  getById(id) {
    return axiosClient.get(`/banners/${id}`, {
      validateStatus: () => true,
    });
  },

  create(data) {
    return axiosClient.post("/banners", buildFormData(data), {
      validateStatus: () => true,
    });
  },

  update(id, data) {
    return axiosClient.put(`/banners/${id}`, buildFormData(data), {
      validateStatus: () => true,
    });
  },

  remove(id) {
    return axiosClient.delete(`/banners/${id}`, {
      validateStatus: () => true,
    });
  },
};

export default bannerService;



