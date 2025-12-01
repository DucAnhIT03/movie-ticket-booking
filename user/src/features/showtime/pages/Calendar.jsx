import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Calendar.css";
import Header from "../../../shared/layout/Header/Header.jsx";
import Footer from "../../../shared/layout/Footer/Footer.jsx";
import { useMovies } from "../../home/hooks/useMovies";
import { formatGenres, getGenresData } from "../../../shared/utils/formatGenres";
import showtimeService from "../../../services/showtimes/showtimeService";
import movieService from "../../../services/movies/movieService";
import MovieCard from "../../home/components/MovieCard/MovieCard";

function Calendar() {
  const navigate = useNavigate();
  const { nowShowing, loading, error } = useMovies();
  const [showtimes, setShowtimes] = useState([]);
  const [showtimesLoading, setShowtimesLoading] = useState(false);
  const [moviesFromShowtimes, setMoviesFromShowtimes] = useState([]);
  const timezoneOffset = useMemo(() => new Date().getTimezoneOffset(), []);
  
  
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

  
  const handleTimeClick = (showtimeId, time, movieId) => {
    localStorage.setItem("selectedShowtimeId", showtimeId);
    localStorage.setItem("selectedTime", time);
    localStorage.setItem("selectedDate", selectedDate);
    if (movieId) {
      localStorage.setItem("selectedMovieId", movieId);
    }
   
    navigate("/choose-seat");
  };

 
  const convertDateToAPIFormat = (dateStr) => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };

  
  const nowShowingMovieIds = useMemo(() => {
    if (!nowShowing || !Array.isArray(nowShowing)) return [];
    return nowShowing.map(m => m.id);
  }, [nowShowing]);


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
          
          
          const movieIds = new Set();
          showtimesData.forEach(st => {
            const movieId = st.movieId || st.movie?.id;
            if (movieId) {
              movieIds.add(movieId);
            }
          });
          
        
          const movieIdsArray = Array.from(movieIds);
          const moviesToFetch = movieIdsArray.filter(id => {
           
            const showtime = showtimesData.find(st => (st.movieId || st.movie?.id) === id);
           
            if (showtime && showtime.movie && showtime.movie.id && showtime.movie.title) {
              return false;
            }
            
            return true;
          });
          
          if (moviesToFetch.length > 0) {
         
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

  
  const getMoviesToDisplay = () => {
   
    if (!showtimes || showtimes.length === 0) {
      return [];
    }
    
    const moviesMap = new Map();
    
      showtimes.forEach(st => {
      const movieId = st.movieId || st.movie?.id;
      if (!movieId) return;
      
      if (!moviesMap.has(movieId)) {
        let movie = null;
        
        
        if (moviesFromShowtimes && Array.isArray(moviesFromShowtimes)) {
          movie = moviesFromShowtimes.find(m => m.id === movieId);
        }
       
        if (!movie && nowShowing && Array.isArray(nowShowing)) {
          movie = nowShowing.find(m => m.id === movieId);
        }
       
        if (!movie && st.movie && st.movie.id && st.movie.title) {
          movie = st.movie;
        }
        
       
        if (!movie && st.movie) {
          movie = st.movie; 
        }
        
       
        if (movie && (!movie.genres && !movie.movieGenres && !movie.genre)) {
          
          const fullMovie = moviesFromShowtimes?.find(m => m.id === movieId) || 
                           nowShowing?.find(m => m.id === movieId);
          if (fullMovie) {
            
            movie = {
              ...movie,
              genres: fullMovie.genres || movie.genres,
              movieGenres: fullMovie.movieGenres || movie.movieGenres,
              genre: fullMovie.genre || movie.genre
            };
          }
        }
        
        
        if (movie) {
          moviesMap.set(movieId, movie);
        }
      }
    });
    
    
    return Array.from(moviesMap.values());
  };

  
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
        
        const screenId = st.screenId || st.screen?.id || `screen-${index}`;
       
        const uniqueId = st.id || `showtime-${movieId}-${screenId}-${st.startTime}-${index}`;
        
        return {
          time: `${hours}:${minutes}`,
          id: uniqueId, 
          screenId: screenId,
          showtime: st 
        };
      })
      .filter(item => item !== null) 
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
                  const movieShowtimes = getShowtimesForMovie(movie.id);
                  
                  return (
                    <div key={movie.id} className="calendar-movie-wrapper">
                      <MovieCard movie={movie} />
                      <div className="showtimes-container">
                        <div className="times">
                          {movieShowtimes && movieShowtimes.length > 0 ? (
                            movieShowtimes.map((timeObj, index) => {
                              
                              if (!timeObj || typeof timeObj !== 'object') {
                                return null;
                              }
                              
                            
                              const uniqueKey = timeObj.id 
                                ? `showtime-${timeObj.id}` 
                                : `showtime-${movie.id}-${timeObj.time || 'time'}-${timeObj.screenId || 'screen'}-${index}`;
                              
                             
                              let timeString = '';
                              if (typeof timeObj.time === 'string') {
                                timeString = timeObj.time;
                              } else if (timeObj.time) {
                                timeString = String(timeObj.time);
                              } else {
                                timeString = '';
                              }
                              
                           
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
                            }).filter(Boolean) 
                          ) : (
                            <p className="no-showtimes">Chưa có suất chiếu</p>
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
