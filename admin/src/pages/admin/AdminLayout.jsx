import React from "react";
import { User, LogOut, Film, Monitor, Building, Ticket, Calendar, Armchair, PartyPopper, Tags, Newspaper, CreditCard, Grid, Gift, Mail, Image as ImageIcon} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import "./AdminLayout.css";

export default function AdminLayout({ onLogout }) {
    const location = useLocation();
    const activePage = location.pathname.split("/").pop();

    return (
        <>
            <div className="admin-layout">
                {/* Sidebar */}
                <aside className="admin-sidebar">
                    <h2 className="admin-logo">🎬 NCC Cinema</h2>

                    <nav className="admin-nav">
                        <Link
                            to="/admin/dashboard"
                            className={activePage === "dashboard" ? "active" : ""}
                        >
                            <Monitor size={18} />
                            <span>Dashboard</span>
                        </Link>

                        <Link
                            to="/admin/movies"
                            className={activePage === "movies" ? "active" : ""}
                        >
                            <Film size={18} />
                            <span>Quản lý phim</span>
                        </Link>

                        {/* ✅ Nút mới: Quản lý phòng chiếu */}
                        <Link
                            to="/admin/screens"
                            className={activePage === "screens" ? "active" : ""}
                        >
                            <Monitor size={18} />
                            <span>Quản lý phòng chiếu</span>
                        </Link>

                        <Link
                            to="/admin/users"
                            className={activePage === "users" ? "active" : ""}
                        >
                            <User size={18} />
                            <span>Quản lý người dùng</span>
                        </Link>

                        <Link
                            to="/admin/threaters"
                            className={activePage === "threaters" ? "active" : ""}
                        >
                            <Building size={18} />
                            <span>Quản lý rạp phim</span>
                        </Link>

                        <Link
                            to="/admin/showtimes"
                            className={activePage === "showtimes" ? "active" : ""}
                        >
                            <Calendar size={18} />
                            <span>Quản lý lịch chiếu</span>
                        </Link>

                        <Link
                            to="/admin/tickets"
                            className={activePage === "tickets" ? "active" : ""}
                        >
                            <Ticket size={18} />
                            <span>Quản lý vé</span>
                        </Link>

                        <Link
                            to="/admin/seat_booking_view"
                            className={activePage === "seat_booking_view" ? "active" : ""}
                        >
                            <Grid size={18} />
                            <span>Xem sơ đồ ghế đặt chỗ</span>
                        </Link>

                        <Link
                            to="/admin/seats"
                            className={activePage === "seats" ? "active" : ""}
                        >
                            <Armchair size={18} />
                            <span>Quản lý ghế ngồi</span>
                        </Link>

                        <Link
                            to="/admin/genres"
                            className={activePage === "genres" ? "active" : ""}
                        >
                            <Tags size={18} />
                            <span>Quản lý thể loại phim</span>
                        </Link>

                        <Link
                            to="/admin/festivals"
                            className={activePage === "festivals" ? "active" : ""}
                        >
                            <PartyPopper size={18} />
                            <span>Quản lý lễ hội</span>
                        </Link>

                        <Link
                            to="/admin/news"
                            className={activePage === "news" ? "active" : ""}
                        >
                            <Newspaper size={18} />
                            <span>Quản lý tin tức</span>
                        </Link>

                        <Link
                            to="/admin/banners"
                            className={activePage === "banners" ? "active" : ""}
                        >
                            <ImageIcon size={18} />
                            <span>Quản lý banner</span>
                        </Link>

                        <Link
                            to="/admin/ticket_price"
                            className={activePage === "ticket_price" ? "active" : ""}
                        >
                            <Ticket size={18} />
                            <span>Quản lý giá vé</span>
                        </Link>

                        <Link
                            to="/admin/promotions"
                            className={activePage === "promotions" ? "active" : ""}
                        >
                            <Gift size={18} />
                            <span>Quản lý khuyến mãi</span>
                        </Link>

                        <Link
                            to="/admin/payment"
                            className={activePage === "payment" ? "active" : ""}
                        >
                            <CreditCard size={18} />
                            <span>Quản lý thanh toán</span>
                        </Link>

                        <Link
                            to="/admin/email-notifications"
                            className={activePage === "email-notifications" ? "active" : ""}
                        >
                            <Mail size={18} />
                            <span>Quản lý Email & Thông báo</span>
                        </Link>
                    </nav>

                    <div className="admin-user">
                        <div className="user-info">
                            <User size={18} />
                            <div>
                                <p>Admin</p>
                                <small>ID: NCC-001</small>
                            </div>
                        </div>
                        <button className="logout-btn" onClick={onLogout}>
                            <LogOut size={16} /> <span>Đăng xuất</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="admin-main">
                    <Outlet />
                </main>
            </div>
        </>
    );
}
