import { useEffect } from 'react';
import socketService from '../services/socketService';


export default function AccountBlockListener() {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
  
    if (!token) {
      return;
    }

    socketService.connect(token);

    const handleAccountBlocked = (data) => {
      console.warn('⚠️ Account blocked event received:', data);
      
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('infoState');
      localStorage.removeItem('userEmail');
      
      
      socketService.disconnect();
      
      
      alert(data.message || 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
      
     
      window.location.href = '/';
    };

   
    socketService.onAccountBlocked(handleAccountBlocked);

    
    return () => {
      socketService.offAccountBlocked(handleAccountBlocked);
    };
  }, []);

 
  return null;
}

