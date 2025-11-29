import React, { useState, useEffect, useRef } from "react";
import { User, Camera, X } from "lucide-react";
import { toast } from "react-toastify";
import axiosClient from "../../services/axiosClient";
import "./Profile.css";

export default function Profile() {
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
  });
  
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setIsLoadingData(true);
      const storedUser = localStorage.getItem("adminUser");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setFormData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          avatar: userData.avatar || "",
        });
        setAvatarPreview(userData.avatar || "");
      }
      
      // Lấy thông tin mới nhất từ API
      const res = await axiosClient.get("/users/me", {
        validateStatus: () => true,
      });
      
      if (res.status === 200 && res.data) {
        const userInfo = res.data;
        setFormData({
          firstName: userInfo.firstName || "",
          lastName: userInfo.lastName || "",
          email: userInfo.email || "",
          phone: userInfo.phone || "",
          address: userInfo.address || "",
          avatar: userInfo.avatar || "",
        });
        setAvatarPreview(userInfo.avatar || "");
        
        // Cập nhật localStorage
        const updatedUser = { ...JSON.parse(storedUser || "{}"), ...userInfo };
        localStorage.setItem("adminUser", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error loading user info:", error);
      toast.error("Lỗi khi tải thông tin người dùng!");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra loại file
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh (JPG, PNG, GIF, etc.)");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Kiểm tra kích thước file (tối đa 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh không được vượt quá 5MB");
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
        toast.error("Lỗi khi đọc file ảnh");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview("");
    setFormData((prev) => ({ ...prev, avatar: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      if (formData.phone) formDataToSend.append("phone", formData.phone);
      if (formData.address) formDataToSend.append("address", formData.address);

      // Upload file ảnh mới nếu có
      const fileInput = fileInputRef.current;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        formDataToSend.append("file", fileInput.files[0]);
      } else if (avatarPreview && !avatarPreview.startsWith("data:") && avatarPreview) {
        // Nếu là URL từ server, giữ nguyên
        formDataToSend.append("avatar", avatarPreview);
      }

      const res = await axiosClient.put("/users/me", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        validateStatus: () => true,
      });

      if (res.status === 200 || res.status === 201) {
        // Cập nhật localStorage
        const storedUser = localStorage.getItem("adminUser");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          const updatedUser = { ...userData, ...res.data };
          localStorage.setItem("adminUser", JSON.stringify(updatedUser));
        }

        // Cập nhật avatar preview
        if (res.data.avatar) {
          setFormData((prev) => ({ ...prev, avatar: res.data.avatar }));
          setAvatarPreview(res.data.avatar);
        }

        // Reset file input sau khi upload thành công
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        toast.success("Cập nhật thông tin thành công!");
        loadUserInfo(); // Reload để lấy thông tin mới nhất
      } else {
        toast.error(res.data?.message || "Cập nhật thông tin thất bại");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Lỗi kết nối đến server!");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="admin-profile-container">
        <div className="admin-profile-loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="admin-profile-container">
      <div className="admin-profile-header">
        <h1>
          <User size={24} /> Thông Tin Cá Nhân
        </h1>
      </div>

      <div className="admin-profile-content">
        <form onSubmit={handleSubmit} className="admin-profile-form">
          {/* Avatar Upload Section */}
          <div className="admin-avatar-section">
            <label className="admin-avatar-label">Ảnh đại diện</label>
            <div className="admin-avatar-upload-container">
              <div className="admin-avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" />
                ) : (
                  <div className="admin-avatar-placeholder">
                    <User size={48} />
                    <span>Chưa có ảnh</span>
                  </div>
                )}
              </div>
              <div className="admin-avatar-actions">
                <button
                  type="button"
                  className="admin-upload-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={18} />
                  Cập nhật ảnh đại diện
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    className="admin-remove-button"
                    onClick={handleRemoveAvatar}
                  >
                    <X size={18} />
                    Xóa ảnh
                  </button>
                )}
              </div>
              <p className="admin-avatar-hint">
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

          {/* Form Fields */}
          <div className="admin-profile-form-row">
            <div className="admin-profile-form-group">
              <label>Họ *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
                placeholder="Nhập họ"
              />
            </div>

            <div className="admin-profile-form-group">
              <label>Tên *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
                placeholder="Nhập tên"
              />
            </div>
          </div>

          <div className="admin-profile-form-row">
            <div className="admin-profile-form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="admin-disabled-input"
                placeholder="Email"
              />
            </div>

            <div className="admin-profile-form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>

          <div className="admin-profile-form-group">
            <label>Địa chỉ</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Nhập địa chỉ"
            />
          </div>

          <div className="admin-profile-form-actions">
            <button
              type="submit"
              disabled={isLoading}
              className="admin-profile-submit-button"
            >
              {isLoading ? "Đang cập nhật..." : "Cập nhật thông tin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

