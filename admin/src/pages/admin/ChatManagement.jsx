import { useState, useEffect, useRef } from 'react';
import { FaPlus, FaPaperPlane } from 'react-icons/fa';
import chatService from '../../services/chat/chatService';
import socketService from '../../services/socketService';
import uploadService from '../../services/uploads/uploadService';
import './ChatManagement.css';

function ChatManagement() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    theaterId: '',
    userId: '',
    staffId: '',
  });
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadConversations();
    
    // Kết nối socket
    const token = localStorage.getItem('accessToken');
    if (token) {
      socketService.connect(token);
      
      // Lắng nghe tin nhắn mới
      const handleNewMessage = (message) => {
        if (selectedConversation && message.userId === selectedConversation.userId && message.theaterId === selectedConversation.theaterId) {
          setMessages((prev) => {
            // Check if message already exists
            const exists = prev.some(m => m.id === message.id);
            if (!exists) {
              return [...prev, message];
            }
            return prev;
          });
        }
        // Reload conversations để cập nhật last message
        loadConversations();
      };
      
      socketService.onNewMessage(handleNewMessage);
      
      return () => {
        socketService.offNewMessage(handleNewMessage);
      };
    }
  }, [pagination.page, filters]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.theaterId && { theaterId: Number(filters.theaterId) }),
        ...(filters.userId && { userId: Number(filters.userId) }),
        ...(filters.staffId && { staffId: Number(filters.staffId) }),
      };
      const response = await chatService.getAllConversations(params);
      setConversations(response.data.items || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: Math.ceil((response.data.total || 0) / prev.limit),
      }));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    setLoading(true);
    try {
      const response = await chatService.getMessagesByConversationId(conversationId);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    if (conversation) {
      loadMessages(conversation.id);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const hasText = !!newMessage.trim();
    const hasImage = !!selectedFile;
    if ((!hasText && !hasImage) || !selectedConversation) return;

    const messageText = newMessage.trim() || '';
    setNewMessage('');
    let imageUrl = null;

    try {
      // Upload ảnh nếu có
      if (hasImage) {
        const uploadRes = await uploadService.uploadSingle(selectedFile, 'chat', 'chat_message');
        if (uploadRes.status >= 200 && uploadRes.status < 300 && uploadRes.data?.url) {
          imageUrl = uploadRes.data.url;
        } else {
          throw new Error(uploadRes.data?.message || 'Upload ảnh thất bại');
        }
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

      // Gửi tin nhắn với cả text và image (nếu có)
      const response = await socketService.sendMessage(
        selectedConversation.theaterId, 
        messageText, 
        imageUrl
      );

      // Add the sent message to the messages list immediately
      if (response && response.message) {
        setMessages((prev) => {
          // Kiểm tra duplicate
          const exists = prev.some(m => m.id === response.message.id);
          if (exists) {
            return prev;
          }
          return [...prev, response.message];
        });
      }

      // Reload conversations để cập nhật last message
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Không thể gửi tin nhắn: ${error.message}`);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="chat-management-container">
      <div className="chat-management-header">
        <h2>Quản lý Chat</h2>
      </div>

      <div className="chat-management-filters">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, email, rạp..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              setPagination(prev => ({ ...prev, page: 1 }));
              loadConversations();
            }
          }}
        />
        <input
          type="number"
          placeholder="Theater ID"
          value={filters.theaterId}
          onChange={(e) => setFilters({ ...filters, theaterId: e.target.value })}
        />
        <input
          type="number"
          placeholder="User ID"
          value={filters.userId}
          onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
        />
        <input
          type="number"
          placeholder="Staff ID"
          value={filters.staffId}
          onChange={(e) => setFilters({ ...filters, staffId: e.target.value })}
        />
        <button onClick={() => {
          setPagination(prev => ({ ...prev, page: 1 }));
          loadConversations();
        }}>
          Tìm kiếm
        </button>
      </div>

      <div className="chat-management-content">
        <div className="conversations-panel">
          <h3>Danh sách cuộc trò chuyện ({pagination.total})</h3>
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <>
              <div className="conversations-list">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="conversation-participants">
                      <span className="conversation-user-name">
                        {conv.user?.firstName} {conv.user?.lastName}
                      </span>
                      {conv.staff && (
                        <>
                          <span className="conversation-separator"> &lt;-&gt; </span>
                          <span className="conversation-staff-name">
                            {conv.staff.firstName} {conv.staff.lastName}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="conversation-theater">
                      <strong>Rạp:</strong> {conv.theater?.name || 'N/A'}
                    </div>
                    <div className="conversation-time">
                      <strong>Ngày:</strong> {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : (conv.created_at ? formatTime(conv.created_at) : 'Chưa có')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pagination">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Trước
                </button>
                <span>
                  Trang {pagination.page} / {pagination.totalPages || 1}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Sau
                </button>
              </div>
            </>
          )}
        </div>

        <div className="messages-panel">
          {selectedConversation ? (
            <>
              <div className="messages-header">
                <div>
                  <h3>
                    {selectedConversation.user?.firstName} {selectedConversation.user?.lastName}
                  </h3>
                  <p>Rạp: {selectedConversation.theater?.name}</p>
                  {selectedConversation.staff && (
                    <p>Nhân viên: {selectedConversation.staff.firstName} {selectedConversation.staff.lastName}</p>
                  )}
                </div>
                <button onClick={() => setSelectedConversation(null)}>Đóng</button>
              </div>
              <div className="messages-list">
                {loading ? (
                  <div className="loading">Đang tải tin nhắn...</div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message-item ${message.isFromStaff ? 'staff' : 'user'}`}
                    >
                      <div className="message-header">
                        <strong>
                          {message.isFromStaff
                            ? `${message.staff?.firstName || ''} ${message.staff?.lastName || ''} (Nhân viên)`
                            : `${message.user?.firstName || ''} ${message.user?.lastName || ''} (Khách hàng)`}
                        </strong>
                        <span className="message-time">{formatTime(message.created_at)}</span>
                      </div>
                      <div className="message-content">
                        {message.imageUrl ? (
                          <img src={message.imageUrl} alt="Chat image" className="message-image" />
                        ) : (
                          message.message
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {selectedConversation && (
                <form className="message-input-form" onSubmit={handleSendMessage}>
                  {selectedFile && (
                    <div className="chat-image-preview">
                      <img src={URL.createObjectURL(selectedFile)} alt="Preview" />
                      <button 
                        type="button" 
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }} 
                        className="remove-image-btn-chat"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <div className="message-input-wrapper">
                    <button
                      type="button"
                      className="attach-button-chat"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      +
                    </button>
                    <input
                      type="text"
                      placeholder="Nhập tin nhắn..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="message-input-text"
                    />
                    <button type="submit" className="send-button-chat">
                      <FaPaperPlane />
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="no-selection">
              <p>Chọn một cuộc trò chuyện để xem tin nhắn</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatManagement;

