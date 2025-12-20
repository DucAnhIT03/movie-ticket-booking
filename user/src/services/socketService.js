import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const baseURL = 'http://localhost:3000';
    this.socket = io(`${baseURL}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Socket connected');
      // Đảm bảo auth được gửi lại khi connect
      if (token) {
        this.socket.auth = { token };
      }
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      this.isConnected = false;
      console.error('❌ Socket connection error:', error);
    });

    this.socket.on('reconnect', () => {
      this.isConnected = true;
      console.log('✅ Socket reconnected');
      // Re-authenticate khi reconnect
      if (token) {
        this.socket.auth = { token };
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinTheater(theaterId) {
    if (this.socket?.connected) {
      this.socket.emit('join_theater', { theaterId });
    }
  }

  sendMessage(theaterId, message, imageUrl = null) {
    // Kiểm tra và đợi socket kết nối
    if (!this.socket) {
      return Promise.reject(new Error('Socket not initialized. Please connect first.'));
    }

    if (!this.socket.connected) {
      console.warn('⚠️ Socket not connected, waiting for connection...');
      return new Promise((resolve, reject) => {
        // Đợi socket kết nối
        this.socket.once('connect', () => {
          this.socket.emit('send_message', { theaterId, message, imageUrl }, (response) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          });
        });

        // Timeout sau 5 giây
        setTimeout(() => {
          if (!this.socket?.connected) {
            reject(new Error('Socket connection timeout. Please check your connection.'));
          }
        }, 5000);
      });
    }

    // Socket đã kết nối, gửi ngay
    return new Promise((resolve, reject) => {
      this.socket.emit('send_message', { theaterId, message, imageUrl }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  markRead(theaterId) {
    if (this.socket?.connected) {
      this.socket.emit('mark_read', { theaterId });
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
      console.log('Socket: new_message listener registered');
    }
  }

  offNewMessage(callback) {
    if (this.socket) {
      this.socket.off('new_message', callback);
      console.log('Socket: new_message listener removed');
    }
  }

  onAccountBlocked(callback) {
    if (this.socket) {
      this.socket.on('account_blocked', callback);
      console.log('Socket: account_blocked listener registered');
    }
  }

  offAccountBlocked(callback) {
    if (this.socket) {
      this.socket.off('account_blocked', callback);
      console.log('Socket: account_blocked listener removed');
    }
  }
}

const socketService = new SocketService();
export default socketService;

