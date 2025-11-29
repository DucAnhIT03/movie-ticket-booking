import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Edit2, Search, Calendar, Clock, Film, Tv, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import showtimeService from "../../services/showtimes/showtimeService";
import movieService from "../../services/movies/movieService";
import screenService from "../../services/screens/screenService";
import theaterService from "../../services/theaters/theaterService";
import { sortByNewest } from "../../utils/sortUtils";

export default function ShowtimeManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [screens, setScreens] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMovieId, setFilterMovieId] = useState("");
  const [filterScreenId, setFilterScreenId] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

 
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [editMovieId, setEditMovieId] = useState("");
  const [editScreenId, setEditScreenId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadShowtimes(),
        loadMovies(),
        loadScreens(),
        loadTheaters(),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadShowtimes = async () => {
    try {
      const params = {
        page,
        limit,
      };
      if (filterMovieId) params.movieId = parseInt(filterMovieId, 10);
      if (filterScreenId) params.screenId = parseInt(filterScreenId, 10);
      
      const res = await showtimeService.getAllShowtimes(params);
      if (res.status === 200) {
        const data = res.data || {};
        let items = data.items || [];
        
        
        if (filterDate) {
          const filterDateObj = new Date(filterDate);
          filterDateObj.setHours(0, 0, 0, 0);
          const filterDateEnd = new Date(filterDateObj);
          filterDateEnd.setHours(23, 59, 59, 999);
          
          items = items.filter(st => {
            const stDate = new Date(st.startTime);
            return stDate >= filterDateObj && stDate <= filterDateEnd;
          });
        }
        
        setShowtimes(sortByNewest(items));
        setTotal(data.total || items.length);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error loading showtimes:", error);
      toast.error("Lỗi khi tải danh sách lịch chiếu!");
    }
  };

  const loadMovies = async () => {
    try {
      const res = await movieService.getAllMovies();
      if (res.status === 200) {
        setMovies(res.data.items || res.data || []);
      }
    } catch (error) {
      console.error("Error loading movies:", error);
    }
  };

  const loadScreens = async () => {
    try {
      const res = await screenService.getAllScreens();
      if (res.status === 200) {
        setScreens(res.data.items || res.data || []);
      }
    } catch (error) {
      console.error("Error loading screens:", error);
    }
  };

  const loadTheaters = async () => {
    try {
      const res = await theaterService.getAllTheaters();
      if (res.status === 200) {
        setTheaters(res.data.items || res.data || []);
      }
    } catch (error) {
      console.error("Error loading theaters:", error);
    }
  };

  useEffect(() => {
    loadShowtimes();
  }, [filterMovieId, filterScreenId, filterDate, page, limit]);

  const handleEditShowtime = (showtime) => {
    setEditingShowtime(showtime);
    setEditMovieId(showtime.movieId?.toString() || showtime.movie?.id?.toString() || "");
    setEditScreenId(showtime.screenId?.toString() || showtime.screen?.id?.toString() || "");
    const startDate = new Date(showtime.startTime);
    setEditDate(startDate.toISOString().split("T")[0]);
    setEditTime(startDate.toTimeString().slice(0, 5));
  };

  const handleCancelEdit = () => {
    setEditingShowtime(null);
    setEditMovieId("");
    setEditScreenId("");
    setEditDate("");
    setEditTime("");
  };

  const handleUpdateShowtime = async () => {
    if (!editMovieId || !editScreenId || !editDate || !editTime) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      const movie = movies.find(m => m.id === parseInt(editMovieId, 10));
      if (!movie) {
        toast.error("Không tìm thấy phim!");
      return;
    }

    
      let timeStr = editTime.trim();
      if (timeStr.split(':').length > 2) {
        const parts = timeStr.split(':');
        timeStr = `${parts[0]}:${parts[1]}`;
      }
      const [hours, minutes] = timeStr.split(':');
      const normalizedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      
      
      const [year, month, day] = editDate.split('-');
      const startDateTime = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1, 
        parseInt(day, 10),
        parseInt(normalizedTime.split(':')[0], 10),
        parseInt(normalizedTime.split(':')[1], 10),
        0,
        0
      );
      
      if (isNaN(startDateTime.getTime())) {
        toast.error(`Không thể tạo thời gian từ: ${editDate} ${normalizedTime}`);
        return;
      }
      
      const endDateTime = new Date(startDateTime.getTime() + (movie.duration * 60 * 1000));
      
      if (isNaN(endDateTime.getTime())) {
        toast.error("Không thể tạo thời gian kết thúc!");
        return;
      }

      const res = await showtimeService.updateShowtime(editingShowtime.id, {
        movieId: parseInt(editMovieId, 10),
        screenId: parseInt(editScreenId, 10),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });

      if (res.status === 200) {
        toast.success("Cập nhật lịch chiếu thành công!");
        handleCancelEdit();
        loadShowtimes();
      } else {
        toast.error(res.data?.message || "Lỗi khi cập nhật lịch chiếu!");
      }
    } catch (error) {
      console.error("Error updating showtime:", error);
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật lịch chiếu!");
    }
  };

  const handleDeleteShowtime = async (showtimeId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch chiếu này không?")) {
      return;
    }

    try {
      const res = await showtimeService.deleteShowtime(showtimeId);
      if (res.status === 200) {
        toast.success("Xóa lịch chiếu thành công!");
       
        if (showtimes.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          loadShowtimes();
        }
    } else {
        toast.error(res.data?.message || "Không thể xóa lịch chiếu (có thể đã có booking)");
      }
    } catch (error) {
      console.error("Error deleting showtime:", error);
      toast.error(error.response?.data?.message || "Lỗi khi xóa lịch chiếu!");
    }
  };

  const gotoPrev = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  const gotoNext = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const handleFilterChange = () => {
    setPage(1); 
  };

  const getMovieName = (movieId) => {
    const movie = movies.find(m => m.id === movieId);
    return movie ? movie.title : `ID: ${movieId}`;
  };

  const getScreenName = (screenId) => {
    const screen = screens.find(s => s.id === screenId);
    if (!screen) return `ID: ${screenId}`;
    const theater = theaters.find(t => t.id === screen.theater_id);
    return `${screen.name} (${screen.seat_capacity} ghế)${theater ? ` - ${theater.name}` : ""}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
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

  const filtered = showtimes.filter((st) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const movieName = getMovieName(st.movieId || st.movie?.id).toLowerCase();
    return movieName.includes(searchLower);
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
        <Calendar /> Quản Lý Lịch Chiếu
      </h1>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "15px",
          gap: "10px",
          flexWrap: "wrap",
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
            placeholder="Tìm kiếm lịch chiếu..."
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

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={filterMovieId}
            onChange={(e) => {
              setFilterMovieId(e.target.value);
              handleFilterChange();
            }}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "5px",
              padding: "8px 10px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="" style={{ background: "#1a1f29" }}>Tất cả phim</option>
            {movies.map(movie => (
              <option key={movie.id} value={movie.id} style={{ background: "#1a1f29" }}>{movie.title}</option>
            ))}
          </select>

          <select
            value={filterScreenId}
            onChange={(e) => {
              setFilterScreenId(e.target.value);
              handleFilterChange();
            }}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "5px",
              padding: "8px 10px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="" style={{ background: "#1a1f29" }}>Tất cả phòng</option>
            {screens.map(screen => (
              <option key={screen.id} value={screen.id} style={{ background: "#1a1f29" }}>
                {screen.name} ({screen.seat_capacity} ghế)
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              handleFilterChange();
            }}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "5px",
              padding: "8px 10px",
              outline: "none",
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
          Đang tải dữ liệu...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
          {searchTerm || filterMovieId || filterScreenId || filterDate 
            ? "Không tìm thấy lịch chiếu nào" 
            : "Chưa có lịch chiếu nào"}
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
              <th style={{ padding: "10px", textAlign: "center" }}>Phim</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Phòng chiếu</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Thời gian bắt đầu</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Thời gian kết thúc</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((st) => (
              editingShowtime?.id === st.id ? (
                <tr key={st.id} style={{ borderBottom: "1px solid #2a303d", background: "#1e2832" }}>
                  <td colSpan={5} style={{ padding: "20px" }}>
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(2, 1fr)", 
                      gap: "15px", 
                      marginBottom: "15px" 
                    }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                          Phim
                        </label>
                        <select
                          value={editMovieId}
                          onChange={(e) => setEditMovieId(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            background: "#1a1f29",
                            border: "1px solid #333",
                            borderRadius: "5px",
                            color: "#fff",
                            fontSize: "14px",
                            cursor: "pointer",
                            outline: "none",
                          }}
                        >
                          <option value="" style={{ background: "#1a1f29" }}>-- Chọn phim --</option>
                          {movies.map(movie => (
                            <option key={movie.id} value={movie.id} style={{ background: "#1a1f29" }}>{movie.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                          Phòng chiếu
                        </label>
                        <select
                          value={editScreenId}
                          onChange={(e) => setEditScreenId(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            background: "#1a1f29",
                            border: "1px solid #333",
                            borderRadius: "5px",
                            color: "#fff",
                            fontSize: "14px",
                            cursor: "pointer",
                            outline: "none",
                          }}
                        >
                          <option value="" style={{ background: "#1a1f29" }}>-- Chọn phòng --</option>
                          {screens.map(screen => (
                            <option key={screen.id} value={screen.id} style={{ background: "#1a1f29" }}>
                              {screen.name} ({screen.seat_capacity} ghế)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                          Ngày chiếu
                        </label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            background: "#1a1f29",
                            border: "1px solid #333",
                            borderRadius: "5px",
                            color: "#fff",
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                          Giờ chiếu
                        </label>
                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                          {(() => {
                            const [hours = "00", minutes = "00"] = editTime.split(":");
                            const hourValue = parseInt(hours, 10) || 0;
                            const minuteValue = parseInt(minutes, 10) || 0;
                            
                            return (
                              <>
                                <select
                                  value={hourValue}
                                  onChange={(e) => {
                                    const newHour = e.target.value.padStart(2, "0");
                                    setEditTime(`${newHour}:${minutes}`);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: "8px 10px",
                                    background: "#1a1f29",
                                    border: "1px solid #333",
                                    borderRadius: "5px",
                                    color: "#fff",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    outline: "none"
                                  }}
                                >
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <option key={i} value={i} style={{ background: "#1a1f29" }}>
                                      {i.toString().padStart(2, "0")}h
                                    </option>
                                  ))}
                                </select>
                                <span style={{ color: "#fff", fontSize: "14px" }}>:</span>
                                <select
                                  value={minuteValue}
                                  onChange={(e) => {
                                    const newMinute = e.target.value.padStart(2, "0");
                                    setEditTime(`${hours}:${newMinute}`);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: "8px 10px",
                                    background: "#1a1f29",
                                    border: "1px solid #333",
                                    borderRadius: "5px",
                                    color: "#fff",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    outline: "none"
                                  }}
                                >
                                  {Array.from({ length: 60 }, (_, i) => (
                                    <option key={i} value={i} style={{ background: "#1a1f29" }}>
                                      {i.toString().padStart(2, "0")}
                                    </option>
                                  ))}
                                </select>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={handleUpdateShowtime}
                        style={{
                          background: "#1976d2",
                          border: "none",
                          color: "#fff",
                          padding: "8px 16px",
                          borderRadius: "5px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Lưu thay đổi
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          background: "#666",
                          border: "none",
                          color: "#fff",
                          padding: "8px 16px",
                          borderRadius: "5px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={st.id} style={{ borderBottom: "1px solid #2a303d" }}>
                  <td style={{ padding: "10px", textAlign: "center" }}>{getMovieName(st.movieId || st.movie?.id)}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>{getScreenName(st.screenId || st.screen?.id)}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>{formatDateTime(st.startTime)}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>{formatDateTime(st.endTime)}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <button
                      onClick={() => handleEditShowtime(st)}
                      style={{
                        background: "#1976d2",
                        border: "none",
                        borderRadius: "5px",
                        padding: "6px 10px",
                        marginRight: "6px",
                        cursor: "pointer",
                      }}
                      title="Sửa lịch chiếu"
                    >
                      <Edit2 size={16} color="#fff" />
                    </button>
                    <button
                      onClick={() => handleDeleteShowtime(st.id)}
                      style={{
                        background: "#d32f2f",
                        border: "none",
                        borderRadius: "5px",
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                      title="Xóa lịch chiếu"
                    >
                      <Trash2 size={16} color="#fff" />
                    </button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      )}

      {!isLoading && filtered.length > 0 && (
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
              ? `Hiển thị ${(page - 1) * limit + 1}-${Math.min(total, page * limit)} trong ${total} lịch chiếu`
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
    </div>
  );
}
