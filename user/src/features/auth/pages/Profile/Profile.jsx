import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { updateInfo } from "../../../../redux/counterSlice/userSlice";
import axiosClient from "../../../../services/axiosClient";
import bookingService from "../../../../services/bookings/bookingService";
import Header from "../../../../shared/layout/Header/Header.jsx";
import Footer from "../../../../shared/layout/Footer/Footer.jsx";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState("profile"); 
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [ticketFilters, setTicketFilters] = useState({
    status: "ALL",
    page: 1,
    limit: 5,
  });
  const [ticketData, setTicketData] = useState({
    items: [],
    total: 0,
    totalPages: 0,
    page: 1,
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    loadUserInfo();
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && ["profile", "password", "history"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    if (activeTab !== "history") return;
    fetchTicketHistory(ticketFilters.page, ticketFilters.status);
  }, [activeTab, ticketFilters.page, ticketFilters.status]);

  const loadUserInfo = async () => {
    try {
      const savedUser = localStorage.getItem("infoState");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.user) {
          setFirstName(userData.user.firstName || "");
          setLastName(userData.user.lastName || "");
          setEmail(userData.user.email || "");
          setPhone(userData.user.phone || "");
          setAddress(userData.user.address || "");
          setAvatar(userData.user.avatar || "");
          setAvatarPreview(userData.user.avatar || "");
        }
      }
      setIsLoadingData(false);
    } catch (e) {
      console.error("Error loading user info:", e);
      setIsLoadingData(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra loại file
      if (!file.type.startsWith('image/')) {
        alert("Vui lòng chọn file ảnh (JPG, PNG, GIF, etc.)");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      
      // Kiểm tra kích thước file (tối đa 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Kích thước ảnh không được vượt quá 5MB");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Hiển thị preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.onerror = () => {
        alert("Lỗi khi đọc file ảnh");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
     
      if (phone) formData.append("phone", phone);
      if (address) formData.append("address", address);
 
      // Upload file ảnh mới nếu có
      const fileInput = fileInputRef.current;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        formData.append("file", fileInput.files[0]);
      } else if (avatarPreview && avatarPreview.startsWith('data:')) {
        // Nếu là base64 từ preview, không gửi (chờ user chọn file mới)
        // Hoặc có thể convert base64 thành file nếu cần
      } else if (avatarPreview && !avatarPreview.startsWith('data:')) {
        // Nếu là URL từ server, giữ nguyên
        formData.append("avatar", avatarPreview);
      }

      const res = await axiosClient.put("/users/me", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        validateStatus: () => true,
      });

      if (res.status === 200 || res.status === 201) {
        // Cập nhật thông tin user trong localStorage
        const savedUser = localStorage.getItem("infoState");
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          userData.user = { ...userData.user, ...res.data };
          localStorage.setItem("infoState", JSON.stringify(userData));
          dispatch(updateInfo(userData));
          
          // Cập nhật avatar preview
          if (res.data.avatar) {
            setAvatar(res.data.avatar);
            setAvatarPreview(res.data.avatar);
          }
        }

        // Reset file input sau khi upload thành công
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        alert("Cập nhật thông tin thành công!");
      } else {
        alert(res.data?.message || "Cập nhật thông tin thất bại");
      }
    } catch (error) {
      alert("Server lỗi, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }

    if (newPassword.length < 8) {
      alert("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }

    setIsLoading(true);

    try {
      const res = await axiosClient.post("/users/change-password", {
        currentPassword,
        newPassword,
      }, {
        validateStatus: () => true,
      });

      if (res.status === 200 || res.status === 201) {
        alert("Đổi mật khẩu thành công!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        handleTabChange("profile");
      } else {
        alert(res.data.message || "Đổi mật khẩu thất bại");
      }
    } catch (error) {
      alert("Server lỗi, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set("tab", tab);
    navigate(`/profile?${params.toString()}`, { replace: true });
  };

  const fetchTicketHistory = async (page = 1, status = "ALL") => {
    setIsLoadingTickets(true);
    setTicketError("");
    try {
      const params = {
        page,
        limit: ticketFilters.limit,
      };
      if (status && status !== "ALL") {
        params.status = status;
      }
      const res = await bookingService.getMyTickets(params);
      if (res.status === 200) {
        const data = res.data || {};
        setTicketData({
          items: data.items || [],
          total: data.total || 0,
          totalPages: data.totalPages || 0,
          page: data.page || page,
        });
      } else {
        setTicketError(res.data?.message || "Không thể tải lịch sử đặt vé");
        setTicketData((prev) => ({ ...prev, items: [] }));
      }
    } catch (error) {
      setTicketError("Không thể tải lịch sử đặt vé. Vui lòng thử lại sau.");
      setTicketData((prev) => ({ ...prev, items: [] }));
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleChangeTicketStatus = (value) => {
    setTicketFilters((prev) => ({
      ...prev,
      status: value,
      page: 1,
    }));
  };

  const handleChangeTicketPage = (nextPage) => {
    setTicketFilters((prev) => ({
      ...prev,
      page: nextPage,
    }));
  };

  const statusLabelMap = {
    BOOKED: "Đã thanh toán",
    PENDING: "Chờ thanh toán",
    CANCELLED: "Đã hủy",
    FAILED: "Thanh toán thất bại",
  };

  const deriveTicketStatus = (ticket) => {
    if (ticket.status) return ticket.status;
    const payments = ticket.payments || [];

    if (payments.some((p) => p.payment_status === "COMPLETED")) {
      return "BOOKED";
    }
    if (payments.some((p) => p.payment_status === "CANCELLED")) {
      return "CANCELLED";
    }
    if (payments.some((p) => p.payment_status === "FAILED")) {
      return "FAILED";
    }
    if (payments.some((p) => p.payment_status === "PENDING")) {
      return "PENDING";
    }

    return payments.length === 0 ? "PENDING" : null;
  };

  const getTicketStatusLabel = (ticket) => {
    const status = deriveTicketStatus(ticket);
    return status ? statusLabelMap[status] || status : "Không xác định";
  };

  const renderTicketStatus = (ticket) => {
    const status = deriveTicketStatus(ticket);
    const badgeClass = status ? status.toLowerCase() : "unknown-status";
    return (
      <span className={`ticket-status-badge ${badgeClass}`}>
        {getTicketStatusLabel(ticket)}
      </span>
    );
  };

  const formatCurrency = (value) => {
    if (typeof value !== "number") return "—";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderTicketCard = (ticket) => {
    const showtime = ticket.showtime || {};
    const movie = showtime.movie || {};
    const screen = showtime.screen || {};
    const theater = screen.theater || {};
    const seats = (ticket.bookingSeats || []).map((item) => item?.seat?.seatNumber || item?.seat?.seat_number).filter(Boolean);
    const startTime = showtime.startTime ? new Date(showtime.startTime).toLocaleString("vi-VN") : "—";
    return (
      <div key={ticket.id} className="ticket-card">
          <div className="ticket-card__header">
          <div>
            <p className="ticket-code">Mã vé: BK-{String(ticket.id).padStart(6, "0")}</p>
            <h4>{movie.title || "Tên phim chưa cập nhật"}</h4>
          </div>
          {renderTicketStatus(ticket)}
        </div>
        <div className="ticket-card__body">
          <div>
            <span className="label">Suất chiếu</span>
            <p>{startTime}</p>
          </div>
          <div>
            <span className="label">Rạp</span>
            <p>
              {theater.name
                ? theater.name
                : screen.name
                ? `Phòng ${screen.name}`
                : "Không xác định"}
            </p>
          </div>
          <div>
            <span className="label">Ghế</span>
            <p>{seats.length > 0 ? seats.join(", ") : "Chưa cập nhật"}</p>
          </div>
          <div>
            <span className="label">Tổng tiền</span>
            <p>{formatCurrency(ticket.totalPriceMovie)}</p>
          </div>
        </div>
      </div>
    );
  };

  if (isLoadingData) {
    return (
      <div>
        <Header />
        <div className="profile-loading">Đang tải...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="profile-container">
        <div className="profile-form-wrapper">
          <div className="profile-header">
            <h2>Tài khoản của tôi</h2>
            <button className="back-button" onClick={() => navigate("/")}>
              ← Quay lại
            </button>
          </div>

          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => handleTabChange("profile")}
            >
              Thông tin cá nhân
            </button>
            <button
              className={`tab-button ${activeTab === "password" ? "active" : ""}`}
              onClick={() => handleTabChange("password")}
            >
              Đổi mật khẩu
            </button>
            <button
              className={`tab-button ${activeTab === "history" ? "active" : ""}`}
              onClick={() => handleTabChange("history")}
            >
              Lịch sử đặt vé
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="profile-form">
              {/* Avatar Upload */}
              <div className="form-group avatar-group">
                <label>Ảnh đại diện</label>
                <div className="avatar-upload-container">
                  <div className="avatar-preview">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        <span>Chưa có ảnh</span>
                      </div>
                    )}
                  </div>
                  <div className="avatar-actions">
                    <button
                      type="button"
                      className="upload-button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📷 Cập nhật ảnh đại diện
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => {
                          setAvatarPreview("");
                          setAvatar("");
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        🗑️ Xóa ảnh
                      </button>
                    )}
                  </div>
                  <p className="form-hint" style={{ marginTop: "8px", textAlign: "center" }}>
                    Chọn ảnh JPG, PNG hoặc GIF (tối đa 5MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: "none" }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Họ</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tên</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    className="disabled-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Địa chỉ</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? "Đang cập nhật..." : "Cập nhật thông tin"}
                </button>
                <button type="button" className="cancel-button" onClick={() => navigate("/")}>
                  Hủy
                </button>
              </div>
            </form>
          )}

          {/* Password Change Tab */}
          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} className="profile-form">
              <div className="form-group">
                <label>Mật khẩu hiện tại</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                  >
                    {showPassword.current ? <FiEye size={20} /> : <FiEyeOff size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Mật khẩu mới</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                  >
                    {showPassword.new ? <FiEye size={20} /> : <FiEyeOff size={20} />}
                  </button>
                </div>
                <small className="form-hint">Mật khẩu phải có ít nhất 8 ký tự</small>
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu mới</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                  >
                    {showPassword.confirm ? <FiEye size={20} /> : <FiEyeOff size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                </button>
                <button type="button" className="cancel-button" onClick={() => handleTabChange("profile")}>
                  Hủy
                </button>
              </div>
            </form>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="ticket-history">
              <div className="history-filters">
                <div className="history-filter">
                  <label>Trạng thái</label>
                  <select
                    value={ticketFilters.status}
                    onChange={(e) => handleChangeTicketStatus(e.target.value)}
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="BOOKED">Đã thanh toán</option>
                    <option value="PENDING">Chờ thanh toán</option>
                    <option value="FAILED">Thanh toán thất bại</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>
                <div className="history-summary">
                  Đã tìm thấy {ticketData.total} vé
                </div>
              </div>

              {isLoadingTickets ? (
                <div className="history-loading">Đang tải lịch sử đặt vé...</div>
              ) : ticketError ? (
                <div className="history-error">{ticketError}</div>
              ) : ticketData.items.length === 0 ? (
                <div className="history-empty">
                  Bạn chưa có vé nào. Hãy đặt vé để trải nghiệm những bộ phim mới nhất!
                </div>
              ) : (
                <div className="ticket-list">
                  {ticketData.items.map((ticket) => renderTicketCard(ticket))}
                </div>
              )}

              {ticketData.totalPages > 1 && (
                <div className="history-pagination">
                  <button
                    onClick={() => handleChangeTicketPage(ticketData.page - 1)}
                    disabled={ticketData.page <= 1 || isLoadingTickets}
                  >
                    Trước
                  </button>
                  <span>
                    Trang {ticketData.page} / {ticketData.totalPages}
                  </span>
                  <button
                    onClick={() => handleChangeTicketPage(ticketData.page + 1)}
                    disabled={
                      ticketData.page >= ticketData.totalPages || isLoadingTickets
                    }
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
