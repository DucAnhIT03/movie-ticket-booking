import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaPaperPlane } from 'react-icons/fa';
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
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

 
    socketService.connect(token);

  
    const handleNewMessage = (message) => {
      if (selectedTheater && message.theaterId === selectedTheater.id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    };

    socketService.onNewMessage(handleNewMessage);

    
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSendImage = async () => {
    if (!selectedFile || !selectedTheater) return;

    try {
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folder', 'chat');

      const uploadResponse = await fetch('/api/uploads/single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.url;

      
      await socketService.sendMessage(selectedTheater.id, '', imageUrl);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending image:', error);
      alert('Không thể gửi ảnh. Vui lòng thử lại.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !selectedTheater) return;

    const messageText = newMessage.trim();
    const file = selectedFile;
    setNewMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      if (file) {
        
        await handleSendImage();
      } else {
       
        await socketService.sendMessage(selectedTheater.id, messageText);
      }
      
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
                        {message.imageUrl ? (
                          <img src={message.imageUrl} alt="Chat image" className="message-image" />
                        ) : (
                          <div className="message-text">{message.message}</div>
                        )}
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
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
              >
                <FaPlus />
              </button>
              <textarea
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                className="chat-input"
                rows="1"
              />
              <button type="submit" className="send-button">
                <FaPaperPlane />
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

