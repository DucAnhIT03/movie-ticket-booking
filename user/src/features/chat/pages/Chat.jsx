import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import chatService from '../../../services/chat';
import socketService from '../../../services/socketService';
import './Chat.css';

function Chat() {
  const navigate = useNavigate();
  const [theaters, setTheaters] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTheater, setSearchTheater] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    // Kết nối socket
    socketService.connect(token);

    // Lắng nghe tin nhắn mới
    const handleNewMessage = (message) => {
      if (selectedTheater && message.theaterId === selectedTheater.id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    };

    socketService.onNewMessage(handleNewMessage);

    // Load danh sách rạp
    loadTheaters();

    return () => {
      socketService.offNewMessage(handleNewMessage);
    };
  }, [navigate]);

  useEffect(() => {
    if (selectedTheater) {
      loadMessages();
      socketService.joinTheater(selectedTheater.id);
    }
  }, [selectedTheater]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadTheaters = async () => {
    try {
      const response = await chatService.getTheaters(searchTheater);
      setTheaters(response.data.items || []);
    } catch (error) {
      console.error('Error loading theaters:', error);
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
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTheater = (theater) => {
    setSelectedTheater(theater);
    setMessages([]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTheater) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      await socketService.sendMessage(selectedTheater.id, messageText);
      // Tin nhắn sẽ được thêm qua socket event
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
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

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Chọn rạp để chat</h2>
          <div className="search-theater">
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
        </div>
        <div className="theater-list">
          {theaters.map((theater) => (
            <div
              key={theater.id}
              className={`theater-item ${selectedTheater?.id === theater.id ? 'active' : ''}`}
              onClick={() => handleSelectTheater(theater)}
            >
              <div className="theater-info">
                <h3>{theater.name}</h3>
                <p>{theater.location}</p>
                <p className="theater-phone">{theater.phone}</p>
              </div>
            </div>
          ))}
          {theaters.length === 0 && (
            <div className="no-theaters">Không tìm thấy rạp nào</div>
          )}
        </div>
      </div>

      <div className="chat-main">
        {selectedTheater ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <h3>{selectedTheater.name}</h3>
                <p>{selectedTheater.location}</p>
              </div>
            </div>

            <div className="chat-messages" ref={messagesContainerRef}>
              {loading ? (
                <div className="loading">Đang tải tin nhắn...</div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${message.isFromStaff ? 'staff' : 'user'}`}
                    >
                      <div className="message-content">
                        <div className="message-text">{message.message}</div>
                        <div className="message-time">
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="chat-input"
              />
              <button type="submit" className="send-button">
                Gửi
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <p>Vui lòng chọn một rạp để bắt đầu chat</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;

