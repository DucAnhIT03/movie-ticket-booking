import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Settings, Search, PartyPopper, Upload, XCircle, Image as ImageIcon } from "lucide-react";
import FestivalModal from "./FestivalModal";
import festivalService from "../../services/festivals/festivalService";
import posterService from "../../services/poster/posterService";
import "./FestivalManagement.css";
import { sortByNewest } from "../../utils/sortUtils";

export default function FestivalManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [festivals, setFestivals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [poster, setPoster] = useState(null);
  const [posterLoading, setPosterLoading] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [posterPreview, setPosterPreview] = useState("");


  const loadFestivals = async () => {
    setLoading(true);
    try {
      const response = await festivalService.getAll(searchTerm, page, limit);
      if (response.status === 200) {
        setFestivals(sortByNewest(response.data.items || []));
        setTotal(response.data.total || 0);
        setTotalPages(response.data.totalPages || 0);
      } else {
        console.error("Error loading festivals:", response.status);
        alert("Có lỗi xảy ra khi tải danh sách lễ hội");
      }
    } catch (error) {
      console.error("Error loading festivals:", error);
      alert("Có lỗi xảy ra khi tải danh sách lễ hội");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPoster();
    loadFestivals();
  }, [page]);
  
 
  const loadPoster = async () => {
    setPosterLoading(true);
    try {
      const response = await posterService.get();
      if (response.status === 200) {
        setPoster(response.data);
        setPosterPreview(response.data.image_url || "");
      }
    } catch (error) {
      console.error("Error loading poster:", error);
    } finally {
      setPosterLoading(false);
    }
  };
  
 
  const handlePosterImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  

  const handleRemovePosterPreview = () => {
    setPosterPreview("");
  };
  

  const handleSavePoster = async () => {
    setUploadingPoster(true);
    
    try {
      const fileInput = document.getElementById("poster-file-input");
      const file = fileInput?.files?.[0];
      
      const formData = new FormData();
      
      if (file) {
        formData.append("file", file);
      } else if (posterPreview) {
        
        formData.append("image_url", posterPreview);
      } else if (poster?.image_url) {
      
        formData.append("image_url", poster.image_url);
      } else {
      
        formData.append("image_url", "");
      }

      const response = await posterService.update(formData);

      if (response.status === 200) {
        setPoster(response.data);
        setPosterPreview(response.data.image_url || "");
        alert("Cập nhật poster thành công!");
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
      setUploadingPoster(false);
    }
  };

 
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadFestivals();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

 
  const handleOpenModal = (item) => {
    setSelectedFestival(item);
    setIsModalOpen(true);
  };

 
  const handleCloseModal = () => {
    setSelectedFestival(null);
    setIsModalOpen(false);
  };


  const handleSaveFestival = async (data) => {
    setIsSaving(true);
    try {
     
      const formData = new FormData();
      formData.append("title", data.title);
      if (data.content !== undefined && data.content !== null) {
        formData.append("content", data.content);
      }
    
      if (data.image) {
        if (data.image instanceof File || data.image instanceof Blob) {
          formData.append("file", data.image);
        } else {
          formData.append("image", data.image);
        }
      }
      if (data.start_time) {
        formData.append("start_time", data.start_time);
      }
      if (data.end_time) {
        formData.append("end_time", data.end_time);
      }

      let response;
      if (data.id) {
       
        response = await festivalService.update(data.id, formData);
      } else {
        
        response = await festivalService.create(formData);
      }

      if (response.status === 200 || response.status === 201) {
        handleCloseModal();
        if (page !== 1) {
          setPage(1);
        } else {
          loadFestivals(); 
        }
      } else {
        const errorMsg = response.data?.message || "Có lỗi xảy ra khi lưu lễ hội";
        alert(errorMsg);
      }
    } catch (error) {
      console.error("Error saving festival:", error);
      alert("Có lỗi xảy ra khi lưu lễ hội");
    } finally {
      setIsSaving(false);
    }
  };

  
  const handleDeleteFestival = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa lễ hội này?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await festivalService.delete(id);
      if (response.status === 200) {
        loadFestivals(); 
      } else {
        const errorMsg = response.data?.message || "Có lỗi xảy ra khi xóa lễ hội";
        alert(errorMsg);
      }
    } catch (error) {
      console.error("Error deleting festival:", error);
      alert("Có lỗi xảy ra khi xóa lễ hội");
    } finally {
      setLoading(false);
    }
  };

  
  const formatDate = (dateString) => {
    if (dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "-";
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
        <PartyPopper /> Quản Lý Festival
      </h1>

      {/* Poster Management Section */}
      <div className="poster-management-section">
        <h2
          style={{
            fontSize: "20px",
            marginBottom: "15px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#fff",
          }}
        >
          <ImageIcon size={20} /> Quản Lý Poster (Hiển thị ở đầu trang Liên hoan phim)
        </h2>
        <div className="poster-info-box">
          <p style={{ color: "#aaa", marginBottom: "15px", fontSize: "13px" }}>
            <strong>Thông số:</strong> Kích thước: <strong style={{ color: "#fff" }}>1440 x 810px</strong>, 
            Vị trí: <strong style={{ color: "#fff" }}>Top 80px</strong>
          </p>

          <div className="poster-upload-section">
            <label className="poster-upload-label">
              <input
                id="poster-file-input"
                type="file"
                accept="image/*"
                onChange={handlePosterImageChange}
                disabled={uploadingPoster}
                style={{ display: "none" }}
              />
              <div className="poster-upload-btn" style={{ opacity: uploadingPoster ? 0.6 : 1, cursor: uploadingPoster ? "not-allowed" : "pointer" }}>
                <Upload size={18} />
                {uploadingPoster ? "Đang upload..." : "Chọn ảnh Poster (1440x810px)"}
              </div>
            </label>

            {(posterPreview || poster?.image_url) && (
              <div className="poster-preview-container">
                <div className="poster-preview-wrapper">
                  <img
                    src={posterPreview || poster?.image_url}
                    alt="Poster Preview"
                    className="poster-preview-img"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePosterPreview}
                    className="poster-remove-btn"
                    disabled={uploadingPoster}
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
              onClick={handleSavePoster}
              className="poster-save-btn"
              disabled={uploadingPoster}
            >
              {uploadingPoster ? "Đang xử lý..." : "Lưu Poster"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "40px", marginBottom: "20px", borderTop: "1px solid #333", paddingTop: "20px" }}>
        <h2 style={{ fontSize: "20px", marginBottom: "15px" }}>Danh sách Lễ hội</h2>
      </div>

      {/* Search */}
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
            placeholder="Tìm kiếm festival..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "5px",
              padding: "8px 10px 8px 35px",
              width: "250px",
              outline: "none",
            }}
          />
        </div>

        <button
          onClick={() => handleOpenModal(null)}
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
          <PlusCircle size={18} /> Thêm Festival
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
          Đang tải...
        </div>
      )}

      {/* Festival Table */}
      {!loading && (
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
              <th style={{ padding: "10px", textAlign: "center" }}>Poster</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Tiêu đề</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Bắt đầu</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Kết thúc</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {festivals.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#888" }}>
                  Chưa có lễ hội nào
                </td>
              </tr>
            ) : (
              festivals.map((f) => (
                <tr key={f.id} style={{ borderBottom: "1px solid #2a303d" }}>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    {f.image ? (
                      <img
                        src={f.image}
                        alt={f.title}
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          background: "#242b36",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#888",
                          fontSize: "12px",
                        }}
                      >
                        No img
                      </div>
                    )}
                  </td>

                  <td style={{ padding: "10px", textAlign: "center" }}>{f.title}</td>

                  <td style={{ padding: "10px", textAlign: "center" }}>
                    {formatDate(f.start_time)}
                  </td>

                  <td style={{ padding: "10px", textAlign: "center" }}>
                    {formatDate(f.end_time)}
                  </td>

                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <button
                      onClick={() => handleOpenModal(f)}
                      style={{
                        background: "#1976d2",
                        border: "none",
                        borderRadius: "5px",
                        padding: "6px 10px",
                        marginRight: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <Settings size={16} color="#fff" />
                    </button>

                    <button
                      onClick={() => handleDeleteFestival(f.id)}
                      style={{
                        background: "#d32f2f",
                        border: "none",
                        borderRadius: "5px",
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={16} color="#fff" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "8px 16px",
              background: page === 1 ? "#242b36" : "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: page === 1 ? "not-allowed" : "pointer",
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            Trước
          </button>
          <span style={{ padding: "8px 16px", color: "#fff" }}>
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "8px 16px",
              background: page === totalPages ? "#242b36" : "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            Sau
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <FestivalModal
          title={selectedFestival ? "Sửa Festival" : "Thêm Festival"}
          onClose={handleCloseModal}
          onSave={handleSaveFestival}
          initialData={selectedFestival}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
