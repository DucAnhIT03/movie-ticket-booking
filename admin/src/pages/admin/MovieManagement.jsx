import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Settings, Search, Film, Calendar } from "lucide-react";
import { toast } from "react-toastify";
import MovieModal from "./MovieModal";
import MovieShowtimeManager from "./MovieShowtimeManager";
import movieService from "../../services/movies/movieService";
import genreService from "../../services/genres/genreService";
import theaterService from "../../services/theaters/theaterService";
import screenService from "../../services/screens/screenService";
import showtimeService from "../../services/showtimes/showtimeService";
import { sortByNewest } from "../../utils/sortUtils";

export default function MovieManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [screens, setScreens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showShowtimeManager, setShowShowtimeManager] = useState(false);
  const [selectedMovieForShowtime, setSelectedMovieForShowtime] = useState(null);

  useEffect(() => {
    loadMovies();
    loadGenres();
    loadTheaters();
    loadScreens();
  }, []);

  const loadMovies = async () => {
    setIsLoading(true);
    try {
      const res = await movieService.getAllMovies();
      if (res.status === 200) {
        setMovies(sortByNewest(res.data.items || res.data || []));
      } else if (res.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      } else if (res.status === 403) {
        toast.error("Bạn không có quyền truy cập!");
      } else {
        toast.error(res.data?.message || "Lỗi khi tải danh sách phim");
      }
    } catch (error) {
      console.error("Error loading movies:", error);
      toast.error("Lỗi kết nối đến server!");
    } finally {
      setIsLoading(false);
    }
  };

  const loadGenres = async () => {
    try {
      const res = await genreService.getAllGenres();
      if (res.status === 200) {
        setGenres(res.data.items || res.data || []);
      }
    } catch (error) {
      console.error("Error loading genres:", error);
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

  const handleOpenModal = (movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
    setIsModalOpen(false);
  };

  const handleSaveMovie = async (movieData) => {
    setIsSaving(true);
    setSaveProgress("Đang lưu phim...");
    
    try {
      // Chuyển đổi dữ liệu
      const releaseDate = movieData.release_date 
        ? new Date(movieData.release_date).toISOString()
        : new Date().toISOString();

      const startDate = movieData.start_date 
        ? new Date(movieData.start_date).toISOString()
        : undefined;
      const endDate = movieData.end_date 
        ? new Date(movieData.end_date).toISOString()
        : undefined;

      const payload = {
        title: movieData.title,
        description: movieData.descriptions || movieData.description,
        author: movieData.author,
        country: movieData.country,
        trailer: movieData.trailer,
        type: movieData.type || "2D",
        duration: parseInt(movieData.duration, 10) || 0,
        releaseDate: releaseDate,
        startDate: startDate,
        endDate: endDate,
      };

      // Chỉ thêm file nếu có upload mới
      if (movieData.file) {
        payload.file = movieData.file;
      }

      let movieId = movieData.id;
      let res;

      if (movieId) {
        // Cập nhật
        setSaveProgress("Đang cập nhật phim...");
        res = await movieService.updateMovie(movieId, payload);
        if (res.status === 200) {
          // Cập nhật thể loại nếu có
          if (movieData.genreIds && Array.isArray(movieData.genreIds) && movieData.genreIds.length > 0) {
            setSaveProgress("Đang cập nhật thể loại...");
            await movieService.setMovieGenres(movieId, movieData.genreIds);
          }

          const shouldCreateShowtimes =
            movieData.start_date &&
            movieData.end_date &&
            movieData.screenIds &&
            movieData.screenIds.length > 0 &&
            ((movieData.showtimesByDate &&
              Object.values(movieData.showtimesByDate).some((times) =>
                Array.isArray(times) && times.some((t) => t && t.trim() !== ''),
              )) ||
              (movieData.showtimes && Array.isArray(movieData.showtimes) && movieData.showtimes.some((t) => t && t.trim() !== '')));

          if (shouldCreateShowtimes) {
            setSaveProgress("Đang cập nhật suất chiếu...");
            await createShowtimesForMovie(movieId, movieData);
          }
          
          // Tối ưu: chỉ cập nhật phim trong danh sách thay vì reload toàn bộ
          const updatedMovie = res.data;
          setMovies(prevMovies =>
            sortByNewest(
              prevMovies.map(m =>
                m.id === movieId
                  ? {
                      ...m,
                      ...updatedMovie,
                      genres:
                        movieData.genreIds && genres.length > 0
                          ? genres
                              .filter(g => movieData.genreIds.includes(g.id))
                              .map(g => g.genreName || g.genre_name)
                          : m.genres,
                    }
                  : m,
              ),
            ),
          );
          
          toast.success("Cập nhật phim thành công!");
          handleCloseModal();
        } else {
          toast.error(res.data?.message || "Lỗi khi cập nhật phim");
        }
      } else {
        // Tạo mới
        setSaveProgress("Đang tạo phim mới...");
        res = await movieService.createMovie(payload);
        
        if (res.status === 201) {
          movieId = res.data.id;
          const newMovie = res.data;
          
          // Set thể loại nếu có
          if (movieData.genreIds && Array.isArray(movieData.genreIds) && movieData.genreIds.length > 0) {
            setSaveProgress("Đang thiết lập thể loại...");
            await movieService.setMovieGenres(movieId, movieData.genreIds);
            // Cập nhật genres cho newMovie
            newMovie.genres = genres
              .filter(g => movieData.genreIds.includes(g.id))
              .map(g => g.genreName || g.genre_name);
          }

          // Tạo showtimes nếu có thông tin
          if (movieData.start_date && movieData.end_date && movieData.screenIds && 
              (movieData.showtimesByDate || movieData.showtimes)) {
            setSaveProgress("Đang tạo suất chiếu...");
            await createShowtimesForMovie(movieId, movieData);
          }

          // Tối ưu: chỉ thêm phim mới vào danh sách thay vì reload toàn bộ
          setMovies(prevMovies => sortByNewest([newMovie, ...prevMovies]));
          
          toast.success("Thêm phim thành công!");
          handleCloseModal();
        } else {
          // Hiển thị lỗi chi tiết hơn
          const errorMessage = res.data?.message || res.data?.error || "Lỗi khi thêm phim";
          const errorDetails = Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage;
          console.error("Lỗi khi thêm phim:", res.data);
          toast.error(errorDetails);
        }
      }
    } catch (err) {
      console.error("Lỗi lưu phim:", err);
      toast.error("Lỗi kết nối đến server!");
    } finally {
      setIsSaving(false);
      setSaveProgress("");
    }
  };

  const createShowtimesForMovie = async (movieId, movieData) => {
    try {
      const { start_date, end_date, showtimesByDate, screenIds, duration } = movieData;
      
      if (!start_date || !end_date || !screenIds || screenIds.length === 0) {
        return;
      }

      const durationMinutes = parseInt(duration, 10) || 120;
      const promises = [];
      
      // Nếu có showtimesByDate, sử dụng giờ chiếu theo từng ngày
      const uniqueScreenIds = Array.from(new Set(screenIds.map(id => parseInt(id, 10))));

      if (showtimesByDate && Object.keys(showtimesByDate).length > 0) {
        Object.entries(showtimesByDate).forEach(([dateStr, times]) => {
          const validTimes = Array.isArray(times)
            ? Array.from(new Set(times.filter((t) => t && t.trim() !== "")))
            : [];
          
          if (validTimes.length > 0) {
            // Lặp qua từng phòng đã chọn
            for (const screenId of uniqueScreenIds) {
              // Lặp qua từng giờ chiếu của ngày này
              for (const time of validTimes) {
                // Đảm bảo time có format HH:mm (không có :00 ở cuối)
                let timeStr = time.trim();
                
                // Nếu time không có dấu :, bỏ qua
                if (!timeStr.includes(':')) {
                  console.warn(`Giờ chiếu không hợp lệ: ${timeStr}, bỏ qua`);
                  continue;
                }
                
                // Nếu time đã có format HH:mm:00, chỉ lấy HH:mm
                if (timeStr.split(':').length > 2) {
                  const parts = timeStr.split(':');
                  timeStr = `${parts[0]}:${parts[1]}`;
                }
                
                // Kiểm tra xem có phần giờ và phút không
                const [hours, minutes] = timeStr.split(':');
                if (!hours || hours.trim() === '' || !minutes || minutes.trim() === '') {
                  console.warn(`Giờ chiếu không hợp lệ (thiếu giờ hoặc phút): ${timeStr}, bỏ qua`);
                  continue;
                }
                
                // Validate format HH:mm
                const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(timeStr)) {
                  console.warn(`Giờ chiếu không hợp lệ: ${timeStr}, bỏ qua`);
                  continue;
                }
                
                try {
                  // Đảm bảo format đúng HH:mm (2 chữ số cho giờ và phút)
                  const normalizedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                  
                  // Tạo Date theo local timezone để đảm bảo thời gian hiển thị đúng
                  const [year, month, day] = dateStr.split('-');
                  const startDateTime = new Date(
                    parseInt(year, 10),
                    parseInt(month, 10) - 1, // Month is 0-indexed
                    parseInt(day, 10),
                    parseInt(normalizedTime.split(':')[0], 10),
                    parseInt(normalizedTime.split(':')[1], 10),
                    0,
                    0
                  );
                  
                  // Kiểm tra Date có hợp lệ không
                  if (isNaN(startDateTime.getTime())) {
                    console.error(`Không thể tạo Date từ: ${dateStr} ${normalizedTime}`);
                    continue;
                  }
                  
                  const endDateTime = new Date(startDateTime.getTime() + (durationMinutes * 60 * 1000));
                  
                  // Kiểm tra endDateTime có hợp lệ không
                  if (isNaN(endDateTime.getTime())) {
                    console.error(`Không thể tạo endTime từ startTime`);
                    continue;
                  }

                  promises.push(
                    showtimeService.createShowtime({
                      movieId: movieId,
                      screenId: parseInt(screenId, 10),
                      startTime: startDateTime.toISOString(),
                      endTime: endDateTime.toISOString(),
                    })
                  );
                } catch (error) {
                  console.error(`Lỗi khi tạo suất chiếu cho ${dateStr} ${timeStr}:`, error);
                }
              }
            }
          }
        });
      } else if (movieData.showtimes && Array.isArray(movieData.showtimes)) {
        // Fallback: nếu không có showtimesByDate, dùng showtimes chung (áp dụng cho tất cả ngày)
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        const showtimeHours = Array.from(
          new Set(movieData.showtimes.filter((h) => h && h.trim() !== "")),
        );

        if (showtimeHours.length > 0) {
          for (
            let date = new Date(startDate);
            date <= endDate;
            date.setDate(date.getDate() + 1)
          ) {
            const dateStr = date.toISOString().split("T")[0];

            for (const screenId of uniqueScreenIds) {
              for (const time of showtimeHours) {
                // Đảm bảo time có format HH:mm (không có :00 ở cuối)
                let timeStr = time.trim();
                
                // Nếu time không có dấu :, bỏ qua
                if (!timeStr.includes(':')) {
                  console.warn(`Giờ chiếu không hợp lệ: ${timeStr}, bỏ qua`);
                  continue;
                }
                
                // Nếu time đã có format HH:mm:00, chỉ lấy HH:mm
                if (timeStr.split(':').length > 2) {
                  const parts = timeStr.split(':');
                  timeStr = `${parts[0]}:${parts[1]}`;
                }
                
                // Kiểm tra xem có phần giờ và phút không
                const [hours, minutes] = timeStr.split(':');
                if (!hours || hours.trim() === '' || !minutes || minutes.trim() === '') {
                  console.warn(`Giờ chiếu không hợp lệ (thiếu giờ hoặc phút): ${timeStr}, bỏ qua`);
                  continue;
                }
                
                // Validate format HH:mm
                const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(timeStr)) {
                  console.warn(`Giờ chiếu không hợp lệ: ${timeStr}, bỏ qua`);
                  continue;
                }
                
                try {
                  // Đảm bảo format đúng HH:mm (2 chữ số cho giờ và phút)
                  const normalizedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                  
                  // Tạo Date theo local timezone để đảm bảo thời gian hiển thị đúng
                  const [year, month, day] = dateStr.split('-');
                  const startDateTime = new Date(
                    parseInt(year, 10),
                    parseInt(month, 10) - 1, // Month is 0-indexed
                    parseInt(day, 10),
                    parseInt(normalizedTime.split(':')[0], 10),
                    parseInt(normalizedTime.split(':')[1], 10),
                    0,
                    0
                  );
                  
                  // Kiểm tra Date có hợp lệ không
                  if (isNaN(startDateTime.getTime())) {
                    console.error(`Không thể tạo Date từ: ${dateStr} ${normalizedTime}`);
                    continue;
                  }
                  
                  const endDateTime = new Date(startDateTime.getTime() + (durationMinutes * 60 * 1000));
                  
                  // Kiểm tra endDateTime có hợp lệ không
                  if (isNaN(endDateTime.getTime())) {
                    console.error(`Không thể tạo endTime từ startTime`);
                    continue;
                  }

                  promises.push(
                    showtimeService.createShowtime({
                      movieId: movieId,
                      screenId,
                      startTime: startDateTime.toISOString(),
                      endTime: endDateTime.toISOString(),
                    })
                  );
                } catch (error) {
                  console.error(`Lỗi khi tạo suất chiếu cho ${dateStr} ${timeStr}:`, error);
                }
              }
            }
          }
        }
      }

      if (promises.length === 0) {
        return; // Không có giờ chiếu nào để tạo
      }

      // Tối ưu: xử lý theo batch để tránh quá tải
      const BATCH_SIZE = 20; // Xử lý 20 showtimes mỗi lần
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < promises.length; i += BATCH_SIZE) {
        const batch = promises.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(batch);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value.status === 201) {
            successCount++;
          } else {
            failCount++;
          }
        });

        // Cập nhật progress nếu có nhiều batch
        if (promises.length > BATCH_SIZE) {
          const progress = Math.min(100, Math.round(((i + batch.length) / promises.length) * 100));
          setSaveProgress(`Đang tạo suất chiếu... ${progress}%`);
        }
      }

      if (successCount > 0) {
        toast.success(`Đã tạo ${successCount} suất chiếu thành công!`);
      }
      if (failCount > 0) {
        toast.warning(`${failCount} suất chiếu không thể tạo (có thể bị trùng lịch)`);
      }
    } catch (error) {
      console.error("Error creating showtimes:", error);
      toast.error("Lỗi khi tạo suất chiếu!");
    }
  };

  const handleDeleteMovie = async (movieId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phim này không?")) {
      return;
    }

    try {
      const res = await movieService.deleteMovie(movieId);
      if (res.status === 200) {
        toast.success("Xóa phim thành công!");
        loadMovies();
      } else if (res.status === 404) {
        toast.error("Không tìm thấy phim");
      } else {
        toast.error(res.data?.message || "Lỗi khi xóa phim");
      }
    } catch (error) {
      console.error("Error deleting movie:", error);
      toast.error("Lỗi kết nối đến server!");
    }
  };

  const handleOpenShowtimeManager = (movie) => {
    setSelectedMovieForShowtime(movie);
    setShowShowtimeManager(true);
  };

  // ✅ Tìm kiếm (client-side)
  const filtered = movies.filter((m) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (m.title || "").toLowerCase().includes(searchLower) ||
      (m.author || "").toLowerCase().includes(searchLower) ||
      (m.country || "").toLowerCase().includes(searchLower)
    );
  });

  return (
    <div style={{ color: "#fff" }}>
      <h1 style={{ fontSize: "26px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <Film /> Quản Lý Phim
      </h1>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
        <div style={{ position: "relative" }}>
          <Search
            style={{ position: "absolute", left: "10px", top: "8px", color: "#aaa" }}
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm phim..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "5px",
              padding: "8px 10px 8px 35px",
              width: "250px",
              outline: "none"
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
            fontWeight: "500"
          }}
        >
          <PlusCircle size={18} /> Thêm Phim
        </button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
          Đang tải dữ liệu...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
          {searchTerm ? "Không tìm thấy phim nào" : "Chưa có phim nào"}
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#1a1f29", color: "#fff" }}>
          <thead style={{ background: "#242b36", textAlign: "left" }}>
            <tr>
              <th style={{ padding: "10px" }}>Ảnh</th>
              <th style={{ padding: "10px" }}>Tiêu đề</th>
              <th style={{ padding: "10px" }}>Tác giả</th>
              <th style={{ padding: "10px" }}>Quốc gia</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Thời lượng</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Ngày phát hành</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Thời gian công chiếu</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Thể loại</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Loại</th>
              <th style={{ padding: "10px", textAlign: "center" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((movie) => (
              <tr key={movie.id} style={{ borderBottom: "1px solid #2a303d" }}>
                <td style={{ padding: "10px", textAlign: "center" }}>
                  {movie.image ? (
                    <img
                      src={movie.image}
                      alt={movie.title}
                      style={{ width: "60px", height: "80px", borderRadius: "8px", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "60px", height: "80px", background: "#333", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontSize: "12px" }}>
                      No Image
                    </div>
                  )}
                </td>
                <td style={{ padding: "10px" }}>{movie.title || "—"}</td>
                <td style={{ padding: "10px" }}>{movie.author || "—"}</td>
                <td style={{ padding: "10px" }}>{movie.country || "—"}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>{movie.duration ? `${movie.duration} phút` : "—"}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>
                  {movie.releaseDate 
                    ? new Date(movie.releaseDate).toLocaleDateString("vi-VN")
                    : "—"}
                </td>
                <td style={{ padding: "10px", textAlign: "center", fontSize: "13px" }}>
                  {movie.startDate && movie.endDate ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ color: "#4caf50" }}>
                        Từ: {new Date(movie.startDate).toLocaleDateString("vi-VN")}
                      </div>
                      <div style={{ color: "#ff9800" }}>
                        Đến: {new Date(movie.endDate).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  ) : movie.startDate ? (
                    <div style={{ color: "#4caf50" }}>
                      Từ: {new Date(movie.startDate).toLocaleDateString("vi-VN")}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={{ padding: "10px", textAlign: "center" }}>
                  {movie.genres && movie.genres.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center" }}>
                      {movie.genres.slice(0, 2).map((genre, idx) => (
                        <span key={idx} style={{ 
                          background: "#1976d2", 
                          padding: "2px 6px", 
                          borderRadius: "4px", 
                          fontSize: "11px" 
                        }}>
                          {genre}
                        </span>
                      ))}
                      {movie.genres.length > 2 && (
                        <span style={{ fontSize: "11px", color: "#aaa" }}>+{movie.genres.length - 2}</span>
                      )}
                    </div>
                  ) : "—"}
                </td>
                <td style={{ padding: "10px", textAlign: "center" }}>{movie.type || "—"}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>
                  <button
                    onClick={() => handleOpenModal(movie)}
                    style={{
                      background: "#1976d2",
                      border: "none",
                      borderRadius: "5px",
                      padding: "6px 10px",
                      marginRight: "6px",
                      cursor: "pointer"
                    }}
                    title="Sửa phim"
                  >
                    <Settings size={16} color="#fff" />
                  </button>
                  <button
                    onClick={() => handleOpenShowtimeManager(movie)}
                    style={{
                      background: "#4caf50",
                      border: "none",
                      borderRadius: "5px",
                      padding: "6px 10px",
                      marginRight: "6px",
                      cursor: "pointer"
                    }}
                    title="Quản lý suất chiếu"
                  >
                    <Calendar size={16} color="#fff" />
                  </button>
                  <button
                    onClick={() => handleDeleteMovie(movie.id)}
                    style={{
                      background: "#d32f2f",
                      border: "none",
                      borderRadius: "5px",
                      padding: "6px 10px",
                      cursor: "pointer"
                    }}
                    title="Xóa phim"
                  >
                    <Trash2 size={16} color="#fff" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isModalOpen && (
        <MovieModal
          title={selectedMovie ? "Sửa Phim" : "Thêm Phim"}
          onClose={handleCloseModal}
          onSave={handleSaveMovie}
          isSaving={isSaving}
          saveProgress={saveProgress}
          initialData={selectedMovie ? {
            ...selectedMovie,
            descriptions: selectedMovie.description || selectedMovie.descriptions || "",
            release_date: selectedMovie.releaseDate 
              ? new Date(selectedMovie.releaseDate).toISOString().split("T")[0]
              : "",
            start_date: selectedMovie.startDate 
              ? new Date(selectedMovie.startDate).toISOString().split("T")[0]
              : "",
            end_date: selectedMovie.endDate 
              ? new Date(selectedMovie.endDate).toISOString().split("T")[0]
              : "",
            genreIds: selectedMovie.genres 
              ? genres
                  .filter(g => selectedMovie.genres.includes(g.genreName))
                  .map(g => g.id)
              : []
          } : null}
          fields={[
            { name: "title", label: "Tiêu đề", type: "text", required: true },
            { name: "descriptions", label: "Mô tả", type: "textarea" },
            { name: "author", label: "Tác giả/Đạo diễn", type: "text", row: "author-country" },
            { name: "country", label: "Quốc gia", type: "text", row: "author-country" },
            { name: "file", label: "Upload ảnh poster", type: "file", accept: "image/*", required: !selectedMovie, row: "file-trailer" },
            { name: "trailer", label: "Trailer (URL)", type: "text", required: false, row: "file-trailer" },
            {
              name: "type",
              label: "Định dạng phim",
              type: "select",
              required: true,
              defaultValue: "2D",
              row: "type-duration-release",
              options: [
                { value: "2D", label: "2D" },
                { value: "3D", label: "3D" },
              ],
            },
            { name: "duration", label: "Thời lượng (phút)", type: "number", required: true, row: "type-duration-release" },
            { name: "release_date", label: "Ngày phát hành", type: "date", required: true, row: "type-duration-release" },
            {
              name: "genreIds",
              label: "Thể loại (có thể chọn nhiều)",
              type: "multiselect",
              row: "genre-theater",
              options: genres.map(g => ({
                value: g.id,
                label: g.genreName || g.genre_name
              }))
            },
            {
              name: "theaterIds",
              label: "Chọn rạp (có thể chọn nhiều)",
              type: "multiselect",
              row: "genre-theater",
              options: theaters.map(t => ({
                value: t.id,
                label: `${t.name} - ${t.location}`
              }))
            },
            {
              name: "screenIds",
              label: "Chọn phòng chiếu (có thể chọn nhiều)",
              type: "multiselect",
              options: screens.map(s => ({
                value: s.id,
                label: `${s.name} (${s.seat_capacity} ghế) - ${theaters.find(t => t.id === s.theater_id)?.name || 'N/A'}`,
                theaterId: s.theater_id // Thêm theaterId để lọc
              }))
            },
            { name: "start_date", label: "Ngày bắt đầu công chiếu", type: "date", required: !selectedMovie, row: "start-end-date" },
            { name: "end_date", label: "Ngày kết thúc công chiếu", type: "date", required: !selectedMovie, row: "start-end-date" },
            {
              name: "showtimes",
              label: "Giờ chiếu trong ngày (có thể thêm nhiều giờ)",
              type: "showtimes"
            }
          ]}
        />
      )}

      {showShowtimeManager && selectedMovieForShowtime && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "#1a1f29",
            borderRadius: "16px",
            maxWidth: "800px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "20px"
          }}>
            <MovieShowtimeManager 
              movieId={selectedMovieForShowtime.id}
              movieDuration={selectedMovieForShowtime.duration}
              onClose={() => {
                setShowShowtimeManager(false);
                setSelectedMovieForShowtime(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
