import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Edit, Search, Ticket, Send, X, Upload, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import promotionService from "../../services/promotions/promotionService";
import uploadService from "../../services/uploads/uploadService";
import userService from "../../services/users/userService";
import { sortByNewest } from "../../utils/sortUtils";
import "./MovieModal.css";

export default function PromotionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [promotions, setPromotions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendUserId, setSendUserId] = useState("");
  const [sendChannel, setSendChannel] = useState("inapp");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    image: "",
    discountType: "PERCENT",
    discountValue: 0,
    channelEmail: false,
    channelInApp: true,
    isPublic: false,
    startAt: "",
    endAt: "",
    usageLimit: null,
    perUserLimit: null,
    active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const response = await promotionService.getAll();
      if (response.status === 200) {
        const data = response.data;
        const items = Array.isArray(data) ? data : (data.items || data.data || []);
        setPromotions(sortByNewest(items));
      } else {
        toast.error("Lỗi khi tải danh sách khuyến mãi");
      }
    } catch (error) {
      console.error("Error loading promotions:", error);
      toast.error("Lỗi khi tải danh sách khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (promotion = null) => {
    if (promotion) {
      setSelectedPromotion(promotion);
      setFormData({
        code: promotion.code || "",
        title: promotion.title || "",
        description: promotion.description || "",
        image: promotion.image || "",
        discountType: promotion.discountType || "PERCENT",
        discountValue: promotion.discountValue || 0,
        channelEmail: promotion.channelEmail || false,
        channelInApp: promotion.channelInApp !== undefined ? promotion.channelInApp : true,
        isPublic: promotion.isPublic !== undefined ? promotion.isPublic : false,
        startAt: promotion.startAt ? new Date(promotion.startAt).toISOString().slice(0, 16) : "",
        endAt: promotion.endAt ? new Date(promotion.endAt).toISOString().slice(0, 16) : "",
        usageLimit: promotion.usageLimit || null,
        perUserLimit: promotion.perUserLimit || null,
        active: promotion.active !== undefined ? promotion.active : true,
      });
      setImagePreview(promotion.image || null);
      setImageFile(null);
    } else {
      setSelectedPromotion(null);
      setFormData({
        code: "",
        title: "",
        description: "",
        image: "",
        discountType: "PERCENT",
        discountValue: 0,
        channelEmail: false,
        channelInApp: true,
        isPublic: false,
        startAt: "",
        endAt: "",
        usageLimit: null,
        perUserLimit: null,
        active: true,
      });
      setImageFile(null);
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedPromotion(null);
    setIsModalOpen(false);
    setImageFile(null);
    setImagePreview(null);
    setFormData({
      code: "",
      title: "",
      description: "",
      image: "",
      discountType: "PERCENT",
      discountValue: 0,
      channelEmail: false,
      channelInApp: true,
      isPublic: false,
      startAt: "",
      endAt: "",
      usageLimit: null,
      perUserLimit: null,
      active: true,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh!");
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Kích thước file không được vượt quá 10MB!");
        return;
      }
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image: "" });
  };

  const handleSave = async () => {
    // Validate
    if (!formData.code.trim()) {
      toast.error("Vui lòng nhập mã khuyến mãi!");
      return;
    }

    if (formData.discountValue <= 0) {
      toast.error("Giá trị giảm giá phải lớn hơn 0!");
      return;
    }

    if (formData.discountType === "PERCENT" && formData.discountValue > 100) {
      toast.error("Phần trăm giảm giá không được vượt quá 100%!");
      return;
    }

    try {
      let imageUrl = formData.image;

      // Upload ảnh nếu có file mới
      if (imageFile) {
        setUploadingImage(true);
        try {
          const uploadResponse = await uploadService.uploadSingle(
            imageFile,
            null,
            "promotions",
            "images"
          );
          if (uploadResponse.status === 201 || uploadResponse.status === 200) {
            imageUrl = uploadResponse.data.url;
            console.log("Upload ảnh thành công, URL:", imageUrl);
            // Không hiển thị toast ở đây, sẽ hiển thị sau khi tạo promotion thành công
          } else {
            toast.error("Lỗi khi upload ảnh! Status: " + uploadResponse.status);
            setUploadingImage(false);
            return;
          }
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Lỗi khi upload ảnh: " + (uploadError.response?.data?.message || uploadError.message));
          setUploadingImage(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      // Tạo dataToSend - loại bỏ 'active' khi tạo mới (CreatePromotionDto không có field này)
      // Nhưng giữ lại khi update (UpdatePromotionDto có field này)
      const baseData = {
        code: formData.code.trim(),
        title: formData.title?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        image: imageUrl || undefined,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue), // Đảm bảo là number
        channelEmail: Boolean(formData.channelEmail),
        channelInApp: formData.channelInApp !== undefined ? Boolean(formData.channelInApp) : true,
        isPublic: Boolean(formData.isPublic),
        startAt: formData.startAt ? new Date(formData.startAt).toISOString() : undefined,
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : undefined,
        // Chỉ gửi usageLimit và perUserLimit nếu có giá trị (không phải null, undefined, hoặc empty string)
        usageLimit: formData.usageLimit != null && formData.usageLimit !== '' ? Number(formData.usageLimit) : undefined,
        perUserLimit: formData.perUserLimit != null && formData.perUserLimit !== '' ? Number(formData.perUserLimit) : undefined,
      };

      let response;
      let requestData; // Để log khi có lỗi
      
      if (selectedPromotion) {
        // Update: có thể gửi field 'active'
        requestData = {
          ...baseData,
          active: formData.active !== undefined ? formData.active : true,
        };
        console.log("Update data:", requestData);
        response = await promotionService.update(selectedPromotion.id, requestData);
      } else {
        // Create: KHÔNG gửi field 'active' vì CreatePromotionDto không có
        requestData = baseData;
        console.log("Create data (without active):", requestData);
        response = await promotionService.create(requestData);
      }

      console.log("API Response:", {
        status: response.status,
        data: response.data,
        selectedPromotion: selectedPromotion?.id
      });

      if (response.status === 200 || response.status === 201) {
        const successMsg = selectedPromotion 
          ? "Cập nhật khuyến mãi thành công!" 
          : "Tạo khuyến mãi thành công!";
        
        if (imageFile) {
          toast.success(`${successMsg} (Đã upload ảnh)`);
        } else {
          toast.success(successMsg);
        }
        
        // Reset form và đóng modal
        setSelectedPromotion(null);
        setImageFile(null);
        setImagePreview(null);
        setFormData({
          code: "",
          title: "",
          description: "",
          image: "",
          discountType: "PERCENT",
          discountValue: 0,
          channelEmail: false,
          channelInApp: true,
          isPublic: false,
          startAt: "",
          endAt: "",
          usageLimit: null,
          perUserLimit: null,
          active: true,
        });
        setIsModalOpen(false);
        // Reload danh sách
        await loadPromotions();
      } else {
        const errorMsg = response.data?.message || response.data?.error || `Lỗi khi lưu khuyến mãi (Status: ${response.status})`;
        console.error("Save failed:", {
          status: response.status,
          data: response.data,
          requestData: requestData
        });
        toast.error(errorMsg);
        
        // Hiển thị chi tiết lỗi trong console để debug
        if (response.data) {
          console.error("Chi tiết lỗi từ server:", JSON.stringify(response.data, null, 2));
        }
      }
    } catch (error) {
      console.error("Error saving promotion:", error);
      const errorMsg = error.response?.data?.message || error.message || "Lỗi khi lưu khuyến mãi";
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khuyến mãi này?")) {
      return;
    }

    try {
      const response = await promotionService.delete(id);
      if (response.status === 200) {
        toast.success("Xóa khuyến mãi thành công!");
        loadPromotions();
      } else {
        const errorMsg = response.data?.message || "Lỗi khi xóa khuyến mãi";
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast.error("Lỗi khi xóa khuyến mãi");
    }
  };

  const handleOpenSendModal = async (promotion) => {
    setSelectedPromotion(promotion);
    setSendUserId("");
    setSendChannel("inapp");
    setSendModalOpen(true);
    
    // Load danh sách users
    setLoadingUsers(true);
    try {
      const response = await userService.getAllUsers();
      if (response.status === 200) {
        const data = response.data;
        const items = Array.isArray(data) ? data : (data.items || data.data || []);
        setUsers(items);
      } else {
        toast.error("Không thể tải danh sách người dùng");
        setUsers([]);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Lỗi khi tải danh sách người dùng");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSendPromotion = async () => {
    if (!sendUserId || !selectedPromotion) {
      toast.error("Vui lòng chọn người dùng!");
      return;
    }

    setIsSending(true);
    try {
      const response = await promotionService.sendPromotion(
        selectedPromotion.id,
        parseInt(sendUserId),
        sendChannel
      );

      if (response.status === 200 || response.status === 201) {
        // Hiển thị message từ backend nếu có, nếu không thì dùng message mặc định
        const successMsg = response.data?.message || "Gửi khuyến mãi thành công!";
        toast.success(successMsg, {
          style: {
            background: "#28a745",
            color: "#fff",
          },
        });
        setSendModalOpen(false);
        setSendUserId("");
      } else {
        const errorMsg = response.data?.message || "Lỗi khi gửi khuyến mãi";
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Error sending promotion:", error);
      const errorMsg = error.response?.data?.message || error.message || "Lỗi khi gửi khuyến mãi";
      console.error("Chi tiết lỗi:", {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMsg
      });
      toast.error(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  const filteredPromotions = promotions.filter((promo) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      promo.code?.toLowerCase().includes(searchLower) ||
      promo.title?.toLowerCase().includes(searchLower) ||
      promo.description?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  const getStatusBadge = (promo) => {
    const now = new Date();
    const startAt = promo.startAt ? new Date(promo.startAt) : null;
    const endAt = promo.endAt ? new Date(promo.endAt) : null;

    if (!promo.active) return "Không hoạt động";
    if (startAt && now < startAt) return "Chưa bắt đầu";
    if (endAt && now > endAt) return "Đã hết hạn";
    return "Đang hoạt động";
  };

  return (
    <div style={{ color: "#fff" }}>
      <h1
        style={{
          fontSize: "26px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Ticket /> Quản Lý Khuyến Mãi
      </h1>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "15px",
        }}
      >
        <div style={{ position: "relative" }}>
          <Search
            style={{
              position: "absolute",
              left: "10px",
              top: "8px",
              color: "#aaa",
            }}
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm khuyến mãi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "5px",
              padding: "8px 10px 8px 35px",
              width: "280px",
              outline: "none",
            }}
          />
        </div>

        <button
          onClick={() => handleOpenModal()}
          style={{
            background: "#e53935",
            color: "#fff",
            padding: "10px 18px",
            border: "none",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          <PlusCircle size={18} /> Thêm khuyến mãi
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>Đang tải dữ liệu...</div>
      ) : filteredPromotions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
          {searchTerm ? "Không tìm thấy khuyến mãi nào" : "Chưa có khuyến mãi nào"}
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#1a1f29",
            color: "#fff",
          }}
        >
          <thead style={{ background: "#242b36" }}>
            <tr>
              <th style={{ padding: "10px", textAlign: "center" }}>Mã</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Tiêu đề</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Loại giảm</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Giá trị</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Thời gian</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Trạng thái</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Số lượt đã sử dụng</th>
            </tr>
          </thead>

          <tbody>
            {filteredPromotions.map((promo) => (
              <tr key={promo.id} style={{ borderBottom: "1px solid #2a303d" }}>
                <td style={{ padding: "10px", textAlign: "center" }}>
                  <strong>{promo.code}</strong>
                </td>
                <td style={{ padding: "10px", textAlign: "center" }}>{promo.title || "—"}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>
                  {promo.discountType === "PERCENT" ? "Phần trăm" : "Số tiền"}
                </td>
                {/* Giá trị */}
                <td style={{ padding: "10px", textAlign: "center" }}>
                  {promo.discountType === "PERCENT"
                    ? `${promo.discountValue}%`
                    : `${promo.discountValue.toLocaleString("vi-VN")} VND`}
                </td>
                {/* Thời gian */}
                <td style={{ padding: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "#aaa" }}>
                    Bắt đầu: {formatDate(promo.startAt)} <br />
                    Kết thúc: {formatDate(promo.endAt)}
                  </div>
                </td>
                {/* Trạng thái */}
                <td style={{ padding: "10px", textAlign: "center" }}>{getStatusBadge(promo)}</td>
                {/* Số lượt đã sử dụng */}
                <td style={{ padding: "10px", textAlign: "center" }}>
                  {typeof promo.usedCountTotal === "number" ? promo.usedCountTotal : 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Promotion Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPromotion ? "Sửa khuyến mãi" : "Thêm khuyến mãi"}</h2>
              <button className="close-button" onClick={handleCloseModal}>&times;</button>
            </div>

            <form className="modal-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label>
                  Mã khuyến mãi <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VD: SUMMER2025"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tiêu đề</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Giảm giá mùa hè"
                />
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về khuyến mãi..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Ảnh khuyến mãi</label>
                <div style={{ marginBottom: "10px" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="promotion-image-upload"
                    style={{ display: "none" }}
                  />
                  <label
                    htmlFor="promotion-image-upload"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 20px",
                      background: "#1976d2",
                      border: "1px solid #1976d2",
                      borderRadius: "8px",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "all 0.3s ease",
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = "#0d5fb0";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "#1976d2";
                    }}
                  >
                    <Upload size={18} />
                    {imageFile ? "Đổi ảnh" : "Chọn ảnh"}
                  </label>
                  {(imagePreview || formData.image) && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      style={{
                        marginLeft: "10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        background: "#d32f2f",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      <XCircle size={16} />
                      Xóa ảnh
                    </button>
                  )}
                </div>
                {(imagePreview || formData.image) && (
                  <div style={{ marginTop: "10px" }}>
                    <img
                      src={imagePreview || formData.image}
                      alt="Preview"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "300px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        objectFit: "contain",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}
                {uploadingImage && (
                  <div style={{ marginTop: "10px", color: "#888", fontSize: "14px" }}>
                    Đang upload ảnh...
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Loại giảm giá <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    required
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="AMOUNT">Số tiền (VND)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Giá trị giảm <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.discountType === "PERCENT" ? "10" : "50000"}
                    min="0"
                    max={formData.discountType === "PERCENT" ? "100" : undefined}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={formData.startAt}
                    onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Ngày kết thúc</label>
                  <input
                    type="datetime-local"
                    value={formData.endAt}
                    onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Giới hạn sử dụng (tổng)</label>
                  <input
                    type="number"
                    value={formData.usageLimit || ""}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Không giới hạn"
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Giới hạn mỗi user</label>
                  <input
                    type="number"
                    value={formData.perUserLimit || ""}
                    onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Không giới hạn"
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.channelEmail}
                      onChange={(e) => setFormData({ ...formData, channelEmail: e.target.checked })}
                      style={{ cursor: "pointer" }}
                    />
                    Gửi qua Email
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.channelInApp}
                      onChange={(e) => setFormData({ ...formData, channelInApp: e.target.checked })}
                      style={{ cursor: "pointer" }}
                    />
                    Gửi trong App
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      style={{ cursor: "pointer" }}
                    />
                    Công khai (gợi ý ở thanh toán)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      style={{ cursor: "pointer" }}
                    />
                    Kích hoạt
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="save-button" onClick={handleSave}>
                  {selectedPromotion ? "Cập nhật" : "Tạo mới"}
                </button>
                <button type="button" className="cancel-button" onClick={handleCloseModal}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Promotion Modal */}
      {sendModalOpen && selectedPromotion && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSendModalOpen(false)}
        >
          <div
            style={{
              background: "#1a1f29",
              borderRadius: "15px",
              padding: "30px",
              width: "90%",
              maxWidth: "400px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#fff", fontSize: "20px", margin: 0 }}>Gửi khuyến mãi</h3>
              <button
                onClick={() => setSendModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  padding: "5px",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "10px" }}>
                Mã: <strong style={{ color: "#667eea" }}>{selectedPromotion.code}</strong>
              </p>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                Chọn người dùng <span style={{ color: "#dc3545" }}>*</span>
              </label>
              {loadingUsers ? (
                <div style={{ 
                  width: "100%", 
                  padding: "12px", 
                  textAlign: "center", 
                  color: "#888", 
                  fontSize: "14px" 
                }}>
                  Đang tải danh sách người dùng...
                </div>
              ) : (
                <select
                  value={sendUserId}
                  onChange={(e) => setSendUserId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                  }}
                >
                  <option value="" style={{ background: "#1a1f29" }}>
                    -- Chọn người dùng --
                  </option>
                  {users.map((user) => {
                    const userName = user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`.trim()
                      : user.firstName || user.lastName || `User #${user.id}`;
                    return (
                      <option 
                        key={user.id} 
                        value={user.id} 
                        style={{ background: "#1a1f29" }}
                      >
                        {userName} 
                        {user.email ? ` (${user.email})` : ""} 
                        {user.id ? ` - ID: ${user.id}` : ""}
                      </option>
                    );
                  })}
                </select>
              )}
              {users.length === 0 && !loadingUsers && (
                <p style={{ color: "#888", fontSize: "12px", marginTop: "5px" }}>
                  Không có người dùng nào trong hệ thống
                </p>
              )}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                Kênh gửi
              </label>
              <select
                value={sendChannel}
                onChange={(e) => setSendChannel(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "14px",
                }}
              >
                <option value="inapp" style={{ background: "#1a1f29" }}>Trong App</option>
                <option value="email" style={{ background: "#1a1f29" }}>Email</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleSendPromotion}
                disabled={isSending || !sendUserId}
                style={{
                  flex: 1,
                  background: isSending || !sendUserId ? "rgba(102, 126, 234, 0.5)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "8px",
                  cursor: isSending || !sendUserId ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                {isSending ? "Đang gửi..." : "Gửi"}
              </button>
              <button
                onClick={() => setSendModalOpen(false)}
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  padding: "12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

