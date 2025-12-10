import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../shared/layout/Header/Header";
import Footer from "../../../shared/layout/Footer/Footer";
import "./choose_seat.css";
import room from "../../../assets/room.png";
import { FaTimes } from "react-icons/fa";
import MovieInfo from "../../Movie/components/MovieInfo";
import MovieSchedule from "../../Movie/components/MovieSchedule";
import { Link } from "react-router-dom";
import seatService from "../../../services/seats/seatService";
import movieService from "../../../services/movies/movieService";
import showtimeService from "../../../services/showtimes/showtimeService";
import ticketPriceService from "../../../services/ticket-prices/ticketPriceService";
import theaterService from "../../../services/theaters/theaterService";
import seatBookingSocket from "../../../services/seatBookingSocket";
import { validateSeatSelection } from "../utils/seatValidation";
import { isAuthenticated } from "../../../shared/utils/auth";

export default function ChooseSeat() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [showtimeId, setShowtimeId] = useState(null);
  const [showtime, setShowtime] = useState("18:00");
  const [selectedDate, setSelectedDate] = useState("");
  const [movie, setMovie] = useState(null);
  const [seats, setSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [bookedSeatIds, setBookedSeatIds] = useState(new Set());
  const [screenInfo, setScreenInfo] = useState(null);
  const [showtimeInfo, setShowtimeInfo] = useState(null);
  const [theaterInfo, setTheaterInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(""); 

  
  useEffect(() => {
    const savedShowtimeId = localStorage.getItem("selectedShowtimeId");
    const savedTime = localStorage.getItem("selectedTime");
    const savedDate = localStorage.getItem("selectedDate");
    const savedMovieId = localStorage.getItem("selectedMovieId");

    if (savedShowtimeId) {
      setShowtimeId(parseInt(savedShowtimeId));
    }
    if (savedTime) {
      setShowtime(savedTime);
    }
    if (savedDate) {
      setSelectedDate(savedDate);
    }

    
    if (savedMovieId) {
      movieService.getMovieById(savedMovieId).then(res => {
        if (res.status === 200 && res.data) {
          setMovie(res.data);
        }
      });
    }

    if (savedShowtimeId) {
    
      showtimeService.getById(parseInt(savedShowtimeId)).then(res => {
        if (res.status === 200 && res.data) {
          const currentShowtime = res.data;
          setShowtimeInfo(currentShowtime);
          setScreenInfo(currentShowtime.screen);
          
          
          console.log("Current showtime:", currentShowtime);
          console.log("Screen info:", currentShowtime.screen);
          
          const theater = currentShowtime.screen?.theater || 
                         currentShowtime.screen?.Theater || 
                         currentShowtime.theater ||
                         currentShowtime.Theater;
          
          console.log("Theater from showtime:", theater);
          
          if (theater && (theater.id || theater.name)) {
            
            console.log("Setting theater info from showtime:", theater);
            setTheaterInfo(theater);
          } else {
         
            const theaterId = currentShowtime.screen?.theaterId || 
                             currentShowtime.screen?.theater_id ||
                             currentShowtime.theaterId ||
                             currentShowtime.theater_id;
            console.log("Theater ID found:", theaterId);
            if (theaterId) {
              theaterService.getById(theaterId).then(theaterRes => {
                console.log("Theater API response:", theaterRes);
                if (theaterRes.status === 200 && theaterRes.data) {
                  console.log("Setting theater info from API:", theaterRes.data);
                  setTheaterInfo(theaterRes.data);
                } else {
                  console.warn("Failed to fetch theater:", theaterRes);
                }
              }).catch(err => {
                console.error("Error fetching theater:", err);
              });
            } else {
        
              showtimeService.getAll({}).then(allRes => {
                if (allRes.status === 200 && allRes.data) {
                  const allShowtimes = Array.isArray(allRes.data) ? allRes.data : allRes.data.data || [];
                  const foundShowtime = allShowtimes.find(st => st.id === parseInt(savedShowtimeId));
                  if (foundShowtime) {
                    const fallbackTheater = foundShowtime.screen?.theater || 
                                           foundShowtime.screen?.Theater || 
                                           foundShowtime.theater ||
                                           foundShowtime.Theater;
                    if (fallbackTheater && (fallbackTheater.id || fallbackTheater.name)) {
                      setTheaterInfo(fallbackTheater);
                    } else {
                      const fallbackTheaterId = foundShowtime.screen?.theaterId || 
                                               foundShowtime.screen?.theater_id ||
                                               foundShowtime.theaterId;
                      if (fallbackTheaterId) {
                        theaterService.getById(fallbackTheaterId).then(theaterRes => {
                          if (theaterRes.status === 200 && theaterRes.data) {
                            setTheaterInfo(theaterRes.data);
                          }
                        });
                      }
                    }
                  }
                }
              });
            }
          }
        } else {
      
          showtimeService.getAll({}).then(allRes => {
            if (allRes.status === 200 && allRes.data) {
              const allShowtimes = Array.isArray(allRes.data) ? allRes.data : allRes.data.data || [];
          const currentShowtime = allShowtimes.find(st => st.id === parseInt(savedShowtimeId));
          if (currentShowtime) {
            setShowtimeInfo(currentShowtime);
            setScreenInfo(currentShowtime.screen);
                
                const theater = currentShowtime.screen?.theater || 
                               currentShowtime.screen?.Theater || 
                               currentShowtime.theater ||
                               currentShowtime.Theater;
                
                if (theater && (theater.id || theater.name)) {
                  setTheaterInfo(theater);
                } else {
                  const theaterId = currentShowtime.screen?.theaterId || 
                                   currentShowtime.screen?.theater_id ||
                                   currentShowtime.theaterId;
                  if (theaterId) {
                    theaterService.getById(theaterId).then(theaterRes => {
                      if (theaterRes.status === 200 && theaterRes.data) {
                        setTheaterInfo(theaterRes.data);
                      }
                    });
                  }
                }
              }
            }
          });
        }
      }).catch(err => {
        console.error("Error fetching showtime:", err);
      
        showtimeService.getAll({}).then(allRes => {
          if (allRes.status === 200 && allRes.data) {
            const allShowtimes = Array.isArray(allRes.data) ? allRes.data : allRes.data.data || [];
            const currentShowtime = allShowtimes.find(st => st.id === parseInt(savedShowtimeId));
            if (currentShowtime) {
              setShowtimeInfo(currentShowtime);
              setScreenInfo(currentShowtime.screen);
              
              const theater = currentShowtime.screen?.theater || 
                             currentShowtime.screen?.Theater || 
                             currentShowtime.theater ||
                             currentShowtime.Theater;
              
              if (theater && (theater.id || theater.name)) {
                setTheaterInfo(theater);
              } else {
                const theaterId = currentShowtime.screen?.theaterId || 
                                 currentShowtime.screen?.theater_id ||
                                 currentShowtime.theaterId;
                if (theaterId) {
                  theaterService.getById(theaterId).then(theaterRes => {
                    if (theaterRes.status === 200 && theaterRes.data) {
                      setTheaterInfo(theaterRes.data);
                    }
                  });
                }
              }
            }
          }
        });
      });
    }
  }, []);

  
  const buildSeatGrid = useCallback((seatsData) => {
    const bookedIds = new Set();
    seatsData.forEach(seat => {
      const isBooked = seat.isBooked || seat.booked || false;
      if (isBooked) {
        bookedIds.add(seat.id);
      }
    });

    const seatsByRow = {};
    seatsData.forEach(seat => {
      const seatNumber = seat.seatNumber || seat.seat_number || "";
      if (!seatNumber) return;

      const match = seatNumber.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const row = match[1];
        if (!seatsByRow[row]) {
          seatsByRow[row] = [];
        }

        seatsByRow[row].push({
          id: seat.id,
          seatCode: seatNumber,
          booked: seat.isBooked || seat.booked || bookedIds.has(seat.id),
          type: seat.type || "STANDARD",
          isHidden: seat.isHidden || seat.is_hidden || false, 
          colNumber: parseInt(match[2]) 
        });
      }
    });

    Object.keys(seatsByRow).forEach(row => {
      seatsByRow[row].sort((a, b) => a.colNumber - b.colNumber);
    });

    const seatsGrid = Object.keys(seatsByRow)
      .sort()
      .map(row => seatsByRow[row]);

    setBookedSeatIds(bookedIds);
    setSeats(seatsGrid);
  }, []);

  const fetchSeats = useCallback(async () => {
    if (!showtimeId) return;
    setSeatsLoading(true);
    try {
      const response = await seatService.getByShowtime(showtimeId);
      if (response.status === 200) {
        const seatsData = (response.data || []).map(seat => ({
          ...seat,
          type: seat.type || "STANDARD",
        }));
        buildSeatGrid(seatsData);
      }
    } catch (err) {
      console.error("Error fetching seats:", err);
      setSeats([]);
    } finally {
      setSeatsLoading(false);
    }
  }, [showtimeId, buildSeatGrid]);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  // Lắng nghe realtime: chỉ cập nhật những ghế thay đổi
  useEffect(() => {
    if (!showtimeId) return;
    const socket = seatBookingSocket.connect();

    const handleSeatUpdate = ({ showtimeId: updateShowtimeId, seatIds, action }) => {
      if (!updateShowtimeId || updateShowtimeId !== showtimeId) return;

      // Nếu không có seatIds hoặc yêu cầu sync thì refetch
      if (!seatIds || seatIds.length === 0 || action === "SYNC") {
        fetchSeats();
        return;
      }

      setSeats((prev) => {
        if (!prev || prev.length === 0) return prev;
        const updated = prev.map((row) =>
          row.map((seat) => {
            if (!seatIds.includes(seat.id)) return seat;
            if (action === "BOOKED") {
              return { ...seat, booked: true };
            }
            if (action === "RELEASED") {
              return { ...seat, booked: false };
            }
            return seat;
          })
        );
        return updated;
      });

      setBookedSeatIds((prev) => {
        const next = new Set(prev);
        seatIds.forEach((id) => {
          if (action === "BOOKED") next.add(id);
          if (action === "RELEASED") next.delete(id);
        });
        return next;
      });

      // Bỏ chọn ghế vừa bị người khác đặt
      if (action === "BOOKED") {
        setSelected((prev) => prev.filter((key) => {
          const [seatId] = key.split("-");
          return !seatIds.includes(parseInt(seatId));
        }));
      }
    };

    socket && seatBookingSocket.onSeatUpdate(handleSeatUpdate);
    return () => {
      seatBookingSocket.offSeatUpdate(handleSeatUpdate);
    };
  }, [showtimeId, fetchSeats]);

  const toggleSeat = (seatId, seatCode) => {
    setSelected((prev) => {
      const seatKey = `${seatId}-${seatCode}`;
      
      if (prev.includes(seatKey)) {
        setErrorMessage(""); 
        return prev.filter((s) => s !== seatKey);
      } 
      
      const validation = validateSeatSelection(prev, seatCode, seats);
      
      if (!validation.valid) {
        setErrorMessage(validation.message);
        
        const timeoutId = setTimeout(() => {
          setErrorMessage("");
        }, 5000);
        
        return prev;
      }
      
      setErrorMessage("");
      return [...prev, seatKey];
    });
  };

 
  // Cache để lưu giá theo cache key
  const priceCacheRef = useRef(new Map());
  
  // Tạo cache key từ các tham số
  const createCacheKey = useCallback((seatType, movieId, movieType, date, time, theaterId) => {
    return `${seatType}_${movieId || 'null'}_${movieType}_${date}_${time || 'null'}_${theaterId || 'null'}`;
  }, []);

  const movieId = useMemo(() => movie?.id ? parseInt(movie.id) : null, [movie?.id]);
  const movieType = useMemo(() => movie?.type || '2D', [movie?.type]);
  
  const getSeatPriceRef = useRef(null);
  
  // Hàm lấy giá với cache
  const getSeatPrice = useCallback(async (seatType, movieIdParam = null) => {
    const movieIdToUse = movieIdParam || movieId;
    const movieTypeToUse = movieType;
    const theaterIdToUse = screenInfo?.theaterId || showtimeInfo?.screen?.theaterId || showtimeInfo?.theaterId || null;

    if (!selectedDate || !showtime) {
      const defaultPrices = {
        STANDARD: 90000,
        VIP: 120000,
        SWEETBOX: 150000
      };
      return defaultPrices[seatType] || 90000;
    }

    // Tạo cache key
    let apiDate;
    if (selectedDate.includes("-")) {
      const parts = selectedDate.split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          apiDate = selectedDate;
        } else {
          const [day, month, year] = parts;
          apiDate = `${year}-${month}-${day}`;
        }
      } else {
        apiDate = selectedDate;
      }
    } else {
      apiDate = selectedDate;
    }

    const cacheKey = createCacheKey(seatType, movieIdToUse, movieTypeToUse, apiDate, showtime, theaterIdToUse);
    
    // Kiểm tra cache trước
    if (priceCacheRef.current.has(cacheKey)) {
      const cachedPrice = priceCacheRef.current.get(cacheKey);
      if (cachedPrice && cachedPrice.promise) {
        // Đang fetch, đợi kết quả
        return await cachedPrice.promise;
      }
      if (cachedPrice && cachedPrice.price) {
        return cachedPrice.price;
      }
    }

    // Tạo promise để cache
    const pricePromise = (async () => {
      try {
        const response = await ticketPriceService.getPrice(
          seatType,
          movieTypeToUse,
          apiDate,
          showtime,
          movieIdToUse,
          theaterIdToUse
        );

        if (response.status === 200) {
          let price = null;
          
          if (typeof response.data === 'number') {
            price = response.data;
          } else if (typeof response.data === 'string' && response.data.trim() !== '') {
            const parsed = parseFloat(response.data);
            if (!isNaN(parsed)) {
              price = parsed;
            }
          } else if (typeof response.data === 'object' && response.data !== null) {
            price = response.data.price || response.data.value || response.data.amount || null;
          }
          
          const priceNum = typeof price === 'number' ? price : (price ? parseFloat(price) : null);
          
          if (priceNum !== null && !isNaN(priceNum) && priceNum > 0) {
            // Lưu vào cache
            priceCacheRef.current.set(cacheKey, { price: priceNum, timestamp: Date.now() });
            return priceNum;
          }
        }
      } catch (error) {
        console.error("Error fetching ticket price:", error);
      }

      // Fallback về giá mặc định
      const defaultPrices = {
        STANDARD: 90000,
        VIP: 120000,
        SWEETBOX: 150000
      };
      const defaultPrice = defaultPrices[seatType] || 90000;
      priceCacheRef.current.set(cacheKey, { price: defaultPrice, timestamp: Date.now() });
      return defaultPrice;
    })();

    // Lưu promise vào cache để tránh duplicate requests
    priceCacheRef.current.set(cacheKey, { promise: pricePromise });
    
    try {
      const result = await pricePromise;
      // Cập nhật cache với giá thực tế
      if (priceCacheRef.current.has(cacheKey)) {
        const cached = priceCacheRef.current.get(cacheKey);
        if (cached && cached.promise) {
          priceCacheRef.current.set(cacheKey, { price: result, timestamp: Date.now() });
        }
      }
      return result;
    } catch (error) {
      // Xóa promise khỏi cache nếu lỗi
      priceCacheRef.current.delete(cacheKey);
      const defaultPrices = {
        STANDARD: 90000,
        VIP: 120000,
        SWEETBOX: 150000
      };
      return defaultPrices[seatType] || 90000;
    }
  }, [movieId, movieType, selectedDate, showtime, screenInfo, showtimeInfo, createCacheKey]);
  
  useEffect(() => {
    getSeatPriceRef.current = getSeatPrice;
  }, [getSeatPrice]);

  
  const [totalPrice, setTotalPrice] = useState(0);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);


  const selectedHash = useMemo(() => {
    return selected.length > 0 ? [...selected].sort().join('|') : '';
  }, [selected]);
  

  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  

  const prevDepsRef = useRef({
    selectedHash: '',
    movieId: null,
    selectedDate: '',
    showtime: '',
    seatsLength: 0
  });
  const isCalculatingRef = useRef(false);
  const calculationTimeoutRef = useRef(null);
  
  useEffect(() => {
    const currentSelected = selectedRef.current;
    
    if (currentSelected.length === 0) {
      setTotalPrice(0);
      setIsCalculatingPrice(false);
      prevDepsRef.current = {
        selectedHash: '',
        movieId: null,
        selectedDate: '',
        showtime: '',
        seatsLength: 0
      };
      isCalculatingRef.current = false;
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
        calculationTimeoutRef.current = null;
      }
      return;
    }

    if (!movieId || !selectedDate || !showtime || seats.length === 0) {
      setIsCalculatingPrice(false);
      isCalculatingRef.current = false;
      return;
    }

    const currentDeps = {
      selectedHash,
      movieId,
      selectedDate,
      showtime,
      seatsLength: seats.length
    };
    
    const depsChanged = 
      prevDepsRef.current.selectedHash !== currentDeps.selectedHash ||
      prevDepsRef.current.movieId !== currentDeps.movieId ||
      prevDepsRef.current.selectedDate !== currentDeps.selectedDate ||
      prevDepsRef.current.showtime !== currentDeps.showtime ||
      prevDepsRef.current.seatsLength !== currentDeps.seatsLength;
   
    if (!depsChanged) {
      return;
    }
    
    prevDepsRef.current = currentDeps;

    // Clear timeout cũ nếu có
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }

    // Debounce nhẹ để tránh tính toán quá nhiều khi click nhanh
    calculationTimeoutRef.current = setTimeout(async () => {
      if (isCalculatingRef.current) {
        return;
      }

      isCalculatingRef.current = true;
      setIsCalculatingPrice(true);
      
      try {
        const flatSeats = seats.flat();
        const seatPriceMap = new Map(); // Map để group seats theo type
        
        // Group seats theo type để giảm số lượng API calls
        const seatsByType = new Map();
        for (const seatKey of selectedRef.current) {
          const [seatId, seatCode] = seatKey.split('-');
          const seat = flatSeats.find(s => s.id === parseInt(seatId));
          const seatType = seat?.type || "STANDARD";
          
          if (!seatsByType.has(seatType)) {
            seatsByType.set(seatType, []);
          }
          seatsByType.get(seatType).push({ seatKey, seatId, seatCode, seat });
        }
        
        // Fetch tất cả prices song song theo từng type
        const pricePromises = Array.from(seatsByType.entries()).map(async ([seatType, seatList]) => {
          if (getSeatPriceRef.current) {
            const price = await getSeatPriceRef.current(seatType, movieId);
            const validPrice = (price && !isNaN(price) && price > 0) ? price : 0;
            
            // Lưu giá cho tất cả seats cùng type
            seatList.forEach(({ seatKey }) => {
              seatPriceMap.set(seatKey, validPrice);
            });
            
            return { seatType, price: validPrice, count: seatList.length };
          }
          return null;
        });
        
        // Đợi tất cả prices được fetch
        await Promise.all(pricePromises);
        
        // Tính tổng từ map
        let total = 0;
        for (const seatKey of selectedRef.current) {
          const price = seatPriceMap.get(seatKey) || 0;
          total += price;
        }
        
        setTotalPrice(total);
      } catch (error) {
        console.error("Error calculating total price:", error);
        setTotalPrice(0);
      } finally {
        setIsCalculatingPrice(false);
        isCalculatingRef.current = false;
        calculationTimeoutRef.current = null;
      }
    }, 100); // Debounce 100ms
    
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [selectedHash, movieId, selectedDate, showtime, seats.length]);
  const selectedSeatCodes = selected.map(s => s.split('-')[1]);

  const handlePayment = () => {
   
    if (!isAuthenticated()) {
      
      localStorage.setItem("selectedSeats", JSON.stringify(selected));
      localStorage.setItem("totalPrice", totalPrice.toString());
      
      localStorage.setItem("returnUrl", "/choose-seat");
      
      alert("Vui lòng đăng nhập để tiếp tục đặt vé!");
      navigate("/login");
      return;
    }

    localStorage.setItem("selectedSeats", JSON.stringify(selected));
    localStorage.setItem("totalPrice", totalPrice.toString());
    navigate("/payment");
  };

  return (
    <>
      <Header />
      {movie && <MovieInfo movie={movie} />}
      <section className="seat-section">
        <div className="container">
          <div className="seat-header">
            <p>
              Giờ chiếu: <strong>{showtime}</strong>
            </p>
            {theaterInfo ? (
              <p className="theater-name">
                Rạp: <strong>{theaterInfo.name || theaterInfo.theaterName || "Chưa có tên"}</strong>
              </p>
            ) : screenInfo?.theaterId ? (
              <p className="theater-name">
                Rạp: <strong>Đang tải...</strong>
              </p>
            ) : null}
            {selectedDate && (
              <p>Ngày: <strong>{selectedDate}</strong></p>
            )}
          </div>

          <div className="screen">
            <img src={room} alt="room" />
          </div>

          <h2>{screenInfo ? `Phòng chiếu ${screenInfo.name || screenInfo.id}` : "Phòng chiếu"}</h2>
          <br />
          
          {seatsLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#ccc" }}>
              <p>Đang tải danh sách ghế...</p>
            </div>
          ) : seats.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
              <p>Không có ghế nào</p>
            </div>
          ) : (
          <div className="seat-grid">
              {seats.map((row, rowIdx) => (
                <div className="seat-row" key={rowIdx}>
                  {row.map((seat) => {
                    
                    if (seat.isHidden) {
                      return (
                        <div
                          key={seat.id || seat.seatCode || `hidden-${seat.seatCode}`}
                          className="seat seat-hidden"
                          aria-hidden="true"
                        />
                      );
                    }
                    
                    const seatKey = `${seat.id}-${seat.seatCode}`;
                    const isSelected = selected.includes(seatKey);
               
                    const getSeatTypeClass = (type) => {
                      const typeUpper = (type || "STANDARD").toUpperCase();
                      if (typeUpper === "STANDARD") return "normal";
                      if (typeUpper === "VIP") return "vip";
                      if (typeUpper === "SWEETBOX") return "double";
                      return "normal"; // Mặc định
                    };
                    
                    const seatTypeClass = getSeatTypeClass(seat.type);
     
                    const seatClass = `seat ${seat.booked ? "booked" : seatTypeClass}${isSelected ? " selected" : ""}`.trim();
                    
                    return (
                  <button
                        key={seat.id || seat.seatCode}
                        className={seatClass}
                        onClick={() => {
                          if (!seat.booked) {
                            toggleSeat(seat.id, seat.seatCode);
                          }
                        }}
                        disabled={seat.booked}
                        title={seat.booked ? `${seat.seatCode} - Đã đặt` : `${seat.seatCode} - ${seat.type || "STANDARD"}`}
                      >
                        {seat.booked ? <FaTimes size={16} /> : seat.seatCode}
                  </button>
                    );
                  })}
              </div>
            ))}
          </div>
          )}

          <div className="legend">
            <div className="legend-item">
              <span className="seat booked">
                <FaTimes size={16} />
              </span>
              <span>Đã đặt</span>
            </div>
            <div className="legend-item">
              <span className="seat selected"></span>
              <span>Ghế bạn chọn</span>
            </div>
            <div className="legend-item">
              <span className="seat normal"></span>
              <span>Ghế thường</span>
            </div>
            <div className="legend-item">
              <span className="seat vip"></span>
              <span>Ghế VIP</span>
            </div>
            <div className="legend-item">
              <span className="seat double"></span>
              <span>Ghế đôi (Sweetbox)</span>
            </div>
          </div>

          {errorMessage && (
            <div className="seat-error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{errorMessage}</span>
            </div>
          )}

          <div className="summary">
            <div className="seat-choosed">
              <p>
                Ghế đã chọn: <span>{selectedSeatCodes.join(", ") || "Chưa chọn"}</span>
              </p>
              <p>
                Tổng tiền:{" "}
                <span>
                  {isCalculatingPrice ? "Đang tính..." : `${totalPrice.toLocaleString("vi-VN")}đ`}
                </span>
              </p>
            </div>
            <div className="actions">
              <button
                className="button btn-outline"
                onClick={() => navigate(-1)}
              >
                Quay lại
              </button>
              <button 
                className="button btn-red"
                onClick={handlePayment}
                disabled={selected.length === 0}
              >
                Thanh Toán
              </button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
