import axiosClient from './axiosClient';

const chatService = {
  getTheaters: (search) => {
    return axiosClient.get('/chat/theaters', { params: { search } });
  },

  getStaffByTheater: (theaterId) => {
    return axiosClient.get(`/chat/theaters/${theaterId}/staff`);
  },

  getConversations: () => {
    return axiosClient.get('/chat/conversations');
  },

  getMessages: (theaterId, page = 1, limit = 50) => {
    return axiosClient.get(`/chat/messages/${theaterId}`, {
      params: { page, limit },
    });
  },

  markAsRead: (theaterId) => {
    return axiosClient.post(`/chat/messages/${theaterId}/read`);
  },
};

export default chatService;


