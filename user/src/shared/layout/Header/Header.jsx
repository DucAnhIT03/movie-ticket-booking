import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loadInfo } from "../../../redux/counterSlice/userSlice";
import { FaBell } from "react-icons/fa";
import NotificationModal from "../../../features/notifications/components/NotificationModal";
import promotionService from "../../../services/promotions/promotionService";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập
    const token = localStorage.getItem("accessToken");
    const savedUser = localStorage.getItem("infoState");
    
    if (token) {
      setIsLoggedIn(true);
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setUserInfo(user);
          dispatch(loadInfo());
        } catch (e) {
          console.error("Error parsing user info:", e);
        }
      }
      // Load số lượng thông báo
      loadNotificationCount();
    }
  }, [dispatch]);

  const loadNotificationCount = async () => {
    try {
      const response = await promotionService.getMyNotifications();
      if (response.status === 200) {
        const notifications = response.data || [];
        setNotificationCount(notifications.length);
      }
    } catch (error) {
      console.error("Error loading notification count:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("infoState");
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    setUserInfo(null);
    navigate("/");
    window.location.reload(); // Reload để cập nhật UI
  };

  return (
    <div className="header">
      <div className="menu">
        <div className="logo-group">
          <img src="/src/assets/logo.png" alt="logo" />
          <div className="cinema-text">
            <p className="vn">TRUNG TÂM CHIẾU PHIM QUỐC GIA</p>
            <p className="en">National Cinema Center</p>
          </div>
        </div>
        <nav className={`nav ${isOpen ? "open" : ""}`}>
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={() => setIsOpen(false)}
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/calendar"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={() => setIsOpen(false)}
          >
            Lịch chiếu
          </NavLink>
          <NavLink
            to="/news"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={() => setIsOpen(false)}
          >
            Tin tức
          </NavLink>
          <NavLink
            to="/promotion"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={() => setIsOpen(false)}
          >
            Khuyến mãi
          </NavLink>
          <NavLink
            to="/events"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={() => setIsOpen(false)}
          >
            Sự kiện
          </NavLink>
          <NavLink
            to="/ticket-price"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={() => setIsOpen(false)}
          >
            Giá vé
          </NavLink>
          <NavLink
            to="/festival"
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={() => setIsOpen(false)}
          >
            Liên hoan phim
          </NavLink>
        </nav>
      </div>

      {isLoggedIn ? (
        <div className="btn user-info">
          {/* Nút thông báo */}
          <div 
            className="notification-icon-container"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowNotifications(true);
            }}
            title="Thông báo"
          >
            <FaBell size={20} />
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </div>

          <div 
            className="user-name-container"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowUserMenu(!showUserMenu);
            }}
          >
            <span className="user-name">
              Xin chào, {userInfo?.user?.firstName || userInfo?.userEmail || "User"}
            </span>
            <span className={`dropdown-arrow ${showUserMenu ? 'open' : ''}`}>▼</span>
          </div>
          {showUserMenu && (
            <div 
              className="user-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="dropdown-item"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowNotifications(true);
                  setShowUserMenu(false);
                }}
              >
                <FaBell size={16} style={{ marginRight: "8px" }} />
                Thông báo
                {notificationCount > 0 && (
                  <span className="notification-count-badge">{notificationCount}</span>
                )}
              </div>
              <div 
                className="dropdown-item"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate("/profile");
                  setShowUserMenu(false);
                }}
              >
                Chỉnh sửa thông tin
              </div>
              <div 
                className="dropdown-item"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate("/profile?tab=history");
                  setShowUserMenu(false);
                }}
              >
                Lịch sử đặt vé
              </div>
              <div 
                className="dropdown-item logout-item"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogout();
                  setShowUserMenu(false);
                }}
              >
                Đăng xuất
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="btn">
          <button
            className="register"
            onClick={() => navigate("/register")}
          >
            Đăng ký
          </button>
          <button className="login" onClick={() => navigate("/login")}>
            Đăng nhập
          </button>
        </div>
      )}

      {/* ICON 3 GẠCH */}
      <div
        className={`hamburger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Lớp nền mờ khi mở sidebar */}
      {isOpen && (
        <div className="overlay" onClick={() => setIsOpen(false)}></div>
      )}
      
      {/* Lớp nền mờ khi mở user menu - chỉ hiển thị overlay, không che toàn màn hình */}
      {showUserMenu && (
        <div 
          className="user-menu-overlay" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowUserMenu(false);
          }}
        ></div>
      )}

      {/* Modal thông báo */}
      <NotificationModal
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          loadNotificationCount(); // Reload số lượng sau khi đóng
        }}
      />
    </div>
  );
}
