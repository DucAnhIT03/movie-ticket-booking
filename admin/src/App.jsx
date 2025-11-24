import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { clearInfo } from "./redux/counterSlice/userSlice";
import Login from "./auth/Login";
// import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import MovieManagement from "./pages/admin/MovieManagement";
import ScreenManagement from "./pages/admin/ScreenManagement";
import UserManagement from "./pages/admin/UserManagement";
import Dashboard from "./pages/admin/Dashboard";
import ThreaterManagement from "./pages/admin/ThreaterManagement";
import GenreManagement from "./pages/admin/GenreManagement";
import ShowtimeManagement from "./pages/admin/ShowtimeManagement";
import TicketManagement from "./pages/admin/TicketManagement";
import SeatManagement from "./pages/admin/SeatManagement";
import SeatBookingView from "./pages/admin/SeatBookingView";
import FestivalManagement from "./pages/admin/FestivalManagement";
import NewsManagement from "./pages/admin/NewsManagement";
import TicketPriceManagement from "./pages/admin/TicketPriceManagement";
import PaymentManagement from "./pages/admin/PaymentManagement";
import PromotionManagement from "./pages/admin/PromotionManagement";
import EmailNotificationManagement from "./pages/admin/EmailNotificationManagement";
import BannerManagement from "./pages/admin/BannerManagement";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const loggedIn = localStorage.getItem("adminIsLoggedIn");
    const token = localStorage.getItem("adminAccessToken");
    if (loggedIn && token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem("adminIsLoggedIn", "true");
    setIsLoggedIn(true);
    toast.success("Đăng nhập thành công 🎉");
    navigate("/admin/dashboard");
  };

  const handleLogout = () => {
    // Xóa tất cả dữ liệu localStorage của admin
    localStorage.removeItem("adminIsLoggedIn");
    localStorage.removeItem("adminAccessToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("infoState");
    
    // Xóa Redux state
    dispatch(clearInfo());
    
    // Cập nhật state
    setIsLoggedIn(false);
    
    // Thông báo và redirect
    toast.info("Đã đăng xuất!");
    navigate("/login");
  };

  // Component để kiểm tra và redirect
  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("adminAccessToken");
    const loggedIn = localStorage.getItem("adminIsLoggedIn");
    
    if (!token || !loggedIn) {
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };

  // Component để redirect từ "/" 
  const HomeRedirect = () => {
    const token = localStorage.getItem("adminAccessToken");
    const loggedIn = localStorage.getItem("adminIsLoggedIn");
    
    if (token && loggedIn) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  };

  return (
    <div className="container">
      {/* {isLoggedIn && <Sidebar onLogout={handleLogout} />} */}

      <div className="main-content">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminLayout onLogout={handleLogout} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="movies" element={<MovieManagement />} />
            <Route path="screens" element={<ScreenManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="threaters" element={<ThreaterManagement />} />
            <Route path="genres" element={<GenreManagement />} />
            <Route path="showtimes" element={<ShowtimeManagement />} />
            <Route path="tickets" element={<TicketManagement />} />
            <Route path="seats" element={<SeatManagement />} />
            <Route path="seat_booking_view" element={<SeatBookingView />} />
            <Route path="festivals" element={<FestivalManagement />} />
            <Route path="news" element={<NewsManagement />} />
            <Route path="ticket_price" element={<TicketPriceManagement />} />
            <Route path="payment" element={<PaymentManagement />} />
            <Route path="promotions" element={<PromotionManagement />} />
            <Route path="banners" element={<BannerManagement />} />
            <Route path="email-notifications" element={<EmailNotificationManagement />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

export default App;




