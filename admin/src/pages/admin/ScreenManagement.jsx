import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Settings, Search, Monitor, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import MovieModal from "./MovieModal"; // vẫn dùng modal cũ
import screenService from "../../services/screens/screenService";
import theaterService from "../../services/theaters/theaterService";
import { sortByNewest } from "../../utils/sortUtils";

export default function ScreenManagement() {
    const [searchTerm, setSearchTerm] = useState("");
    const [query, setQuery] = useState("");
    const [screens, setScreens] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedScreen, setSelectedScreen] = useState(null);
    const [theaterFilter, setTheaterFilter] = useState("");

  
    useEffect(() => {
        loadTheaters();
    }, []);

    useEffect(() => {
        loadScreens();
    }, [page, limit, query, theaterFilter]);

    const loadScreens = async () => {
        setIsLoading(true);
        try {
            const params = {
                page,
                limit,
                search: query || undefined,
                theater_id: theaterFilter || undefined,
            };
            const res = await screenService.getAllScreens(params);
            if (res.status === 200) {
                const data = res.data || {};
                const items = data.items || [];
                setScreens(sortByNewest(items));
                setTotal(data.total || items.length);
                setTotalPages(data.totalPages || 1);
            } else if (res.status === 401) {
                toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
            } else if (res.status === 403) {
                toast.error("Bạn không có quyền truy cập!");
            } else {
                toast.error(res.data?.message || "Lỗi khi tải danh sách phòng chiếu");
            }
        } catch (error) {
            console.error("Error loading screens:", error);
            toast.error("Lỗi kết nối đến server!");
        } finally {
            setIsLoading(false);
        }
    };

    const loadTheaters = async () => {
        try {
            const res = await theaterService.getAllTheaters();
            if (res.status === 200) {
                const theatersData = res.data.items || res.data || [];
                setTheaters(theatersData);
            }
        } catch (error) {
            console.error("Error loading theaters:", error);
            
        }
    };

    const handleOpenModal = (screen) => {
        setSelectedScreen(screen);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedScreen(null);
        setIsModalOpen(false);
    };

    const handleSaveScreen = async (data) => {
        
        if (!data.name || !data.name.trim()) {
            toast.error("Tên phòng chiếu không được để trống!");
            return;
        }
        if (data.seat_capacity === undefined || data.seat_capacity === null) {
            toast.error("Số lượng ghế không được để trống!");
            return;
        }
        if (data.seat_capacity < 0) {
            toast.error("Số lượng ghế phải ≥ 0!");
            return;
        }
        if (!data.theater_id || data.theater_id < 1) {
            toast.error("ID rạp không hợp lệ!");
            return;
        }

        const payload = {
            name: data.name.trim(),
            seat_capacity: parseInt(data.seat_capacity, 10),
            theater_id: parseInt(data.theater_id, 10),
        };

        try {
            if (data.id) {
                
                const res = await screenService.updateScreen(data.id, payload);
                if (res.status === 200) {
                    toast.success("Cập nhật phòng chiếu thành công!");
                    loadScreens(); 
                    handleCloseModal();
                } else if (res.status === 404) {
                    toast.error("Không tìm thấy phòng chiếu");
                } else if (res.status === 400) {
                    toast.error(res.data?.message || "Dữ liệu không hợp lệ");
                } else {
                    toast.error(res.data?.message || "Lỗi khi cập nhật phòng chiếu");
                }
            } else {
                
                const res = await screenService.createScreen(payload);
                if (res.status === 201) {
                    toast.success("Thêm phòng chiếu thành công!");
                    loadScreens(); 
                    handleCloseModal();
                } else if (res.status === 400) {
                    toast.error(res.data?.message || "Dữ liệu không hợp lệ");
                } else {
                    toast.error(res.data?.message || "Lỗi khi thêm phòng chiếu");
                }
            }
        } catch (error) {
            console.error("Error saving screen:", error);
            const errorMessage = error.response?.data?.message || error.message || "Lỗi kết nối đến server!";
            toast.error(errorMessage);
        }
    };

    const handleDeleteScreen = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa phòng chiếu này không?")) {
            return;
        }

        try {
            const res = await screenService.deleteScreen(id);
            if (res.status === 200) {
                toast.success("Xóa phòng chiếu thành công!");
                
                if (screens.length === 1 && page > 1) {
                    setPage(page - 1);
                } else {
                    loadScreens();
                }
            } else if (res.status === 404) {
                toast.error("Không tìm thấy phòng chiếu");
            } else {
                toast.error(res.data?.message || "Lỗi khi xóa phòng chiếu");
            }
        } catch (error) {
            console.error("Error deleting screen:", error);
            toast.error("Lỗi kết nối đến server!");
        }
    };

    const handleSearch = () => {
        setPage(1);
        setQuery(searchTerm.trim());
    };

    const handleResetSearch = () => {
        setSearchTerm("");
        setQuery("");
        setTheaterFilter("");
        setPage(1);
    };

    const gotoPrev = () => {
        if (page > 1) setPage((prev) => prev - 1);
    };

    const gotoNext = () => {
        if (page < totalPages) setPage((prev) => prev + 1);
    };

    const currentRangeStart = (page - 1) * limit + 1;
    const currentRangeEnd = Math.min(total, page * limit);

    
    const getTheaterInfo = (theaterId) => {
        const theater = theaters.find(t => t.id === theaterId);
        return theater || null;
    };

    
    const formatDate = (dateString) => {
        if (!dateString) return "—";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch (e) {
            return "—";
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
                <Monitor /> Quản Lý Phòng Chiếu
            </h1>

            {/* Thanh tìm kiếm */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "15px",
                    gap: "10px",
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
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
                            placeholder="Tìm theo tên phòng hoặc tên rạp..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    handleSearch();
                                }
                            }}
                            style={{
                                background: "#1a1f29",
                                color: "#fff",
                                border: "1px solid #333",
                                borderRadius: "5px",
                                padding: "8px 10px 8px 35px",
                                width: "260px",
                                outline: "none",
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        style={{
                            background: "#2563eb",
                            color: "#fff",
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "500",
                        }}
                    >
                        Tìm kiếm
                    </button>
                    {query && (
                        <button
                            onClick={handleResetSearch}
                            style={{
                                background: "#1f2937",
                                color: "#fff",
                                padding: "8px 16px",
                                border: "1px solid #374151",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "500",
                            }}
                        >
                            Xóa lọc
                        </button>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <select
                        value={theaterFilter}
                        onChange={(e) => {
                            setPage(1);
                            setTheaterFilter(e.target.value);
                        }}
                        style={{
                            background: "#1a1f29",
                            color: "#fff",
                            border: "1px solid #333",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            minWidth: "200px",
                        }}
                    >
                        <option value="">Tất cả rạp</option>
                        {theaters.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>

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
                        <PlusCircle size={18} /> Thêm Phòng Chiếu
                    </button>
                </div>
            </div>

            {/* Loading state */}
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
                    Đang tải dữ liệu...
                </div>
            ) : screens.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
                    {query ? "Không tìm thấy phòng chiếu nào" : "Chưa có phòng chiếu nào"}
                </div>
            ) : (
                /* Bảng phòng chiếu */
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
                            <th style={{ padding: "10px", textAlign: "center" }}>Tên phòng</th>
                            <th style={{ padding: "10px", textAlign: "center" }}>
                                Số lượng ghế
                            </th>
                            <th style={{ padding: "10px", textAlign: "center" }}>Tên rạp</th>
                            <th style={{ padding: "10px", textAlign: "center" }}>Địa chỉ</th>
                            <th style={{ padding: "10px", textAlign: "center" }}>Ngày tạo</th>
                            <th style={{ padding: "10px", textAlign: "center" }}>Hành động</th>
                        </tr>
                    </thead>

                    <tbody>
                        {screens.map((screen) => {
                            const theater = getTheaterInfo(screen.theater_id);
                            return (
                                <tr key={screen.id} style={{ borderBottom: "1px solid #2a303d" }}>
                                    <td style={{ padding: "10px", textAlign: "center" }}>{screen.name || "—"}</td>
                                    <td style={{ padding: "10px", textAlign: "center" }}>
                                        {screen.seat_capacity !== undefined ? screen.seat_capacity : "—"}
                                    </td>
                                    <td style={{ padding: "10px", textAlign: "center" }}>
                                        {theater?.name || "—"}
                                    </td>
                                    <td style={{ padding: "10px", textAlign: "center" }}>
                                        {theater?.location || "—"}
                                    </td>
                                    <td style={{ padding: "10px", textAlign: "center" }}>
                                        {formatDate(screen.created_at)}
                                    </td>

                                    <td style={{ padding: "10px", textAlign: "center" }}>
                                        <button
                                            onClick={() => handleOpenModal(screen)}
                                            style={{
                                                background: "#1976d2",
                                                border: "none",
                                                borderRadius: "5px",
                                                padding: "6px 10px",
                                                marginRight: "6px",
                                                cursor: "pointer",
                                            }}
                                            title="Sửa phòng chiếu"
                                        >
                                            <Settings size={16} color="#fff" />
                                        </button>

                                        <button
                                            onClick={() => handleDeleteScreen(screen.id)}
                                            style={{
                                                background: "#d32f2f",
                                                border: "none",
                                                borderRadius: "5px",
                                                padding: "6px 10px",
                                                cursor: "pointer",
                                            }}
                                            title="Xóa phòng chiếu"
                                        >
                                            <Trash2 size={16} color="#fff" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

            {/* Phân trang */}
            {!isLoading && screens.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "16px",
                        flexWrap: "wrap",
                        gap: "10px",
                    }}
                >
                    <div style={{ color: "#cbd5f5" }}>
                        {total > 0
                            ? `Hiển thị ${currentRangeStart}-${currentRangeEnd} trong ${total} phòng chiếu`
                            : "Không có dữ liệu"}
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            style={{
                                background: "#1a1f29",
                                color: "#fff",
                                border: "1px solid #333",
                                borderRadius: "6px",
                                padding: "6px 12px",
                                cursor: "pointer",
                            }}
                        >
                            {[10, 20, 50].map((size) => (
                                <option key={size} value={size}>
                                    {size} / trang
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={gotoPrev}
                            disabled={page === 1 || isLoading}
                            style={{
                                background: "#1f2937",
                                color: "#fff",
                                border: "1px solid #374151",
                                borderRadius: "6px",
                                padding: "6px 12px",
                                cursor: page === 1 || isLoading ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                opacity: page === 1 || isLoading ? 0.5 : 1,
                            }}
                        >
                            <ChevronLeft size={16} /> Trước
                        </button>
                        <div style={{ display: "flex", alignItems: "center", color: "#cbd5f5" }}>
                            Trang {page}/{Math.max(totalPages, 1)}
                        </div>
                        <button
                            onClick={gotoNext}
                            disabled={page >= totalPages || isLoading}
                            style={{
                                background: "#1f2937",
                                color: "#fff",
                                border: "1px solid #374151",
                                borderRadius: "6px",
                                padding: "6px 12px",
                                cursor: page >= totalPages || isLoading ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                opacity: page >= totalPages || isLoading ? 0.5 : 1,
                            }}
                        >
                            Sau <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal thêm/sửa phòng */}
            {isModalOpen && (
                <MovieModal
                    title={selectedScreen ? "Sửa Phòng Chiếu" : "Thêm Phòng Chiếu"}
                    onClose={handleCloseModal}
                    onSave={handleSaveScreen}
                    initialData={selectedScreen}
                    fields={[
                        { name: "name", label: "Tên phòng", type: "text", required: true },
                        { name: "seat_capacity", label: "Số lượng ghế", type: "number", required: true },
                        { 
                            name: "theater_id", 
                            label: "Rạp phim", 
                            type: "select", 
                            required: true,
                            options: theaters.map(t => ({
                                value: t.id,
                                label: `${t.name} (${t.location})`
                            }))
                        },
                    ]}
                />
            )}
        </div>
    );
}
