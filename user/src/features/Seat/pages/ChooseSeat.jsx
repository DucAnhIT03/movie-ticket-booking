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
  const [priceCache, setPriceCache] = useState({}); // Cache giá để tránh gọi API nhiều lần
  const [errorMessage, setErrorMessage] = useState(""); // Thông báo lỗi khi chọn ghế không hợp lệ

  // Lấy thông tin từ localStorage
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

    // Fetch thông tin phim nếu có movieId
    if (savedMovieId) {
      movieService.getMovieById(savedMovieId).then(res => {
        if (res.status === 200 && res.data) {
          setMovie(res.data);
        }
      });
    }

    // Fetch thông tin showtime để lấy screenId và thông tin phim
    if (savedShowtimeId) {
      showtimeService.getAll({}).then(res => {
        if (res.status === 200 && res.data) {
          const allShowtimes = Array.isArray(res.data) ? res.data : res.data.data || [];
          const currentShowtime = allShowtimes.find(st => st.id === parseInt(savedShowtimeId));
          if (currentShowtime) {
            setShowtimeInfo(currentShowtime);
            setScreenInfo(currentShowtime.screen);
          }
        }
      });
    }
  }, []);

  // Fetch ghế theo showtimeId
  useEffect(() => {
    if (!showtimeId) return;

    const fetchSeats = async () => {
      setSeatsLoading(true);
      try {
        const response = await seatService.getByShowtime(showtimeId);
        if (response.status === 200) {
          const seatsData = (response.data || []).map(seat => ({
            ...seat,
            type: seat.type || 'STANDARD', // Đảm bảo luôn có type
          }));
          
          // Lấy danh sách ghế đã đặt (từ bookings)
          const bookedIds = new Set();
          seatsData.forEach(seat => {
            const isBooked = seat.isBooked || seat.booked || false;
            if (isBooked) {
              bookedIds.add(seat.id);
            }
          });
          
          // Tạo map ghế theo seatNumber để dễ tìm
          const seatMap = {};
          seatsData.forEach(seat => {
            const seatNumber = seat.seatNumber || seat.seat_number || "";
            if (!seatNumber) return;
            
            seatMap[seatNumber] = {
              id: seat.id,
              seatCode: seatNumber,
              booked: seat.isBooked || seat.booked || bookedIds.has(seat.id),
              type: seat.type || "STANDARD",
              isHidden: seat.isHidden || seat.is_hidden || false
            };
          });
          
          setBookedSeatIds(bookedIds);
          
          // Nhóm ghế theo hàng và sắp xếp đúng thứ tự
          const seatsByRow = {};
          
          seatsData.forEach(seat => {
            const seatNumber = seat.seatNumber || seat.seat_number || "";
            if (!seatNumber) return;
            
            // KHÔNG bỏ qua ghế bị ẩn - giữ lại để render vị trí trống
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
                isHidden: seat.isHidden || seat.is_hidden || false, // Giữ lại thông tin isHidden
                colNumber: parseInt(match[2]) // Lưu số cột để sắp xếp
              });
            }
          });
          
          // Sắp xếp ghế trong mỗi hàng theo số cột (1, 2, 3, ...)
          Object.keys(seatsByRow).forEach(row => {
            seatsByRow[row].sort((a, b) => a.colNumber - b.colNumber);
          });
          
          // Sắp xếp hàng (A, B, C, ...) và chuyển thành mảng
          const seatsGrid = Object.keys(seatsByRow)
            .sort()
            .map(row => seatsByRow[row]);
          
          setSeats(seatsGrid);
        }
      } catch (err) {
        console.error("Error fetching seats:", err);
        setSeats([]);
      } finally {
        setSeatsLoading(false);
      }
    };

    fetchSeats();
  }, [showtimeId]);

  const toggleSeat = (seatId, seatCode) => {
    // Khi user chọn/bỏ chọn ghế, invalidate cache để đảm bảo giá luôn mới nhất
    // Xóa cache cũ để force refresh giá khi tính lại tổng tiền
    const cacheKeys = Object.keys(priceCacheRef.current);
    cacheKeys.forEach(key => {
      delete priceCacheRef.current[key];
    });
    setPriceCache({}); // Clear state cache
    
    setSelected((prev) => {
      const seatKey = `${seatId}-${seatCode}`;
      
      // Nếu đang bỏ chọn ghế, luôn cho phép
      if (prev.includes(seatKey)) {
        setErrorMessage(""); // Xóa thông báo lỗi khi bỏ chọn
        return prev.filter((s) => s !== seatKey);
      } 
      
      // Nếu đang chọn ghế mới, cần validate
      const validation = validateSeatSelection(prev, seatCode, seats);
      
      if (!validation.valid) {
        // Hiển thị thông báo lỗi
        setErrorMessage(validation.message);
        // Tự động xóa thông báo sau 5 giây
        const timeoutId = setTimeout(() => {
          setErrorMessage("");
        }, 5000);
        // Lưu timeoutId để có thể clear nếu cần
        return prev; // Không thêm ghế mới
      }
      
      // Nếu hợp lệ, xóa thông báo lỗi và thêm ghế mới
      setErrorMessage("");
      return [...prev, seatKey];
    });
  };

  // Tính giá theo loại ghế từ API - sử dụng useCallback để tránh re-render
  // Sử dụng movie?.id và movie?.type thay vì toàn bộ movie object để tránh re-create
  // Sử dụng useRef để lưu cache và tránh dependency cycle
  const priceCacheRef = useRef({});
  
  // Tạo stable values cho movie để tránh re-create function
  const movieId = useMemo(() => movie?.id ? parseInt(movie.id) : null, [movie?.id]);
  const movieType = useMemo(() => movie?.type || '2D', [movie?.type]);
  
  // Sử dụng ref để lưu function và tránh dependency
  const getSeatPriceRef = useRef(null);
  
  const getSeatPrice = useCallback(async (seatType, movieIdParam = null) => {
    // Sử dụng movieId từ tham số hoặc từ movie object
    const movieIdToUse = movieIdParam || movieId;
    const movieTypeToUse = movieType;
    
    // Lấy theaterId từ screenInfo hoặc showtimeInfo
    const theaterIdToUse = screenInfo?.theaterId || showtimeInfo?.screen?.theaterId || showtimeInfo?.theaterId || null;
    
    // TẮT CACHE để luôn lấy giá mới nhất từ server
    // Đảm bảo khi admin cập nhật giá, user sẽ thấy giá mới ngay lập tức
    // const now = new Date();
    // const cacheInterval = Math.floor(now.getTime() / (1000 * 30)); // Timestamp theo 30 giây
    // const cacheKey = `${seatType}-${movieIdToUse || movieTypeToUse}-${theaterIdToUse || 'all'}-${selectedDate}-${showtime}-${cacheInterval}`;
    
    // BỎ QUA CACHE - luôn gọi API để lấy giá mới nhất
    // if (priceCacheRef.current[cacheKey]) {
    //   return priceCacheRef.current[cacheKey];
    // }

    // Nếu chưa có thông tin cần thiết, dùng giá mặc định
    if (!selectedDate || !showtime) {
      const defaultPrices = {
        STANDARD: 90000,
        VIP: 120000,
        SWEETBOX: 150000
      };
      return defaultPrices[seatType] || 90000;
    }

    try {
      // Convert date từ DD-MM-YYYY sang YYYY-MM-DD
      // Kiểm tra format date trước khi split
      let apiDate;
      if (selectedDate.includes("-")) {
        const parts = selectedDate.split("-");
        if (parts.length === 3) {
          // Format: DD-MM-YYYY hoặc YYYY-MM-DD
          if (parts[0].length === 4) {
            // Đã là YYYY-MM-DD
            apiDate = selectedDate;
          } else {
            // DD-MM-YYYY -> YYYY-MM-DD
            const [day, month, year] = parts;
            apiDate = `${year}-${month}-${day}`;
          }
        } else {
          console.error("Invalid date format:", selectedDate);
          throw new Error("Invalid date format");
        }
      } else {
        console.error("Invalid date format:", selectedDate);
        throw new Error("Invalid date format");
      }
      
      // Debug: log thông tin để kiểm tra
      console.log('🔍 [USER] Getting price for:', {
        seatType,
        movieType: movieTypeToUse,
        movieId: movieIdToUse,
        theaterId: theaterIdToUse,
        date: apiDate,
        time: showtime,
        selectedDate,
        showtime,
        screenInfo: screenInfo ? { id: screenInfo.id, theaterId: screenInfo.theaterId } : null,
        showtimeInfo: showtimeInfo ? { id: showtimeInfo.id } : null
      });
      
      // Gọi API để lấy giá - gửi movieId và theaterId nếu có
      const response = await ticketPriceService.getPrice(
        seatType,
        movieTypeToUse,
        apiDate,
        showtime,
        movieIdToUse,
        theaterIdToUse
      );
      
      console.log('📥 [USER] Price API response:', {
        status: response.status,
        data: response.data,
        dataType: typeof response.data,
        seatType,
        theaterId: theaterIdToUse,
        date: apiDate,
        time: showtime,
        fullResponse: JSON.stringify(response.data)
      });

      if (response.status === 200) {
        // Response có thể là số (price) hoặc object có price
        let price = null;
        
        // Xử lý nhiều format response khác nhau
        if (typeof response.data === 'number') {
          price = response.data;
        } else if (typeof response.data === 'string' && response.data.trim() !== '') {
          // Thử parse string thành number
          const parsed = parseFloat(response.data);
          if (!isNaN(parsed)) {
            price = parsed;
          } else {
            console.warn(`⚠️ Cannot parse price from string:`, response.data);
          }
        } else if (typeof response.data === 'object' && response.data !== null) {
          // Nếu là object, tìm trường price
          price = response.data.price || response.data.value || response.data.amount || null;
        }
        
        // Kiểm tra và chuyển đổi price thành số
        const priceNum = typeof price === 'number' ? price : (price ? parseFloat(price) : null);
        
        if (priceNum !== null && !isNaN(priceNum) && priceNum > 0) {
          console.log(`✅ Got price for ${seatType}: ${priceNum} VND (theaterId: ${theaterIdToUse}, date: ${apiDate}, time: ${showtime})`);
          return priceNum;
        } else {
          console.warn(`⚠️ Invalid price for ${seatType}:`, {
            priceNum,
            originalData: response.data,
            dataType: typeof response.data,
            seatType,
            date: apiDate,
            time: showtime
          });
        }
      } else {
        console.warn(`⚠️ API returned status ${response.status} for price request:`, {
          status: response.status,
          data: response.data,
          seatType,
          date: apiDate,
          time: showtime
        });
      }
      
      // Nếu không có giá hợp lệ, log warning để debug
      console.warn(`⚠️ [USER] No valid price found for ${seatType}, using default price`, {
        seatType,
        movieId: movieIdToUse,
        movieType: movieTypeToUse,
        theaterId: theaterIdToUse,
        date: apiDate,
        time: showtime,
        responseStatus: response?.status,
        responseData: response?.data
      });
    } catch (error) {
      console.error("❌ [USER] Error fetching ticket price:", {
        error: error.message,
        stack: error.stack,
        seatType,
        movieId: movieIdToUse,
        movieType: movieTypeToUse,
        theaterId: theaterIdToUse,
        date: selectedDate,
        time: showtime,
        response: error.response?.data
      });
    }

    // Fallback về giá mặc định nếu có lỗi
    const defaultPrices = {
      STANDARD: 90000,
      VIP: 120000,
      SWEETBOX: 150000
    };
    const defaultPrice = defaultPrices[seatType] || 90000;
    console.log(`💰 [USER] Using default price for ${seatType}: ${defaultPrice} VND`);
    return defaultPrice;
  }, [movieId, movieType, selectedDate, showtime, screenInfo, showtimeInfo]);
  
  // Lưu function vào ref để sử dụng trong useEffect mà không cần dependency
  useEffect(() => {
    getSeatPriceRef.current = getSeatPrice;
  }, [getSeatPrice]);

  // Tính tổng tiền (sử dụng async)
  const [totalPrice, setTotalPrice] = useState(0);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  // Sử dụng useMemo để tạo stable hash của selected seats
  const selectedHash = useMemo(() => {
    return selected.length > 0 ? [...selected].sort().join('|') : '';
  }, [selected]);
  
  // Sử dụng ref để lưu selected mới nhất để tránh stale closure
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  
  // Sử dụng ref để track dependencies và tránh tính lại không cần thiết
  const prevDepsRef = useRef({
    selectedHash: '',
    movieId: null,
    selectedDate: '',
    showtime: '',
    seatsLength: 0
  });
  const isCalculatingRef = useRef(false);
  
  // Tính tổng tiền với dependency array ổn định
  useEffect(() => {
    // Sử dụng ref để lấy selected mới nhất
    const currentSelected = selectedRef.current;
    
    // Chỉ tính khi có ghế được chọn và có đủ thông tin
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
      return;
    }

    if (!movieId || !selectedDate || !showtime || seats.length === 0) {
      setIsCalculatingPrice(false);
      isCalculatingRef.current = false;
      return;
    }

    // Kiểm tra xem có thay đổi không
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
    
    // Nếu không có thay đổi, không tính lại
    if (!depsChanged) {
      return;
    }
    
    // Tránh tính lại nếu đang tính
    if (isCalculatingRef.current) {
      return;
    }
    
    // Cập nhật ref
    prevDepsRef.current = currentDeps;

    const calculateTotal = async () => {
      isCalculatingRef.current = true;
      setIsCalculatingPrice(true);
      let total = 0;
      
      try {
        // Tạo flat array một lần
        const flatSeats = seats.flat();
        
        // Sử dụng selected từ ref để đảm bảo luôn có giá trị mới nhất
        for (const seatKey of selectedRef.current) {
          const [seatId, seatCode] = seatKey.split('-');
          const seat = flatSeats.find(s => s.id === parseInt(seatId));
          const seatType = seat?.type || "STANDARD";
          
          // Sử dụng ref để gọi function mà không cần dependency
          if (getSeatPriceRef.current) {
            const price = await getSeatPriceRef.current(seatType, movieId);
            // Đảm bảo price là số hợp lệ
            const validPrice = (price && !isNaN(price) && price > 0) ? price : 0;
            total += validPrice;
          }
        }
        setTotalPrice(total);
      } catch (error) {
        console.error("Error calculating total price:", error);
        setTotalPrice(0);
      } finally {
        setIsCalculatingPrice(false);
        isCalculatingRef.current = false;
      }
    };

    calculateTotal();
    // Dependency array ổn định - chỉ các giá trị primitive
    // selectedHash đã bao gồm thông tin từ selected, nên không cần selected trong dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHash, movieId, selectedDate, showtime, seats.length]);
  const selectedSeatCodes = selected.map(s => s.split('-')[1]);

  const handlePayment = () => {
    // Kiểm tra đăng nhập trước khi đặt vé
    if (!isAuthenticated()) {
      // Lưu thông tin booking tạm thời để sau khi đăng nhập có thể quay lại
      localStorage.setItem("selectedSeats", JSON.stringify(selected));
      localStorage.setItem("totalPrice", totalPrice.toString());
      // Lưu returnUrl để sau khi đăng nhập quay lại trang này
      localStorage.setItem("returnUrl", "/choose-seat");
      // Hiển thị thông báo và chuyển đến trang đăng nhập
      alert("Vui lòng đăng nhập để tiếp tục đặt vé!");
      navigate("/login");
      return;
    }

    // Lưu thông tin booking vào localStorage
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
                    // Nếu ghế bị ẩn, render vị trí trống (giữ layout)
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
                    
                    // Map type từ API sang class CSS
                    const getSeatTypeClass = (type) => {
                      const typeUpper = (type || "STANDARD").toUpperCase();
                      if (typeUpper === "STANDARD") return "normal";
                      if (typeUpper === "VIP") return "vip";
                      if (typeUpper === "SWEETBOX") return "double";
                      return "normal"; // Mặc định
                    };
                    
                    const seatTypeClass = getSeatTypeClass(seat.type);
                    // Đảm bảo class selected được thêm vào cuối để có độ ưu tiên cao
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
