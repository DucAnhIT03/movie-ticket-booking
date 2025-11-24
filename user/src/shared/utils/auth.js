/**
 * Kiểm tra xem user đã đăng nhập chưa
 * @returns {boolean} true nếu đã đăng nhập, false nếu chưa
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem("accessToken");
  return !!token; // Trả về true nếu có token, false nếu không có
};

/**
 * Lấy token từ localStorage
 * @returns {string|null} 
 */
export const getToken = () => {
  return localStorage.getItem("accessToken");
};

