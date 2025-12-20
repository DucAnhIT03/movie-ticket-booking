import { useState, useEffect, useRef, useCallback } from 'react';
import chatService from '../services/chat/chatService';
import socketService from '../services/chat/socketService';
import uploadService from '../services/uploads/uploadService';
import './ChatWidget.css';

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      return;
    }

    // Kết nối socket và đợi kết nối thành công
    const socket = socketService.connect(token);
    
    if (socket) {
      if (socket.connected) {
        console.log('✅ Socket already connected (Staff)');
      } else {
        socket.once('connect', () => {
          console.log('✅ Socket connected successfully (Staff)');
        });
        socket.once('connect_error', (error) => {
          console.error('❌ Socket connection failed (Staff):', error);
        });
      }
    }

    // Load conversations
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation && isOpen) {
      loadMessages();
      socketService.joinTheater(selectedConversation.theaterId);
      setUnreadCount(0);
    }
  }, [selectedConversation, isOpen]);

  // Đăng ký socket listener - sử dụng ref để luôn có giá trị mới nhất
  const selectedConversationRef = useRef(selectedConversation);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
    isOpenRef.current = isOpen;
  }, [selectedConversation, isOpen]);

  useEffect(() => {
    const handleNewMessage = (message) => {
      const currentConversation = selectedConversationRef.current;
      const currentIsOpen = isOpenRef.current;
      
      console.log('🔔 Staff: New message received via socket:', message);
      console.log('📋 Staff: Current selected conversation:', currentConversation?.id);
      console.log('📋 Staff: isOpen:', currentIsOpen);
      
      // Kiểm tra xem message có thuộc conversation hiện tại không
      if (currentConversation && currentIsOpen) {
        const isCurrentConversation = 
          message.theaterId === currentConversation.theaterId &&
          message.userId === currentConversation.userId;
        
        console.log('✅ Staff: Is current conversation?', isCurrentConversation);
        console.log('📊 Staff: Message theaterId:', message.theaterId, 'vs Selected:', currentConversation.theaterId);
        console.log('📊 Staff: Message userId:', message.userId, 'vs Selected:', currentConversation.userId);
        
        if (isCurrentConversation) {
          console.log('➕ Staff: Adding message to state');
          setMessages((prev) => {
            // Xóa tin nhắn tạm nếu có
            const withoutTemp = prev.filter(m => !m.isTemp);
            // Kiểm tra xem message đã tồn tại chưa để tránh duplicate
            const exists = withoutTemp.some(m => m.id === message.id);
            if (exists) {
              console.log('⚠️ Staff: Message already exists, skipping');
              return withoutTemp;
            }
            console.log('✅ Staff: Message added successfully');
            return [...withoutTemp, message];
          });
          setTimeout(() => scrollToBottom(), 100);
        } else {
          console.log('❌ Staff: Message does not belong to current conversation');
        }
      } else {
        console.log('⚠️ Staff: No conversation selected or chat not open');
      }
      
      // Cập nhật unread count
      loadConversations();
    };

    // Đăng ký listener
    socketService.onNewMessage(handleNewMessage);
    console.log('👂 Staff: Socket listener registered');

    return () => {
      // Chỉ remove listener này
      socketService.offNewMessage(handleNewMessage);
      console.log('🔇 Staff: Socket listener unregistered');
    };
  }, []); // Chỉ đăng ký một lần khi mount

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const loadConversations = async () => {
    try {
      const response = await chatService.getStaffConversations();
      setConversations(response.data || []);
      const totalUnread = (response.data || []).reduce(
        (sum, conv) => sum + (conv.staffUnreadCount || 0),
        0
      );
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    setLoading(true);
    try {
      const response = await chatService.getMessages(
        selectedConversation.theaterId,
        selectedConversation.userId
      );
      setMessages(response.data || []);
      
      // Đánh dấu đã đọc
      await chatService.markAsRead(selectedConversation.theaterId);
      setUnreadCount(0);
      loadConversations();
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && selectedConversation) {
      loadMessages();
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setUnreadCount(0);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 10MB');
        return;
      }
      setSelectedImage(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const hasText = !!newMessage.trim();
    const hasImage = !!selectedImage;
    if ((!hasText && !hasImage) || !selectedConversation) return;

    const messageText = newMessage.trim() || '';
    setNewMessage('');
    let imageUrl = null;

    // Đảm bảo socket đã được kết nối
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      alert('Vui lòng đăng nhập để gửi tin nhắn');
      return;
    }

    // Upload ảnh nếu có
    if (hasImage) {
      setUploading(true);
      try {
        const uploadRes = await uploadService.uploadSingle(selectedImage, 'chat', 'chat_message');
        if (uploadRes.status >= 200 && uploadRes.status < 300 && uploadRes.data?.url) {
          imageUrl = uploadRes.data.url;
        } else {
          throw new Error(uploadRes.data?.message || 'Upload ảnh thất bại');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Không thể upload ảnh: ${error.message}`);
        setUploading(false);
        return;
      }
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    // Kiểm tra và kết nối socket nếu chưa kết nối
    if (!socketService.socket || !socketService.socket.connected) {
      console.log('Socket not connected, connecting...');
      socketService.connect(token);
      
      // Đợi socket kết nối
      await new Promise((resolve, reject) => {
        if (socketService.socket) {
          if (socketService.socket.connected) {
            resolve();
          } else {
            socketService.socket.once('connect', () => {
              console.log('Socket connected, ready to send');
              resolve();
            });
            socketService.socket.once('connect_error', (error) => {
              reject(error);
            });
            // Timeout sau 5 giây
            setTimeout(() => {
              reject(new Error('Connection timeout'));
            }, 5000);
          }
        } else {
          reject(new Error('Socket not initialized'));
        }
      });
    }

    try {
      console.log('📤 Sending message:', messageText, 'Image:', imageUrl);
      console.log('📍 Theater ID:', selectedConversation.theaterId);
      console.log('📍 Target userId:', selectedConversation.userId);
      
      const response = await socketService.sendMessage(
        selectedConversation.theaterId,
        messageText,
        selectedConversation.userId,
        imageUrl
      );
      console.log('📥 Send message response:', response);
      
      // Tin nhắn sẽ được thêm qua socket event 'new_message' (realtime)
      // Nhưng cũng thêm từ response để đảm bảo hiển thị ngay
      if (response && response.message) {
        const realMessage = response.message;
        console.log('✅ Real message from response:', realMessage);
        
        setMessages((prev) => {
          // Kiểm tra xem tin nhắn đã có chưa (có thể đã được thêm qua socket event)
          const exists = prev.some(m => m.id === realMessage.id);
          if (exists) {
            console.log('⚠️ Message already in state (from socket event)');
            return prev;
          }
          console.log('➕ Adding message from response');
          return [...prev, realMessage];
        });
        setTimeout(() => scrollToBottom(), 100);
      } else {
        console.warn('⚠️ Response does not have message, waiting for socket event...');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert(`Không thể gửi tin nhắn: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const token = localStorage.getItem('adminAccessToken');
  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const isStaff = (user.roles || []).includes('ROLE_EMPLOYEE') || 
                  (user.roles || []).includes('ROLE_ADMIN');

  if (!token || !isStaff) {
    return null;
  }

  return (
    <div className="chat-widget-container">
      {isOpen ? (
        <div className="chat-widget-box">
          <div className="chat-widget-header">
            <h3>Chat với khách hàng</h3>
            <button className="close-btn" onClick={handleToggle}>×</button>
          </div>

          {!selectedConversation ? (
            <div className="chat-widget-conversations">
              <div className="conversations-list">
                {conversations.length === 0 ? (
                  <div className="no-conversations">Chưa có cuộc trò chuyện nào</div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`conversation-item ${
                        conv.staffUnreadCount > 0 ? 'unread' : ''
                      }`}
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <div className="conversation-info">
                        <h4>
                          {conv.user?.firstName} {conv.user?.lastName}
                        </h4>
                        <p>{conv.theater?.name}</p>
                        <p className="last-message">{conv.lastMessage}</p>
                      </div>
                      {conv.staffUnreadCount > 0 && (
                        <span className="unread-badge">{conv.staffUnreadCount}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="chat-widget-conversation-header">
                <div>
                  <h4>
                    {selectedConversation.user?.firstName}{' '}
                    {selectedConversation.user?.lastName}
                  </h4>
                  <p>{selectedConversation.theater?.name}</p>
                </div>
                <button
                  className="back-btn"
                  onClick={() => setSelectedConversation(null)}
                >
                  ← Danh sách
                </button>
              </div>

              <div className="chat-widget-messages">
                {loading ? (
                  <div className="loading-widget">Đang tải tin nhắn...</div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`message-widget ${message.isFromStaff ? 'staff' : 'user'}`}
                      >
                        <div className="message-content-widget">
                          {message.imageUrl && (
                            <img
                              src={message.imageUrl}
                              alt="attachment"
                              className="message-image-widget"
                              onClick={() => window.open(message.imageUrl, '_blank')}
                            />
                          )}
                          {message.message && (
                            <div className="message-text-widget">{message.message}</div>
                          )}
                          <div className="message-time-widget">
                            {message.isTemp ? 'Đang gửi...' : formatTime(message.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <form className="chat-widget-input-form" onSubmit={handleSendMessage}>
                {selectedImage && (
                  <div className="chat-widget-image-preview">
                    <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
                    <button type="button" onClick={handleRemoveImage} className="remove-image-btn">×</button>
                  </div>
                )}
                <div className="chat-widget-input-wrapper">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                  />
                  <button 
                    type="button" 
                    className="attach-button-widget" 
                    aria-label="Đính kèm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    +
                  </button>
                  <input
                    type="text"
                    placeholder="Hỏi bất kì điều gì"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="chat-widget-input"
                  />
                  <button 
                    type="submit" 
                    className="send-button-widget" 
                    aria-label="Gửi"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="loading-spinner"></div>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13"/>
                        <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      ) : (
        <button className="chat-widget-button" onClick={handleToggle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
          </svg>
          {unreadCount > 0 && <span className="chat-widget-badge">{unreadCount}</span>}
        </button>
      )}
    </div>
  );
}

export default ChatWidget;

