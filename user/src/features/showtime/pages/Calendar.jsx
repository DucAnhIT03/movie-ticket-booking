import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Calendar.css";
import Header from "../../../shared/layout/Header/Header.jsx";
import Footer from "../../../shared/layout/Footer/Footer.jsx";
import { useMovies } from "../../home/hooks/useMovies";
import { formatGenres, getGenresData } from "../../../shared/utils/formatGenres";
import showtimeService from "../../../services/showtimes/showtimeService";
import movieService from "../../../services/movies/movieService";

function Calendar() {
  const navigate = useNavigate();
  const { nowShowing, loading, error } = useMovies();
  const [showtimes, setShowtimes] = useState([]);
  const [showtimesLoading, setShowtimesLoading] = useState(false);
  const [moviesFromShowtimes, setMoviesFromShowtimes] = useState([]);
  const timezoneOffset = useMemo(() => new Date().getTimezoneOffset(), []);
  
  // Tạo danh sách 5 ngày kể từ hôm nay
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      dates.push(`${day}-${month}-${year}`);
    }
    
    return dates;
  };

  const dates = getAvailableDates();
  const [selectedDate, setSelectedDate] = useState(dates[0] || "");
  
  // Format ngày phát hành (DD/MM/YYYY)
  const formatDate = (movie) => {
    let dateString = movie.startDate || movie.start_date || movie.releaseDate || movie.release_date;
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format độ tuổi với mô tả đầy đủ
  const formatAgeRating = (rating) => {
    if (!rating) return "";
    
    const ratingMap = {
      'K': 'K - Phim được phổ biến đến người xem dưới 13 tuổi và có người bảo hộ đi kèm',
      'T13': 'T13 - Phim được phổ biến đến người xem từ đủ 13 tuổi trở lên (13+)',
      'T16': 'T16 - Phim được phổ biến đến người xem từ đủ 16 tuổi trở lên (16+)',
      'T18': 'T18 - Phim được phổ biến đến người xem từ đủ 18 tuổi trở lên (18+)',
      'C': 'C - Phim không được phổ biến đến người xem dưới 18 tuổi'
    };
    
    return ratingMap[rating] || `${rating} - Phim phổ biến theo độ tuổi`;
  };

  // Xử lý khi click vào nút giờ chiếu
  const handleTimeClick = (showtimeId, time, movieId) => {
    localStorage.setItem("selectedShowtimeId", showtimeId);
    localStorage.setItem("selectedTime", time);
    localStorage.setItem("selectedDate", selectedDate);
    if (movieId) {
      localStorage.setItem("selectedMovieId", movieId);
    }
    // Navigate to choose seat page
    navigate("/choose-seat");
  };

  // Convert date từ DD-MM-YYYY sang YYYY-MM-DD
  const convertDateToAPIFormat = (dateStr) => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };

  // Memoize movie IDs để tránh dependency array thay đổi
  const nowShowingMovieIds = useMemo(() => {
    if (!nowShowing || !Array.isArray(nowShowing)) return [];
    return nowShowing.map(m => m.id);
  }, [nowShowing]);

  // Fetch showtimes theo ngày đã chọn và fetch thông tin phim nếu thiếu
  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchShowtimes = async () => {
      setShowtimesLoading(true);
      try {
        const apiDate = convertDateToAPIFormat(selectedDate);
        const response = await showtimeService.getByDate(apiDate, timezoneOffset);
        
        if (response.status === 200) {
          const showtimesData = response.data || [];
          setShowtimes(showtimesData);
          
          // Lấy danh sách movieId từ showtimes
          const movieIds = new Set();
          showtimesData.forEach(st => {
            const movieId = st.movieId || st.movie?.id;
            if (movieId) {
              movieIds.add(movieId);
            }
          });
          
          // Fetch TẤT CẢ phim có showtimes để đảm bảo không bị mất phim
          // Chỉ skip những phim đã có đầy đủ thông tin trong st.movie
          const movieIdsArray = Array.from(movieIds);
          const moviesToFetch = movieIdsArray.filter(id => {
            // Kiểm tra xem showtime có thông tin movie đầy đủ không
            const showtime = showtimesData.find(st => (st.movieId || st.movie?.id) === id);
            // Nếu showtime có movie với đầy đủ thông tin (có title), không cần fetch
            if (showtime && showtime.movie && showtime.movie.id && showtime.movie.title) {
              return false;
            }
            // Còn lại đều cần fetch để đảm bảo có đầy đủ thông tin
            return true;
          });
          
          if (moviesToFetch.length > 0) {
            // Fetch từng phim
            const moviePromises = moviesToFetch.map(id => 
              movieService.getMovieById(id)
            );
            
            const movieResponses = await Promise.all(moviePromises);
            const fetchedMovies = movieResponses
              .filter(res => res.status === 200 && res.data)
              .map(res => res.data);
            
            setMoviesFromShowtimes(fetchedMovies);
          } else {
            setMoviesFromShowtimes([]);
          }
        } else {
          console.error("Error fetching showtimes:", response);
          setShowtimes([]);
          setMoviesFromShowtimes([]);
        }
      } catch (err) {
        console.error("Error fetching showtimes:", err);
        setShowtimes([]);
        setMoviesFromShowtimes([]);
      } finally {
        setShowtimesLoading(false);
      }
    };

    fetchShowtimes();
  }, [selectedDate, nowShowingMovieIds]);

  // Chỉ hiển thị phim có showtimes trong ngày đã chọn
  const getMoviesToDisplay = () => {
    // Nếu không có showtimes, không hiển thị phim nào
    if (!showtimes || showtimes.length === 0) {
      return [];
    }
    
    // Tạo map phim từ showtimes - đảm bảo tất cả phim có showtimes đều được hiển thị
    const moviesMap = new Map();
    
    showtimes.forEach(st => {
      const movieId = st.movieId || st.movie?.id;
      if (!movieId) return;
      
      // Nếu chưa có trong map, thử lấy từ nhiều nguồn
      if (!moviesMap.has(movieId)) {
        let movie = null;
        
        // Ưu tiên 1: Lấy từ showtime.movie (nếu có đầy đủ thông tin)
        if (st.movie && st.movie.id && st.movie.title) {
          movie = st.movie;
        } 
        // Ưu tiên 2: Lấy từ moviesFromShowtimes (đã fetch riêng - đảm bảo có đầy đủ)
        else if (moviesFromShowtimes && Array.isArray(moviesFromShowtimes)) {
          movie = moviesFromShowtimes.find(m => m.id === movieId);
        }
        // Ưu tiên 3: Lấy từ nowShowing
        else if (nowShowing && Array.isArray(nowShowing)) {
          movie = nowShowing.find(m => m.id === movieId);
        }
        
        // Nếu vẫn không tìm thấy, tạo object phim tạm từ showtime để hiển thị
        // Đảm bảo không bị mất phim
        if (!movie && st.movie) {
          movie = st.movie; // Dùng thông tin từ showtime.movie dù không đầy đủ
        }
        
        // Thêm vào map nếu có movie (kể cả tạm thời)
        if (movie) {
          moviesMap.set(movieId, movie);
        }
      }
    });
    
    // Trả về danh sách phim có showtimes trong ngày đã chọn
    return Array.from(moviesMap.values());
  };

  // Lấy showtimes của một phim (trả về cả time và showtime id để làm key)
  const getShowtimesForMovie = (movieId) => {
    if (!showtimes || !Array.isArray(showtimes)) return [];
    
    return showtimes
      .filter(st => {
        if (!st) return false;
        const stMovieId = st.movieId || st.movie?.id;
        return stMovieId === movieId;
      })
      .map((st, index) => {
        if (!st.startTime) return null;
        
        const startTime = new Date(st.startTime);
        if (isNaN(startTime.getTime())) return null;
        
        const hours = String(startTime.getHours()).padStart(2, "0");
        const minutes = String(startTime.getMinutes()).padStart(2, "0");
        // Lấy screenId để phân biệt các phòng chiếu
        const screenId = st.screenId || st.screen?.id || `screen-${index}`;
        // Đảm bảo luôn có id duy nhất
        const uniqueId = st.id || `showtime-${movieId}-${screenId}-${st.startTime}-${index}`;
        
        return {
          time: `${hours}:${minutes}`,
          id: uniqueId, // Đảm bảo luôn có id duy nhất
          screenId: screenId, // Lưu screenId để phân biệt phòng
          showtime: st // Giữ nguyên showtime để dùng sau này
        };
      })
      .filter(item => item !== null) // Loại bỏ các item null
      .sort((a, b) => a.time.localeCompare(b.time));
  };


  return (
    <div className="calendar-page">
      <Header />

      <div className="app">
        <h1 className="movie-title">
          <span className="title-bullet">•</span> Phim đang chiếu
        </h1>

        <div className="date-buttons">
          {dates.map((d) => (
            <button
              key={d}
              className={`date-btn ${selectedDate === d ? "active" : ""}`}
              onClick={() => setSelectedDate(d)}
            >
              {d}
            </button>
          ))}
        </div>

        <p className="note">
          <span className="note-label">Lưu ý:</span> Khán giả dưới 13 tuổi chỉ
          chọn suất chiếu kết thúc trước 22h và dưới 16 tuổi chỉ chọn suất chiếu
          kết thúc trước 23h.
        </p>

        {loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "#ccc" }}>
            <p>Đang tải danh sách phim...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "#ff6b6b" }}>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && nowShowing.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            <p>Chưa có phim nào đang chiếu</p>
          </div>
        )}

        {showtimesLoading && (
          <div style={{ textAlign: "center", padding: "20px", color: "#ccc" }}>
            <p>Đang tải lịch chiếu...</p>
          </div>
        )}

        {!loading && !error && !showtimesLoading && (
          <>
            {getMoviesToDisplay().length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                <p>Chưa có suất chiếu nào trong ngày {selectedDate}</p>
              </div>
            ) : (
              <div className="movie-list">
                {getMoviesToDisplay().map((movie) => {
                  const genresData = getGenresData(movie);
                  const genre = formatGenres(genresData);
                  const releaseDate = formatDate(movie);
                  const posterUrl = movie.image || movie.poster || "/logo.png";
                  const movieShowtimes = getShowtimesForMovie(movie.id);
                  
                  return (
                    <div key={movie.id} className="movie-card">
                      <Link
                        to={`/movie-detail/${movie.id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <img
                          src={posterUrl}
                          alt={movie.title || "Movie poster"}
                          className="poster"
                          onError={(e) => {
                            e.target.src = "/logo.png";
                          }}
                        />
                      </Link>
                      <div className="movie-details">
                        <Link
                          to={`/movie-detail/${movie.id}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <h2>{movie.title || "Chưa có tên"}</h2>
                        </Link>
                        <p className="movie-meta">
                          {genre && <span>{genre}</span>}
                          {movie.duration && <span>{movie.duration} phút</span>}
                          <span>2D</span>
                        </p>
                        {movie.country && (
                          <p>
                            <b>Xuất xứ:</b> {movie.country}
                          </p>
                        )}
                        {releaseDate && (
                          <p>
                            <b>Khởi chiếu:</b> {releaseDate}
                          </p>
                        )}
                        {movie.rating && (
                          <p className="age">{formatAgeRating(movie.rating)}</p>
                        )}
                        <div className="times">
                          {movieShowtimes && movieShowtimes.length > 0 ? (
                            movieShowtimes.map((timeObj, index) => {
                              // Đảm bảo timeObj hợp lệ
                              if (!timeObj || typeof timeObj !== 'object') {
                                return null;
                              }
                              
                              // Key duy nhất: dùng id làm key chính (luôn unique)
                              // Nếu không có id, tạo key từ movie.id, time, screenId và index
                              const uniqueKey = timeObj.id 
                                ? `showtime-${timeObj.id}` 
                                : `showtime-${movie.id}-${timeObj.time || 'time'}-${timeObj.screenId || 'screen'}-${index}`;
                              
                              // Đảm bảo time là string - kiểm tra kỹ
                              let timeString = '';
                              if (typeof timeObj.time === 'string') {
                                timeString = timeObj.time;
                              } else if (timeObj.time) {
                                timeString = String(timeObj.time);
                              } else {
                                timeString = '';
                              }
                              
                              // Nếu không có time string hợp lệ, không render
                              if (!timeString) {
                                return null;
                              }
                              
                              return (
                                <button 
                                  key={uniqueKey} 
                                  className="time-btn"
                                  onClick={() => handleTimeClick(timeObj.id, timeString, movie.id)}
                                >
                                  {timeString}
                                </button>
                              );
                            }).filter(Boolean) // Loại bỏ các null
                          ) : (
                            <p style={{ color: "#888", fontSize: "0.9rem" }}>Chưa có suất chiếu</p>
                          )}
                        </div>
                      </div> 
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Calendar;
