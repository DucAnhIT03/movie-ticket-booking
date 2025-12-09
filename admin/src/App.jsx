import React, { useEffect } from "react";
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
import EventManagement from "./pages/admin/EventManagement";
import Profile from "./pages/admin/Profile";
import ChatManagement from "./pages/admin/ChatManagement";
import ChatWidget from "./components/ChatWidget";
import "./App.css";

function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const getStoredUser = () => {
    const raw = localStorage.getItem("adminUser");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error("Failed to parse adminUser from storage:", error);
      return null;
    }
  };

  const hasBackofficeRole = (roles = []) =>
    roles.includes("ROLE_ADMIN") || roles.includes("ROLE_EMPLOYEE");

  useEffect(() => {
    const loggedIn = localStorage.getItem("adminIsLoggedIn");
    const token = localStorage.getItem("adminAccessToken");
    if (loggedIn && token) {
      // no-op: just ensuring state persists after refresh
    }
  }, []);

  const handleLogout = () => {

    localStorage.removeItem("adminIsLoggedIn");
    localStorage.removeItem("adminAccessToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("infoState");
    
    
    dispatch(clearInfo());
   
    toast.info("Đã đăng xuất!");
    navigate("/login");
  };

  
  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("adminAccessToken");
    const loggedIn = localStorage.getItem("adminIsLoggedIn");
    const storedUser = getStoredUser();
    const roleList = Array.isArray(storedUser?.roles) ? storedUser.roles : [];
    
    if (!token || !loggedIn) {
      return <Navigate to="/login" replace />;
    }

    if (!hasBackofficeRole(roleList)) {
      localStorage.removeItem("adminIsLoggedIn");
      localStorage.removeItem("adminAccessToken");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("infoState");
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };

  
  const HomeRedirect = () => {
    const token = localStorage.getItem("adminAccessToken");
    const loggedIn = localStorage.getItem("adminIsLoggedIn");
    const storedUser = getStoredUser();
    const roleList = Array.isArray(storedUser?.roles) ? storedUser.roles : [];
    
    if (token && loggedIn) {
      if (roleList.includes("ROLE_ADMIN")) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      if (roleList.includes("ROLE_EMPLOYEE")) {
        return <Navigate to="/admin/seat_booking_view" replace />;
      }
    }
    return <Navigate to="/login" replace />;
  };

  const RoleRoute = ({ element, allowedRoles }) => {
    const storedUser = getStoredUser();
    const roleList = Array.isArray(storedUser?.roles) ? storedUser.roles : [];
    const canAccess = allowedRoles.some((role) => roleList.includes(role));
    if (!canAccess) {
      const fallback = roleList.includes("ROLE_EMPLOYEE") ? "/admin/seat_booking_view" : "/login";
      return <Navigate to={fallback} replace />;
    }
    return element;
  };

  const shouldShowChatWidget = () => {
    const storedUser = getStoredUser();
    const roleList = Array.isArray(storedUser?.roles) ? storedUser.roles : [];
    // Chỉ hiển thị cho nhân viên, ẩn với admin
    return roleList.includes("ROLE_EMPLOYEE") && !roleList.includes("ROLE_ADMIN");
  };

  return (
    <div className="container">
      <div className="main-content">
        {shouldShowChatWidget() && <ChatWidget />}
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
            <Route
              index
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<Dashboard />} />}
            />
            <Route
              path="dashboard"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<Dashboard />} />}
            />
            <Route
              path="movies"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<MovieManagement />} />}
            />
            <Route
              path="screens"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<ScreenManagement />} />}
            />
            <Route
              path="users"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<UserManagement />} />}
            />
            <Route
              path="threaters"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<ThreaterManagement />} />}
            />
            <Route
              path="genres"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<GenreManagement />} />}
            />
            <Route
              path="showtimes"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<ShowtimeManagement />} />}
            />
            <Route
              path="tickets"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<TicketManagement />} />}
            />
            <Route
              path="seats"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<SeatManagement />} />}
            />
            <Route
              path="seat_booking_view"
              element={
                <RoleRoute
                  allowedRoles={['ROLE_ADMIN', 'ROLE_EMPLOYEE']}
                  element={<SeatBookingView />}
                />
              }
            />
            <Route
              path="festivals"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<FestivalManagement />} />}
            />
            <Route
              path="events"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<EventManagement />} />}
            />
            <Route
              path="news"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<NewsManagement />} />}
            />
            <Route
              path="ticket_price"
              element={
                <RoleRoute allowedRoles={['ROLE_ADMIN']} element={<TicketPriceManagement />} />
              }
            />
            <Route
              path="payment"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<PaymentManagement />} />}
            />
            <Route
              path="promotions"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<PromotionManagement />} />}
            />
            <Route
              path="banners"
              element={<RoleRoute allowedRoles={['ROLE_ADMIN']} element={<BannerManagement />} />}
            />
            <Route
              path="email-notifications"
              element={
                <RoleRoute
                  allowedRoles={['ROLE_ADMIN']}
                  element={<EmailNotificationManagement />}
                />
              }
            />
            <Route
              path="profile"
              element={
                <RoleRoute
                  allowedRoles={['ROLE_ADMIN', 'ROLE_EMPLOYEE']}
                  element={<Profile />}
                />
              }
            />
            <Route
              path="chat-management"
              element={
                <RoleRoute
                  allowedRoles={['ROLE_ADMIN']}
                  element={<ChatManagement />}
                />
              }
            />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

export default App;




