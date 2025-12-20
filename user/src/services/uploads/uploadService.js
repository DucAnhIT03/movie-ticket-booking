import axiosClient from '../axiosClient';

const uploadService = {
  uploadSingle: async (file, folder = null, entity = null, category = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    if (entity) formData.append('entity', entity);
    if (category) formData.append('category', category);

    return axiosClient.post('/uploads/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default uploadService;

