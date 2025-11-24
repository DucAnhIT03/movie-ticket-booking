import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Edit2, Search, Calendar, Clock, Film, Tv, X } from "lucide-react";
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

  // Edit state
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
      const params = {};
      if (filterMovieId) params.movieId = parseInt(filterMovieId, 10);
      if (filterScreenId) params.screenId = parseInt(filterScreenId, 10);
      
      const res = await showtimeService.getAllShowtimes(params);
      if (res.status === 200) {
        let items = res.data.items || res.data || [];
        
        // Lọc theo ngày nếu có
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
  }, [filterMovieId, filterScreenId, filterDate]);

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

      // Chuẩn hóa format thời gian
      let timeStr = editTime.trim();
      if (timeStr.split(':').length > 2) {
        const parts = timeStr.split(':');
        timeStr = `${parts[0]}:${parts[1]}`;
      }
      const [hours, minutes] = timeStr.split(':');
      const normalizedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      
      // Tạo Date theo local timezone để đảm bảo thời gian hiển thị đúng
      const [year, month, day] = editDate.split('-');
      const startDateTime = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1, // Month is 0-indexed
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
        loadShowtimes();
    } else {
        toast.error(res.data?.message || "Không thể xóa lịch chiếu (có thể đã có booking)");
      }
    } catch (error) {
      console.error("Error deleting showtime:", error);
      toast.error(error.response?.data?.message || "Lỗi khi xóa lịch chiếu!");
    }
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

  // Filter by search term
  const filtered = showtimes.filter((st) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const movieName = getMovieName(st.movieId || st.movie?.id).toLowerCase();
    const screenName = getScreenName(st.screenId || st.screen?.id).toLowerCase();
    return (
      movieName.includes(searchLower) ||
      screenName.includes(searchLower) ||
      String(st.id).includes(searchTerm)
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
        <Calendar /> Quản Lý Lịch Chiếu
      </h1>

      {/* Thanh tìm kiếm và bộ lọc */}
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
            onChange={(e) => setFilterMovieId(e.target.value)}
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
            onChange={(e) => setFilterScreenId(e.target.value)}
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
            onChange={(e) => setFilterDate(e.target.value)}
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

      {/* Loading state */}
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
        /* Bảng danh sách lịch chiếu */
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
              <th style={{ padding: "10px", textAlign: "center" }}>ID</th>
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
                // Edit mode
                <tr key={st.id} style={{ borderBottom: "1px solid #2a303d", background: "#1e2832" }}>
                  <td colSpan={6} style={{ padding: "20px" }}>
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
                // View mode
                <tr key={st.id} style={{ borderBottom: "1px solid #2a303d" }}>
                  <td style={{ padding: "10px", textAlign: "center" }}>#{st.id}</td>
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
    </div>
  );
}
