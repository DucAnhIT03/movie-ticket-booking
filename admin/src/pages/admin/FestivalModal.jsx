import React, { useState, useEffect } from "react";
import { X, Upload, XCircle } from "lucide-react";
import "./FestivalModal.css";
import uploadService from "../../services/uploads/uploadService";

export default function FestivalModal({ title, onClose, onSave, initialData, isSaving = false }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: null,
    imageUrl: "",
    start_time: "",
    end_time: "",
  });
  const [errors, setErrors] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (initialData) {
      // Format datetime for input
      const formatDateTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        title: initialData.title || "",
        content: initialData.content || "",
        image: null,
        imageUrl: initialData.image || "",
        start_time: formatDateTime(initialData.start_time),
        end_time: formatDateTime(initialData.end_time),
      });
      setImagePreview(initialData.image || "");
    } else {
      setFormData({
        title: "",
        content: "",
        image: null,
        imageUrl: "",
        start_time: "",
        end_time: "",
      });
      setImagePreview("");
    }
    setErrors({});
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files && files.length > 0) {
      // Xử lý file upload
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        [name]: file,
        imageUrl: "", // Xóa URL cũ khi chọn file mới
      }));
      // Tạo preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Xóa lỗi khi người dùng bắt đầu nhập
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: null,
      imageUrl: "",
    }));
    setImagePreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề không được để trống";
    }
    if (formData.title.length > 255) {
      newErrors.title = "Tiêu đề không được vượt quá 255 ký tự";
    }
    if (!formData.start_time) {
      newErrors.start_time = "Thời gian bắt đầu không được để trống";
    }
    if (!formData.end_time) {
      newErrors.end_time = "Thời gian kết thúc không được để trống";
    }
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      if (end <= start) {
        newErrors.end_time = "Thời gian kết thúc phải lớn hơn thời gian bắt đầu";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Format datetime to ISO string
    const formatToISO = (dateTimeString) => {
      if (!dateTimeString) return null;
      return new Date(dateTimeString).toISOString();
    };

    // Gọi onSave với dữ liệu
    // Nếu có file mới, gửi file object; nếu không, gửi URL
    const dataToSave = {
      title: formData.title,
      content: formData.content || null,
      image: formData.image && typeof formData.image === 'object' 
        ? formData.image  // Gửi file object để backend upload
        : (formData.imageUrl || null), // Gửi URL nếu không có file mới
      start_time: formatToISO(formData.start_time),
      end_time: formatToISO(formData.end_time),
      id: initialData?.id,
    };
    onSave(dataToSave);
  };

  return (
    <div className="festival-modal-overlay" onClick={onClose}>
      <div className="festival-modal" onClick={(e) => e.stopPropagation()}>
        <div className="festival-modal-header">
          <h2>{title}</h2>
          <button className="festival-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="festival-modal-form">
          <div className="festival-modal-field">
            <label>
              Tiêu đề <span style={{ color: "#e53935" }}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Nhập tiêu đề lễ hội"
              maxLength={255}
              disabled={isSaving}
            />
            {errors.title && (
              <span className="festival-modal-error">{errors.title}</span>
            )}
          </div>

          <div className="festival-modal-field">
            <label>Nội dung</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Nhập nội dung mô tả lễ hội"
              rows={10}
              disabled={isSaving}
            />
            {errors.content && (
              <span className="festival-modal-error">{errors.content}</span>
            )}
          </div>

          <div className="festival-modal-field">
            <label>Poster/Banner</label>
            <div className="festival-modal-image-upload">
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleChange}
                disabled={isSaving || uploadingImage}
                style={{ display: "none" }}
              />
              <label
                htmlFor="image"
                className="festival-modal-upload-btn"
                style={{
                  opacity: isSaving || uploadingImage ? 0.6 : 1,
                  cursor: isSaving || uploadingImage ? "not-allowed" : "pointer",
                }}
              >
                <Upload size={18} />
                {uploadingImage ? "Đang upload..." : "Chọn ảnh Poster"}
              </label>
              
              {(imagePreview || formData.imageUrl) && (
                <div className="festival-modal-image-preview">
                  <img
                    src={imagePreview || formData.imageUrl}
                    alt="Preview"
                    className="festival-modal-preview-img"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="festival-modal-remove-img"
                    disabled={isSaving || uploadingImage}
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              )}
            </div>
            {errors.image && (
              <span className="festival-modal-error">{errors.image}</span>
            )}
          </div>

          <div className="festival-modal-field">
            <label>
              Thời gian bắt đầu <span style={{ color: "#e53935" }}>*</span>
            </label>
            <input
              type="datetime-local"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              disabled={isSaving}
            />
            {errors.start_time && (
              <span className="festival-modal-error">{errors.start_time}</span>
            )}
          </div>

          <div className="festival-modal-field">
            <label>
              Thời gian kết thúc <span style={{ color: "#e53935" }}>*</span>
            </label>
            <input
              type="datetime-local"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              disabled={isSaving}
            />
            {errors.end_time && (
              <span className="festival-modal-error">{errors.end_time}</span>
            )}
          </div>

          <div className="festival-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="festival-modal-btn festival-modal-btn-cancel"
              disabled={isSaving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="festival-modal-btn festival-modal-btn-save"
              disabled={isSaving || uploadingImage}
            >
              {isSaving || uploadingImage ? "Đang xử lý..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

