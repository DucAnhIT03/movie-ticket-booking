import { useState, useEffect, useRef, useCallback } from 'react';
import chatService from '../services/chat';
import socketService from '../services/socketService';
import './ChatWidget.css';

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [theaters, setTheaters] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTheater, setSearchTheater] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      // Nếu không có token, không kết nối socket nhưng vẫn hiển thị widget
      return;
    }

    // Kết nối socket và đợi kết nối thành công
    const socket = socketService.connect(token);
    
    if (socket) {
      if (socket.connected) {
        console.log('✅ Socket already connected');
      } else {
        socket.once('connect', () => {
          console.log('✅ Socket connected successfully');
        });
        socket.once('connect_error', (error) => {
          console.error('❌ Socket connection failed:', error);
        });
      }
    }

    // Load danh sách rạp
    loadTheaters();

    // Load conversations để đếm unread
    loadConversations();
  }, []);

  // Đăng ký socket listener - sử dụng ref để luôn có giá trị mới nhất
  const selectedTheaterRef = useRef(selectedTheater);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    selectedTheaterRef.current = selectedTheater;
    isOpenRef.current = isOpen;
  }, [selectedTheater, isOpen]);

  useEffect(() => {
    const handleNewMessage = (message) => {
      const currentTheater = selectedTheaterRef.current;
      const currentIsOpen = isOpenRef.current;
      
      console.log('🔔 User: New message received:', message);
      console.log('📍 User: Selected theater:', currentTheater?.id);
      console.log('📍 User: Message theaterId:', message.theaterId);
      console.log('📍 User: isOpen:', currentIsOpen);
      
      if (currentTheater && message.theaterId === currentTheater.id && currentIsOpen) {
        console.log('✅ User: Message belongs to current theater, adding to state');
        setMessages((prev) => {
          // Kiểm tra duplicate
          const exists = prev.some(m => m.id === message.id);
          if (exists) {
            console.log('⚠️ User: Message already exists');
            return prev;
          }
          console.log('➕ User: Adding message to state');
          return [...prev, message];
        });
        setTimeout(() => scrollToBottom(), 100);
      } else if (!currentTheater) {
        setUnreadCount((prev) => prev + 1);
      } else if (!currentIsOpen) {
        setUnreadCount((prev) => prev + 1);
      } else {
        console.log('❌ User: Message does not belong to current theater or chat not open');
      }
    };

    // Đăng ký listener
    socketService.onNewMessage(handleNewMessage);
    console.log('👂 User: Socket listener registered');

    return () => {
      // Chỉ remove listener này
      socketService.offNewMessage(handleNewMessage);
      console.log('🔇 User: Socket listener unregistered');
    };
  }, []); // Chỉ đăng ký một lần khi mount

  useEffect(() => {
    if (selectedTheater && isOpen) {
      loadMessages();
      socketService.joinTheater(selectedTheater.id);
      setUnreadCount(0);
    }
  }, [selectedTheater, isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const loadTheaters = async () => {
    try {
      const response = await chatService.getTheaters(searchTheater);
      setTheaters(response.data.items || []);
    } catch (error) {
      console.error('Error loading theaters:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await chatService.getConversations();
      const totalUnread = response.data.reduce((sum, conv) => sum + (conv.userUnreadCount || 0), 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedTheater) return;

    setLoading(true);
    try {
      const response = await chatService.getMessages(selectedTheater.id);
      setMessages(response.data || []);
      
      // Đánh dấu đã đọc
      await chatService.markAsRead(selectedTheater.id);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = useCallback(() => {
    const currentToken = localStorage.getItem('accessToken');

    if (!currentToken) {
      if (window.confirm('Bạn cần đăng nhập để sử dụng chat. Bạn có muốn chuyển đến trang đăng nhập không?')) {
        window.location.href = '/login';
      }
      return;
    }

    setIsOpen(true);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && selectedTheater) {
      loadMessages();
    }
  };

  useEffect(() => {
    const openChatFromEvent = () => handleOpen();
    window.addEventListener('openChatWidget', openChatFromEvent);

    return () => {
      window.removeEventListener('openChatWidget', openChatFromEvent);
    };
  }, [handleOpen]);

  const handleSelectTheater = (theater) => {
    setSelectedTheater(theater);
    setMessages([]);
    setUnreadCount(0);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTheater) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Đảm bảo socket đã được kết nối
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Vui lòng đăng nhập để gửi tin nhắn');
      return;
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
      console.log('Sending message:', messageText);
      await socketService.sendMessage(selectedTheater.id, messageText);
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Không thể gửi tin nhắn: ${error.message}`);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const token = localStorage.getItem('accessToken');

  return (
    <div className="chat-widget-container" ref={widgetRef}>
      {isOpen ? (
        <div className="chat-widget-box">
          <div className="chat-widget-header">
            <h3>Chat hỗ trợ</h3>
            <button className="close-btn" onClick={handleToggle}>×</button>
          </div>

          {!selectedTheater ? (
            <div className="chat-widget-theater-select">
              <div className="search-theater-widget">
                <input
                  type="text"
                  placeholder="Tìm kiếm rạp..."
                  value={searchTheater}
                  onChange={(e) => setSearchTheater(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      loadTheaters();
                    }
                  }}
                />
                <button onClick={loadTheaters}>Tìm</button>
              </div>
              <div className="theater-list-widget">
                {theaters.map((theater) => (
                  <div
                    key={theater.id}
                    className="theater-item-widget"
                    onClick={() => handleSelectTheater(theater)}
                  >
                    <div className="theater-info-widget">
                      <h4>{theater.name}</h4>
                      <p>{theater.location}</p>
                    </div>
                  </div>
                ))}
                {theaters.length === 0 && (
                  <div className="no-theaters-widget">Không tìm thấy rạp nào</div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="chat-widget-theater-info">
                <div>
                  <h4>{selectedTheater.name}</h4>
                  <p>{selectedTheater.location}</p>
                </div>
                <button className="change-theater-btn" onClick={() => setSelectedTheater(null)}>
                  Đổi rạp
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
                          <div className="message-text-widget">{message.message}</div>
                          <div className="message-time-widget">
                            {formatTime(message.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <form className="chat-widget-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="chat-widget-input"
                />
                <button type="submit" className="send-button-widget">
                  Gửi
                </button>
              </form>
            </>
          )}
        </div>
      ) : (
        <button 
          className="chat-widget-button" 
          onClick={handleOpen}
        >
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

