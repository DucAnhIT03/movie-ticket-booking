import axios from "axios";

// Lấy base URL từ env (Vite). Tránh dùng process.env trên browser.
const apiBaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:3000";

const axiosClient = axios.create({
  baseURL: apiBaseUrl.replace(/\/$/, ""), // bỏ trailing slash để tránh double slash
  headers: {
    "Content-Type": "application/json",
    // Bypass ngrok browser warning page to nhận JSON thay vì HTML interstitial
    "ngrok-skip-browser-warning": "true",
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  // Nếu gửi FormData, để trình duyệt tự set boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export default axiosClient;

