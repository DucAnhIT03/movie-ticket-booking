import React, { useState, useEffect } from "react";
import { X, Upload, XCircle } from "lucide-react";
import "./EventModal.css";

const formatDateTimeLocal = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

const toISOStringOrNull = (dateTimeString) => {
  if (!dateTimeString) return null;
  const date = new Date(dateTimeString);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export default function EventModal({
  title,
  onClose,
  onSave,
  initialData,
  isSaving = false,
}) {
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    content: "",
    location: "",
    start_time: "",
    end_time: "",
    image: null,
    imageUrl: "",
    is_special: false,
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormState({
        title: initialData.title || "",
        description: initialData.description || "",
        content: initialData.content || "",
        location: initialData.location || "",
        start_time: formatDateTimeLocal(initialData.start_time),
        end_time: formatDateTimeLocal(initialData.end_time),
        image: null,
        imageUrl: initialData.image || "",
        is_special: Boolean(initialData.is_special),
      });
      setImagePreview(initialData.image || "");
    } else {
      setFormState({
        title: "",
        description: "",
        content: "",
        location: "",
        start_time: "",
        end_time: "",
        image: null,
        imageUrl: "",
        is_special: false,
      });
      setImagePreview("");
    }
    setErrors({});
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;

    if (files && files.length > 0) {
      const file = files[0];
      setFormState((prev) => ({
        ...prev,
        image: file,
        imageUrl: "",
      }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else if (type === "checkbox") {
      setFormState((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRemoveImage = () => {
    setFormState((prev) => ({
      ...prev,
      image: null,
      imageUrl: "",
    }));
    setImagePreview("");
  };

  const validate = () => {
    const newErrors = {};
    if (!formState.title.trim()) {
      newErrors.title = "Tiêu đề không được để trống";
    } else if (formState.title.length > 255) {
      newErrors.title = "Tiêu đề tối đa 255 ký tự";
    }
    if (!formState.start_time) {
      newErrors.start_time = "Vui lòng chọn thời gian bắt đầu";
    }
    if (!formState.end_time) {
      newErrors.end_time = "Vui lòng chọn thời gian kết thúc";
    }
    if (formState.start_time && formState.end_time) {
      const start = new Date(formState.start_time);
      const end = new Date(formState.end_time);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
        newErrors.end_time = "Thời gian kết thúc phải lớn hơn thời gian bắt đầu";
      }
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      id: initialData?.id,
      title: formState.title.trim(),
      description: formState.description?.trim() || null,
      content: formState.content?.trim() || null,
      location: formState.location?.trim() || null,
      start_time: toISOStringOrNull(formState.start_time),
      end_time: toISOStringOrNull(formState.end_time),
      image:
        formState.image instanceof File
          ? formState.image
          : formState.imageUrl || null,
      is_special: Boolean(formState.is_special),
    };

    onSave(payload);
  };

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <h2>{title}</h2>
          <button className="event-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="event-modal-form" onSubmit={handleSubmit}>
          <div className="event-modal-field">
            <label>
              Tiêu đề <span className="required">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formState.title}
              onChange={handleChange}
              maxLength={255}
              placeholder="Nhập tiêu đề sự kiện"
              disabled={isSaving}
            />
            {errors.title && (
              <span className="event-modal-error">{errors.title}</span>
            )}
          </div>

          <div className="event-modal-grid">
            <div className="event-modal-field">
              <label>
                Thời gian bắt đầu <span className="required">*</span>
              </label>
              <input
                type="datetime-local"
                name="start_time"
                value={formState.start_time}
                onChange={handleChange}
                disabled={isSaving}
              />
              {errors.start_time && (
                <span className="event-modal-error">{errors.start_time}</span>
              )}
            </div>
            <div className="event-modal-field">
              <label>
                Thời gian kết thúc <span className="required">*</span>
              </label>
              <input
                type="datetime-local"
                name="end_time"
                value={formState.end_time}
                onChange={handleChange}
                disabled={isSaving}
              />
              {errors.end_time && (
                <span className="event-modal-error">{errors.end_time}</span>
              )}
            </div>
          </div>

          <div className="event-modal-field">
            <label>Địa điểm</label>
            <input
              type="text"
              name="location"
              value={formState.location}
              onChange={handleChange}
              placeholder="VD: CGV Vincom Landmark"
              disabled={isSaving}
            />
          </div>

          <div className="event-modal-field">
            <label>Mô tả</label>
            <textarea
              name="description"
              value={formState.description}
              onChange={handleChange}
              rows={4}
              placeholder="Nội dung mô tả sự kiện"
              disabled={isSaving}
            />
          </div>

          <div className="event-modal-field">
            <label>Bài viết chi tiết</label>
            <textarea
              name="content"
              value={formState.content}
              onChange={handleChange}
              rows={8}
              placeholder="Nội dung bài viết hiển thị khi người dùng xem chi tiết"
              disabled={isSaving}
            />
          </div>

          <div className="event-modal-field">
            <label>Ảnh sự kiện</label>
            <div className="event-modal-upload">
              <input
                id="event-image-input"
                type="file"
                accept="image/*"
                onChange={handleChange}
                disabled={isSaving}
                style={{ display: "none" }}
              />
              <label
                htmlFor="event-image-input"
                className="event-modal-upload-btn"
                style={{
                  opacity: isSaving ? 0.6 : 1,
                  cursor: isSaving ? "not-allowed" : "pointer",
                }}
              >
                <Upload size={18} />
                {isSaving ? "Đang xử lý..." : "Chọn ảnh sự kiện"}
              </label>

              {(imagePreview || formState.imageUrl) && (
                <div className="event-modal-preview-wrapper">
                  <img
                    src={imagePreview || formState.imageUrl}
                    alt="Preview"
                    className="event-modal-preview-img"
                  />
                  <button
                    type="button"
                    className="event-modal-remove-img"
                    onClick={handleRemoveImage}
                    disabled={isSaving}
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="event-modal-field event-special-toggle">
            <label>Đánh dấu sự kiện đặc biệt</label>
            <label className="event-modal-switch">
              <input
                type="checkbox"
                name="is_special"
                checked={formState.is_special}
                onChange={handleChange}
                disabled={isSaving}
              />
              <span className="event-modal-switch-slider" />
            </label>
          </div>

          <div className="event-modal-actions">
            <button
              type="button"
              className="event-modal-btn event-modal-btn-cancel"
              onClick={onClose}
              disabled={isSaving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="event-modal-btn event-modal-btn-save"
              disabled={isSaving}
            >
              {isSaving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


