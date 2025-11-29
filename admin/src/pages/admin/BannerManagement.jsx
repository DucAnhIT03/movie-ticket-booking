import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  PlusCircle,
  Search,
  Image as ImageIcon,
  Edit,
  Trash2,
  Upload,
  X,
  Ruler,
} from "lucide-react";
import bannerService from "../../services/banners/bannerService";
import { sortByNewest } from "../../utils/sortUtils";
import "./BannerManagement.css";

const FIXED_POSITION = "Home-Slider";
const FIXED_POSITION_LABEL = "Slider trang chủ";
const FIXED_TYPE = "IMAGE";
const FIXED_TYPE_LABEL = "Ảnh";

const defaultFormState = {
  url: "",
  type: FIXED_TYPE,
  position: FIXED_POSITION,
  width: 1458,
  height: 640,
};

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState(defaultFormState);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const response = await bannerService.getAllNoPaging();
      if (response.status === 200) {
        const rawBanners = Array.isArray(response.data) ? response.data : [];
        setBanners(sortByNewest(rawBanners));
      } else {
        toast.error("Không thể tải danh sách banner");
      }
    } catch (error) {
      console.error("Error loading banners:", error);
      toast.error("Lỗi khi tải danh sách banner");
    } finally {
      setLoading(false);
    }
  };

  const filteredBanners = useMemo(() => {
    if (!searchTerm.trim()) {
      return banners;
    }
    const lower = searchTerm.toLowerCase();
    return banners.filter(
      (banner) =>
        banner.url?.toLowerCase().includes(lower) ||
        banner.position?.toLowerCase().includes(lower) ||
        banner.type?.toLowerCase().includes(lower)
    );
  }, [banners, searchTerm]);

  const handleOpenModal = (banner = null) => {
    setSelectedBanner(banner);
    if (banner) {
      setFormState({
        url: banner.url || "",
        type: banner.type || FIXED_TYPE,
        position: banner.position || FIXED_POSITION,
        width: banner.width || 1458,
        height: banner.height || 640,
      });
      setPreviewUrl(banner.url || "");
    } else {
      setFormState(defaultFormState);
      setPreviewUrl("");
    }
    setUploadFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBanner(null);
    setUploadFile(null);
    setPreviewUrl("");
    setFormState(defaultFormState);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ hỗ trợ file ảnh");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 10MB");
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result?.toString() || "");
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (bannerId) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa banner này?")) {
      return;
    }
    try {
      const response = await bannerService.remove(bannerId);
      if (response.status === 200) {
        toast.success("Đã xóa banner");
        loadBanners();
      } else {
        toast.error(response.data?.message || "Xóa banner thất bại");
      }
    } catch (error) {
      console.error("Delete banner error:", error);
      toast.error("Không thể xóa banner");
    }
  };

  const handleSave = async () => {
    if (!formState.position) {
      toast.error("Vui lòng chọn vị trí hiển thị");
      return;
    }

    if (formState.type === "IMAGE" && !uploadFile && !formState.url) {
      toast.error("Vui lòng chọn ảnh hoặc nhập URL banner");
      return;
    }

    if (formState.width && Number(formState.width) <= 0) {
      toast.error("Chiều ngang phải lớn hơn 0");
      return;
    }

    if (formState.height && Number(formState.height) <= 0) {
      toast.error("Chiều dọc phải lớn hơn 0");
      return;
    }

    const payload = {
      ...formState,
      position: FIXED_POSITION,
      type: FIXED_TYPE,
      width: formState.width ? Number(formState.width) : undefined,
      height: formState.height ? Number(formState.height) : undefined,
      file: uploadFile || undefined,
    };

    setSaving(true);
    try {
      const response = selectedBanner
        ? await bannerService.update(selectedBanner.id, payload)
        : await bannerService.create(payload);

      if (response.status === 200 || response.status === 201) {
        toast.success(
          selectedBanner ? "Cập nhật banner thành công" : "Tạo banner thành công"
        );
        handleCloseModal();
        loadBanners();
      } else {
        toast.error(response.data?.message || "Lưu banner thất bại");
      }
    } catch (error) {
      console.error("Save banner error:", error);
      toast.error(error.response?.data?.message || "Lỗi khi lưu banner");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="banner-management">
      <header className="banner-management__header">
        <div>
          <h1>Quản lý Banner / Quảng cáo</h1>
          <p>Thêm mới, chỉnh sửa và điều chỉnh kích thước banner hiển thị.</p>
        </div>
        <button className="primary-btn" onClick={() => handleOpenModal()}>
          <PlusCircle size={18} />
          Thêm banner
        </button>
      </header>

      <div className="banner-management__search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Tìm kiếm theo URL, vị trí hoặc loại..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <section className="banner-management__table">
        {loading ? (
          <div className="table-placeholder">Đang tải dữ liệu...</div>
        ) : filteredBanners.length === 0 ? (
          <div className="table-placeholder">
            Chưa có banner nào, hãy thêm mới.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Vị trí</th>
                <th>Loại</th>
                <th>Kích thước (px)</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanners.map((banner) => (
                <tr key={banner.id}>
                  <td>
                    <div className="thumbnail">
                      {banner.url ? (
                        <img
                          src={banner.url}
                          alt={banner.position}
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      ) : (
                        <div className="thumbnail__placeholder">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="badge">{banner.position}</span>
                  </td>
                  <td>{banner.type}</td>
                  <td>
                    <div className="dimension">
                      <Ruler size={16} />
                      <span>
                        {(banner.width && `${banner.width}`) || "—"} x{" "}
                        {(banner.height && `${banner.height}`) || "—"}
                      </span>
                    </div>
                  </td>
                  <td>
                    {banner.created_at
                      ? new Date(banner.created_at).toLocaleString("vi-VN")
                      : "—"}
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="ghost-btn"
                        onClick={() => handleOpenModal(banner)}
                      >
                        <Edit size={16} />
                        Sửa
                      </button>
                      <button
                        className="ghost-btn danger"
                        onClick={() => handleDelete(banner.id)}
                      >
                        <Trash2 size={16} />
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {isModalOpen && (
        <div className="banner-modal__backdrop" onClick={handleCloseModal}>
          <div
            className="banner-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>{selectedBanner ? "Cập nhật banner" : "Thêm banner mới"}</h2>
              <button className="icon-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </header>

            <div className="banner-modal__body">
              <div className="form-group">
                <label>Ảnh banner</label>
                <div className="upload-area">
                  <label htmlFor="banner-upload" className="upload-btn">
                    <Upload size={16} />
                    {uploadFile ? "Đổi ảnh" : "Chọn ảnh"}
                  </label>
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    hidden
                  />
                  {previewUrl || formState.url ? (
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => {
                        setUploadFile(null);
                        setPreviewUrl("");
                        setFormState((prev) => ({ ...prev, url: "" }));
                      }}
                    >
                      Xóa ảnh
                    </button>
                  ) : null}
                </div>
                {(previewUrl || formState.url) && (
                  <div className="preview">
                    <img src={previewUrl || formState.url} alt="Preview" />
                  </div>
                )}
                <small>Hỗ trợ JPG, PNG, WEBP ≤ 10MB. Hoặc nhập URL trực tiếp.</small>
              </div>

              <div className="form-row form-row--dimensions">
                <div className="form-group">
                  <label>Chiều ngang (px)</label>
                  <input
                    type="number"
                    min="1"
                    value={formState.width}
                    onChange={(event) =>
                      setFormState({
                        ...formState,
                        width: event.target.value ? Number(event.target.value) : "",
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Chiều dọc (px)</label>
                  <input
                    type="number"
                    min="1"
                    value={formState.height}
                    onChange={(event) =>
                      setFormState({
                        ...formState,
                        height: event.target.value ? Number(event.target.value) : "",
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <footer>
              <button className="ghost-btn" onClick={handleCloseModal}>
                Hủy
              </button>
              <button
                className="primary-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : selectedBanner ? "Cập nhật" : "Tạo mới"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;

