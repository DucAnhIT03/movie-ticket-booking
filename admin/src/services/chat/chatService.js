import axiosClient from '../axiosClient';

const chatService = {
  getStaffConversations: () => {
    return axiosClient.get('/chat/conversations/staff');
  },

  getMessages: (theaterId, targetUserId, page = 1, limit = 50) => {
    return axiosClient.get(`/chat/messages/${theaterId}`, {
      params: { page, limit, targetUserId },
    });
  },

  markAsRead: (theaterId) => {
    return axiosClient.post(`/chat/messages/${theaterId}/read`);
  },

  // Admin endpoints
  getAllConversations: (params) => {
    return axiosClient.get('/chat/admin/conversations', { params });
  },

  getMessagesByConversationId: (conversationId, page = 1, limit = 50) => {
    return axiosClient.get(`/chat/admin/conversations/${conversationId}/messages`, {
      params: { page, limit },
    });
  },
};

export default chatService;

