import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { updateInfo } from "../../../../redux/counterSlice/userSlice";
import axiosClient from "../../../../services/axiosClient";
import Header from "../../../../shared/layout/Header/Header.jsx";
import Footer from "../../../../shared/layout/Footer/Footer.jsx";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState("profile"); // "profile" hoặc "password"
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  
  // Password change
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

  useEffect(() => {
    // Kiểm tra đăng nhập
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    // Load thông tin user
    loadUserInfo();
  }, [navigate]);

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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert("Vui lòng chọn file ảnh");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Kích thước ảnh không được vượt quá 5MB");
        return;
      }

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
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
      // Email không được thay đổi, không gửi lên server
      if (phone) formData.append("phone", phone);
      if (address) formData.append("address", address);
      
      // Nếu có file mới được chọn
      const fileInput = fileInputRef.current;
      if (fileInput && fileInput.files[0]) {
        formData.append("file", fileInput.files[0]);
      } else if (avatarPreview && avatarPreview.startsWith('data:')) {
        // Nếu là base64 từ preview, không gửi (giữ nguyên avatar cũ)
      } else if (avatarPreview) {
        formData.append("avatar", avatarPreview);
      }

      const res = await axiosClient.put("/users/me", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        validateStatus: () => true,
      });

      if (res.status === 200 || res.status === 201) {
        // Cập nhật thông tin trong localStorage
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

        alert("Cập nhật thông tin thành công!");
      } else {
        alert(res.data.message || "Cập nhật thông tin thất bại");
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
        setActiveTab("profile");
      } else {
        alert(res.data.message || "Đổi mật khẩu thất bại");
      }
    } catch (error) {
      alert("Server lỗi, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
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
              onClick={() => setActiveTab("profile")}
            >
              Thông tin cá nhân
            </button>
            <button
              className={`tab-button ${activeTab === "password" ? "active" : ""}`}
              onClick={() => setActiveTab("password")}
            >
              Đổi mật khẩu
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
                      Chọn ảnh
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
                        Xóa ảnh
                      </button>
                    )}
                  </div>
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
                <button type="button" className="cancel-button" onClick={() => setActiveTab("profile")}>
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
