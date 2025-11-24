import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Settings, Search, Building } from "lucide-react";
import { toast } from "react-toastify";
import MovieModal from "./MovieModal"; // dùng modal cũ
import theaterService from "../../services/theaters/theaterService";
import { sortByNewest } from "../../utils/sortUtils";

export default function TheaterManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [theaters, setTheaters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTheater, setSelectedTheater] = useState(null);

  // ✅ Lấy dữ liệu từ API
  useEffect(() => {
    loadTheaters();
  }, []);

  const loadTheaters = async () => {
    setIsLoading(true);
    try {
      const res = await theaterService.getAllTheaters();
      if (res.status === 200) {
        // Backend trả về { items: [], total, page, limit, totalPages }
        setTheaters(sortByNewest(res.data.items || res.data || []));
      } else if (res.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      } else if (res.status === 403) {
        toast.error("Bạn không có quyền truy cập!");
      } else {
        toast.error(res.data?.message || "Lỗi khi tải danh sách rạp phim");
      }
    } catch (error) {
      console.error("Error loading theaters:", error);
      toast.error("Lỗi kết nối đến server!");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Mở modal
  const handleOpenModal = (theater) => {
    setSelectedTheater(theater);
    setIsModalOpen(true);
  };

  // ✅ Đóng modal
  const handleCloseModal = () => {
    setSelectedTheater(null);
    setIsModalOpen(false);
  };

  // ✅ Validate phone VN
  const isValidPhone = (phone) => /^(0[3|5|7|8|9])[0-9]{8}$/.test(phone);

  // ✅ Lưu rạp
  const handleSaveTheater = async (data) => {
    if (!data.name || !data.name.trim()) {
      toast.error("Tên rạp không được để trống!");
      return;
    }
    if (!data.location || !data.location.trim()) {
      toast.error("Địa chỉ không được để trống!");
      return;
    }
    if (!data.phone || !data.phone.trim()) {
      toast.error("Số điện thoại không được để trống!");
      return;
    }
    if (!isValidPhone(data.phone.trim())) {
      toast.error("Số điện thoại không hợp lệ! (Ví dụ: 0912345678)");
      return;
    }

    const payload = {
      name: data.name.trim(),
      location: data.location.trim(),
      phone: data.phone.trim(),
    };

    try {
      if (data.id) {
        // Cập nhật
        const res = await theaterService.updateTheater(data.id, payload);
        if (res.status === 200) {
          toast.success("Cập nhật rạp phim thành công!");
          loadTheaters(); // Reload danh sách
          handleCloseModal();
        } else if (res.status === 404) {
          toast.error("Không tìm thấy rạp phim");
        } else if (res.status === 400) {
          toast.error(res.data?.message || "Dữ liệu không hợp lệ");
        } else {
          toast.error(res.data?.message || "Lỗi khi cập nhật rạp phim");
        }
      } else {
        // Thêm mới
        const res = await theaterService.createTheater(payload);
        if (res.status === 201) {
          toast.success("Thêm rạp phim thành công!");
          loadTheaters(); // Reload danh sách
          handleCloseModal();
        } else if (res.status === 400) {
          toast.error(res.data?.message || "Dữ liệu không hợp lệ");
        } else {
          toast.error(res.data?.message || "Lỗi khi thêm rạp phim");
        }
      }
    } catch (error) {
      console.error("Error saving theater:", error);
      const errorMessage = error.response?.data?.message || error.message || "Lỗi kết nối đến server!";
      toast.error(errorMessage);
    }
  };

  // ✅ Xóa rạp
  const handleDeleteTheater = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa rạp phim này không?")) {
      return;
    }

    try {
      const res = await theaterService.deleteTheater(id);
      if (res.status === 200) {
        toast.success("Xóa rạp phim thành công!");
        loadTheaters(); // Reload danh sách
      } else if (res.status === 404) {
        toast.error("Không tìm thấy rạp phim");
      } else {
        toast.error(res.data?.message || "Lỗi khi xóa rạp phim");
      }
    } catch (error) {
      console.error("Error deleting theater:", error);
      toast.error("Lỗi kết nối đến server!");
    }
  };

  // ✅ Tìm kiếm (client-side)
  const filtered = theaters.filter((t) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (t.name || "").toLowerCase().includes(searchLower) ||
      (t.location || "").toLowerCase().includes(searchLower) ||
      (t.phone || "").includes(searchTerm)
    );
  });

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
        <Building /> Quản Lý Rạp Phim
      </h1>

      {/* Thanh tìm kiếm */}
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
            placeholder="Tìm kiếm rạp phim..."
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
          <PlusCircle size={18} /> Thêm Rạp Phim
        </button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
          Đang tải dữ liệu...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
          {searchTerm ? "Không tìm thấy rạp phim nào" : "Chưa có rạp phim nào"}
        </div>
      ) : (
        /* Bảng danh sách rạp */
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
              <th style={{ padding: "10px", textAlign: "center" }}>Tên rạp</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Địa chỉ</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Số điện thoại</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #2a303d" }}>
                <td style={{ padding: "10px", textAlign: "center" }}>{t.name || "—"}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>
                  {t.location || "—"}
                </td>
                <td style={{ padding: "10px", textAlign: "center" }}>{t.phone || "—"}</td>

                <td style={{ padding: "10px", textAlign: "center" }}>
                  <button
                    onClick={() => handleOpenModal(t)}
                    style={{
                      background: "#1976d2",
                      border: "none",
                      borderRadius: "5px",
                      padding: "6px 10px",
                      marginRight: "6px",
                      cursor: "pointer",
                    }}
                    title="Sửa rạp phim"
                  >
                    <Settings size={16} color="#fff" />
                  </button>

                  <button
                    onClick={() => handleDeleteTheater(t.id)}
                    style={{
                      background: "#d32f2f",
                      border: "none",
                      borderRadius: "5px",
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                    title="Xóa rạp phim"
                  >
                    <Trash2 size={16} color="#fff" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal thêm / sửa rạp */}
      {isModalOpen && (
        <MovieModal
          title={selectedTheater ? "Sửa Rạp Phim" : "Thêm Rạp Phim"}
          onClose={handleCloseModal}
          onSave={handleSaveTheater}
          initialData={selectedTheater}
          fields={[
            { name: "name", label: "Tên rạp", type: "text" },
            { name: "location", label: "Địa chỉ", type: "text" },
            { name: "phone", label: "Số điện thoại", type: "text" },
          ]}
        />
      )}
    </div>
  );
}
