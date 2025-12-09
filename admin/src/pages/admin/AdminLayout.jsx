import React from "react";
import {
  User,
  LogOut,
  Film,
  Monitor,
  Building,
  Ticket,
  Calendar,
  Armchair,
  PartyPopper,
  Tags,
  Newspaper,
  Grid,
  Gift,
  Mail,
  Image as ImageIcon,
  CalendarClock,
  MessageSquare,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import "./AdminLayout.css";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: Monitor, roles: ["ROLE_ADMIN"] },
  { to: "/admin/movies", label: "Quản lý phim", icon: Film, roles: ["ROLE_ADMIN"] },
  { to: "/admin/screens", label: "Quản lý phòng chiếu", icon: Monitor, roles: ["ROLE_ADMIN"] },
  { to: "/admin/users", label: "Quản lý người dùng", icon: User, roles: ["ROLE_ADMIN"] },
  { to: "/admin/threaters", label: "Quản lý rạp phim", icon: Building, roles: ["ROLE_ADMIN"] },
  { to: "/admin/showtimes", label: "Quản lý lịch chiếu", icon: Calendar, roles: ["ROLE_ADMIN"] },
  { to: "/admin/tickets", label: "Quản lý thông tin vé đã đặt", icon: Ticket, roles: ["ROLE_ADMIN"] },
  {
    to: "/admin/seat_booking_view",
    label: "Xem sơ đồ ghế đặt chỗ",
    icon: Grid,
    roles: ["ROLE_ADMIN", "ROLE_EMPLOYEE"],
  },
  { to: "/admin/seats", label: "Quản lý ghế ngồi", icon: Armchair, roles: ["ROLE_ADMIN"] },
  { to: "/admin/genres", label: "Quản lý thể loại phim", icon: Tags, roles: ["ROLE_ADMIN"] },
  { to: "/admin/festivals", label: "Quản lý lễ hội", icon: PartyPopper, roles: ["ROLE_ADMIN"] },
  { to: "/admin/events", label: "Quản lý sự kiện", icon: CalendarClock, roles: ["ROLE_ADMIN"] },
  { to: "/admin/news", label: "Quản lý tin tức", icon: Newspaper, roles: ["ROLE_ADMIN"] },
  { to: "/admin/banners", label: "Quản lý banner", icon: ImageIcon, roles: ["ROLE_ADMIN"] },
  { to: "/admin/ticket_price", label: "Quản lý giá vé", icon: Ticket, roles: ["ROLE_ADMIN"] },
  { to: "/admin/promotions", label: "Quản lý khuyến mãi", icon: Gift, roles: ["ROLE_ADMIN"] },
  {
    to: "/admin/email-notifications",
    label: "Quản lý Email & Thông báo",
    icon: Mail,
    roles: ["ROLE_ADMIN"],
  },
  {
    to: "/admin/chat-management",
    label: "Quản lý Chat",
    icon: MessageSquare,
    roles: ["ROLE_ADMIN"],
  },
];

const getStoredUser = () => {
  const raw = localStorage.getItem("adminUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse admin user:", error);
    return null;
  }
};

export default function AdminLayout({ onLogout }) {
  const location = useLocation();
  const currentUser = getStoredUser();
  const roleList = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.roles ? item.roles.some((role) => roleList.includes(role)) : true
  );

  const getDisplayName = () => {
    if (!currentUser) return "Tài khoản";
    if (currentUser.firstName || currentUser.lastName) {
      return `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim();
    }
    return currentUser.email || "Tài khoản";
  };

  const getDisplayRole = () => {
    if (roleList.includes("ROLE_ADMIN")) return "Quản trị viên";
    if (roleList.includes("ROLE_EMPLOYEE")) return "Nhân viên";
    return "Người dùng";
  };

  const isActive = (path) => {
    if (location.pathname === path) return true;
    return location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <h2 className="admin-logo">🎬 NCC Cinema</h2>

          <nav className="admin-nav">
            {visibleNavItems.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={isActive(to) ? "active" : ""}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="admin-user">
            <Link to="/admin/profile" className="user-info-link">
              <div className="user-info">
                {currentUser?.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt="Avatar" 
                    className="user-avatar-small"
                  />
                ) : (
                  <User size={18} />
                )}
                <div>
                  <p>{getDisplayName()}</p>
                  <small>{getDisplayRole()}</small>
                </div>
              </div>
            </Link>
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={16} /> <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </>
  );
}
