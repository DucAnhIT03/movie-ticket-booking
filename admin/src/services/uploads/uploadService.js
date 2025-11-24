import axiosClient from "../axiosClient";

const uploadService = {
  uploadSingle: async (file, folder = null, entity = null, category = null) => {
    const formData = new FormData();
    formData.append("file", file);
    if (folder) formData.append("folder", folder);
    if (entity) formData.append("entity", entity);
    if (category) formData.append("category", category);

    return axiosClient.post("/uploads/single", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  uploadMultiple: async (files, folder = null, entity = null, category = null) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    if (folder) formData.append("folder", folder);
    if (entity) formData.append("entity", entity);
    if (category) formData.append("category", category);

    return axiosClient.post("/uploads/multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  remove: async (publicId) => {
    return axiosClient.delete("/uploads/remove", {
      data: { public_id: publicId },
    });
  },

  removeMany: async (publicIds) => {
    return axiosClient.delete("/uploads/remove-many", {
      data: { public_ids: publicIds },
    });
  },
};

export default uploadService;

