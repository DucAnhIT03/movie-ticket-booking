import React, { useState, useEffect } from "react";
import { Upload, XCircle, Image as ImageIcon } from "lucide-react";
import "./PosterManagement.css";
import posterService from "../../services/poster/posterService";
import uploadService from "../../services/uploads/uploadService";

export default function PosterManagement() {
  const [poster, setPoster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    loadPoster();
  }, []);

  const loadPoster = async () => {
    setLoading(true);
    try {
      const response = await posterService.get();
      if (response.status === 200) {
        setPoster(response.data);
        setImagePreview(response.data.image_url || "");
      } else {
        console.error("Error loading poster:", response.status);
      }
    } catch (error) {
      console.error("Error loading poster:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Tạo preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setUploadingImage(true);
    
    try {
      // Lấy file từ input
      const fileInput = document.getElementById("poster-file-input");
      const file = fileInput?.files?.[0];
      
      // Tạo FormData để gửi
      const formData = new FormData();
      
      // Nếu có file mới, gửi file
      if (file) {
        formData.append("file", file);
      } else if (poster?.image_url) {
        // Nếu không có file mới nhưng có URL cũ, gửi URL
        formData.append("image_url", poster.image_url);
      }

      // Cập nhật poster với FormData
      const response = await posterService.update(formData);

      if (response.status === 200) {
        setPoster(response.data);
        setImagePreview(response.data.image_url || "");
        alert("Cập nhật poster thành công!");
        // Reset file input
        if (fileInput) {
          fileInput.value = "";
        }
      } else {
        const errorMsg = response.data?.message || "Có lỗi xảy ra khi cập nhật poster";
        alert(errorMsg);
      }
    } catch (error) {
      console.error("Error saving poster:", error);
      alert("Có lỗi xảy ra khi cập nhật poster");
    } finally {
      setIsSaving(false);
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div style={{ color: "#fff", textAlign: "center", padding: "40px" }}>
        Đang tải...
      </div>
    );
  }

  return (
    <div className="poster-management">
      <h1
        style={{
          fontSize: "26px",
          marginBottom: "30px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#fff",
        }}
      >
        <ImageIcon /> Quản Lý Poster
      </h1>

      <div className="poster-info-box">
        <p style={{ color: "#aaa", marginBottom: "20px", fontSize: "14px" }}>
          <strong>Lưu ý:</strong> Poster có kích thước cố định: <strong style={{ color: "#fff" }}>1440 x 810px</strong>
          <br />
          Vị trí hiển thị: <strong style={{ color: "#fff" }}>Top 80px</strong>
        </p>

        <div className="poster-upload-section">
          <label className="poster-upload-label">
            <input
              id="poster-file-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isSaving || uploadingImage}
              style={{ display: "none" }}
            />
            <div className="poster-upload-btn">
              <Upload size={18} />
              {uploadingImage ? "Đang upload..." : "Chọn ảnh Poster (1440x810px)"}
            </div>
          </label>

          {(imagePreview || poster?.image_url) && (
            <div className="poster-preview-container">
              <div className="poster-preview-wrapper">
                <img
                  src={imagePreview || poster?.image_url}
                  alt="Poster Preview"
                  className="poster-preview-img"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="poster-remove-btn"
                  disabled={isSaving || uploadingImage}
                >
                  <XCircle size={20} />
                </button>
              </div>
              <p className="poster-dimensions">
                Kích thước: <strong>1440 x 810px</strong>
              </p>
            </div>
          )}
        </div>

        <div className="poster-actions">
          <button
            onClick={handleSave}
            className="poster-save-btn"
            disabled={isSaving || uploadingImage}
          >
            {isSaving || uploadingImage ? "Đang xử lý..." : "Lưu Poster"}
          </button>
        </div>
      </div>
    </div>
  );
}

