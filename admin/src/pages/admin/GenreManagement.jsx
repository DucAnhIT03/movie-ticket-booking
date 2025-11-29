import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Settings, Search, Tags } from "lucide-react";
import { toast } from "react-toastify";
import GenreModal from "./GenreModal";
import genreService from "../../services/genres/genreService";
import { sortByNewest } from "../../utils/sortUtils";

export default function GenreManagement() {
    const [searchTerm, setSearchTerm] = useState("");
    const [genres, setGenres] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState(null);

    // ✅ Lấy dữ liệu từ API (có phân trang + tìm kiếm)
    useEffect(() => {
        loadGenres({ page: 1 });
    }, []);

    const loadGenres = async ({ page: targetPage = page, search: targetSearch } = {}) => {
        setIsLoading(true);
        try {
            const res = await genreService.getAllGenres({
                page: targetPage,
                limit,
                search: (targetSearch ?? searchTerm) || undefined,
            });
            if (res.status === 200) {
                const data = res.data || {};
                const items = data.items || data.data || data || [];
                setGenres(sortByNewest(items));
                setPage(data.page || targetPage);
                setTotalItems(data.total ?? items.length ?? 0);
                setTotalPages(data.totalPages || Math.max(1, Math.ceil((data.total || items.length || 1) / limit)));
            } else if (res.status === 401) {
                toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
            } else if (res.status === 403) {
                toast.error("Bạn không có quyền truy cập!");
            } else {
                toast.error(res.data?.message || "Lỗi khi tải danh sách thể loại");
            }
        } catch (error) {
            console.error("Error loading genres:", error);
            toast.error("Lỗi kết nối đến server!");
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ Tự động reload khi gõ tìm kiếm (debounce nhẹ)
    useEffect(() => {
        const handle = setTimeout(() => {
            loadGenres({ page: 1, search: searchTerm });
        }, 400);
        return () => clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    // ✅ Mở modal
    const handleOpenModal = (genre) => {
        setSelectedGenre(genre);
        setIsModalOpen(true);
    };

    // ✅ Đóng modal
    const handleCloseModal = () => {
        setSelectedGenre(null);
        setIsModalOpen(false);
    };

    // ✅ Lưu thể loại
    const handleSaveGenre = async (data) => {
        // Chuyển đổi từ genre_name (UI) sang genreName (API)
        const genreName = data.genre_name || data.genreName;
        
        if (!genreName || !genreName.trim()) {
            toast.error("Tên thể loại không được để trống!");
            return;
        }

        const trimmedName = genreName.trim();

        try {
            if (data.id) {
                // Cập nhật - kiểm tra trùng tên (trừ chính nó)
                const existingGenre = genres.find(
                    (g) => 
                        (g.genreName || g.genre_name)?.toLowerCase() === trimmedName.toLowerCase() &&
                        g.id !== data.id
                );
                if (existingGenre) {
                    toast.error("Tên thể loại đã tồn tại! Vui lòng chọn tên khác.");
                    return;
                }

                const res = await genreService.updateGenre(data.id, { genreName: trimmedName });
                if (res.status === 200) {
                    toast.success("Cập nhật thể loại thành công!");
                    loadGenres(); // Reload danh sách
                    handleCloseModal();
                } else if (res.status === 404) {
                    toast.error("Không tìm thấy thể loại");
                } else {
                    // Xử lý lỗi từ backend (có thể là duplicate)
                    const errorMessage = res.data?.message || "Lỗi khi cập nhật thể loại";
                    if (errorMessage.toLowerCase().includes("duplicate") || 
                        errorMessage.toLowerCase().includes("unique") ||
                        errorMessage.toLowerCase().includes("trùng")) {
                        toast.error("Tên thể loại đã tồn tại! Vui lòng chọn tên khác.");
                    } else {
                        toast.error(errorMessage);
                    }
                }
            } else {
                // Thêm mới - kiểm tra trùng tên
                const existingGenre = genres.find(
                    (g) => (g.genreName || g.genre_name)?.toLowerCase() === trimmedName.toLowerCase()
                );
                if (existingGenre) {
                    toast.error("Tên thể loại đã tồn tại! Vui lòng chọn tên khác.");
                    return;
                }

                const res = await genreService.createGenre({ genreName: trimmedName });
                if (res.status === 201) {
                    toast.success("Thêm thể loại thành công!");
                    loadGenres(); // Reload danh sách
                    handleCloseModal();
                } else {
                    // Xử lý lỗi từ backend (có thể là duplicate)
                    const errorMessage = res.data?.message || "Lỗi khi thêm thể loại";
                    if (errorMessage.toLowerCase().includes("duplicate") || 
                        errorMessage.toLowerCase().includes("unique") ||
                        errorMessage.toLowerCase().includes("trùng")) {
                        toast.error("Tên thể loại đã tồn tại! Vui lòng chọn tên khác.");
                    } else {
                        toast.error(errorMessage);
                    }
                }
            }
        } catch (error) {
            console.error("Error saving genre:", error);
            // Kiểm tra lỗi từ response
            const errorMessage = error.response?.data?.message || error.message || "Lỗi kết nối đến server!";
            if (errorMessage.toLowerCase().includes("duplicate") || 
                errorMessage.toLowerCase().includes("unique") ||
                errorMessage.toLowerCase().includes("trùng")) {
                toast.error("Tên thể loại đã tồn tại! Vui lòng chọn tên khác.");
            } else {
                toast.error(errorMessage);
            }
        }
    };

    // ✅ Xóa
    const handleDeleteGenre = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa thể loại này không?")) {
            return;
        }

        try {
            const res = await genreService.deleteGenre(id);
            if (res.status === 200) {
                toast.success("Xóa thể loại thành công!");
                loadGenres(); // Reload danh sách
            } else if (res.status === 404) {
                toast.error("Không tìm thấy thể loại");
            } else {
                toast.error(res.data?.message || "Lỗi khi xóa thể loại");
            }
        } catch (error) {
            console.error("Error deleting genre:", error);
            toast.error("Lỗi kết nối đến server!");
        }
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
                <Tags /> Quản Lý Thể Loại Phim
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
                        placeholder="Tìm kiếm thể loại..."
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
                    <PlusCircle size={18} /> Thêm Thể Loại
                </button>
            </div>

            {/* Loading state */}
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
                    Đang tải dữ liệu...
                </div>
            ) : genres.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
                    {searchTerm ? "Không tìm thấy thể loại nào" : "Chưa có thể loại nào"}
                </div>
            ) : (
                /* Bảng danh sách */
                <>
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
                                <th style={{ padding: "10px", textAlign: "center" }}>Tên thể loại</th>
                                <th style={{ padding: "10px", textAlign: "center" }}>Hành động</th>
                            </tr>
                        </thead>

                        <tbody>
                            {genres.map((g) => (
                                <tr key={g.id} style={{ borderBottom: "1px solid #2a303d" }}>
                                    <td style={{ padding: "10px", textAlign: "center" }}>
                                        {g.genreName || g.genre_name || "—"}
                                    </td>
                                    <td style={{ padding: "10px", textAlign: "center" }}>
                                        <button
                                            onClick={() => handleOpenModal(g)}
                                            style={{
                                                background: "#1976d2",
                                                border: "none",
                                                borderRadius: "5px",
                                                padding: "6px 10px",
                                                marginRight: "6px",
                                                cursor: "pointer",
                                            }}
                                            title="Sửa thể loại"
                                        >
                                            <Settings size={16} color="#fff" />
                                        </button>

                                        <button
                                            onClick={() => handleDeleteGenre(g.id)}
                                            style={{
                                                background: "#d32f2f",
                                                border: "none",
                                                borderRadius: "5px",
                                                padding: "6px 10px",
                                                cursor: "pointer",
                                            }}
                                            title="Xóa thể loại"
                                        >
                                            <Trash2 size={16} color="#fff" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Phân trang */}
                    <div
                        style={{
                            marginTop: "16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            color: "#e5e7eb",
                            fontSize: "14px",
                        }}
                    >
                        <span>
                            Trang {page} / {totalPages}{" "}
                            {totalItems ? `(${totalItems} thể loại)` : ""}
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                onClick={() => page > 1 && loadGenres({ page: page - 1 })}
                                disabled={page <= 1 || isLoading}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #374151",
                                    background: page <= 1 ? "#111827" : "#1f2937",
                                    color: "#e5e7eb",
                                    cursor: page <= 1 || isLoading ? "not-allowed" : "pointer",
                                }}
                            >
                                Trước
                            </button>
                            <button
                                onClick={() =>
                                    page < totalPages && loadGenres({ page: page + 1 })
                                }
                                disabled={page >= totalPages || isLoading}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #374151",
                                    background:
                                        page >= totalPages ? "#111827" : "#1f2937",
                                    color: "#e5e7eb",
                                    cursor:
                                        page >= totalPages || isLoading
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Modal thêm / sửa */}
            {isModalOpen && (
                <GenreModal
                    title={selectedGenre ? "Sửa Thể Loại" : "Thêm Thể Loại"}
                    onClose={handleCloseModal}
                    onSave={handleSaveGenre}
                    initialData={selectedGenre ? {
                        ...selectedGenre,
                        genre_name: selectedGenre.genreName || selectedGenre.genre_name
                    } : null}
                    fields={[
                        { name: "genre_name", label: "Tên thể loại", type: "text", required: true },
                    ]}
                />
            )}
        </div>
    );
}
