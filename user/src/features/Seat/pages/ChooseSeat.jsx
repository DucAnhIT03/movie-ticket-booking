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
  const [priceCache, setPriceCache] = useState({}); 
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

  
  useEffect(() => {
    if (!showtimeId) return;

    const fetchSeats = async () => {
      setSeatsLoading(true);
      try {
        const response = await seatService.getByShowtime(showtimeId);
        if (response.status === 200) {
          const seatsData = (response.data || []).map(seat => ({
            ...seat,
            type: seat.type || 'STANDARD', 
          }));
        
          const bookedIds = new Set();
          seatsData.forEach(seat => {
            const isBooked = seat.isBooked || seat.booked || false;
            if (isBooked) {
              bookedIds.add(seat.id);
            }
          });
          
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

    const cacheKeys = Object.keys(priceCacheRef.current);
    cacheKeys.forEach(key => {
      delete priceCacheRef.current[key];
    });
    setPriceCache({});
    
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

 
  const priceCacheRef = useRef({});
  

  const movieId = useMemo(() => movie?.id ? parseInt(movie.id) : null, [movie?.id]);
  const movieType = useMemo(() => movie?.type || '2D', [movie?.type]);
  
 
  const getSeatPriceRef = useRef(null);
  
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

    try {
      
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
          console.error("Invalid date format:", selectedDate);
          throw new Error("Invalid date format");
        }
      } else {
        console.error("Invalid date format:", selectedDate);
        throw new Error("Invalid date format");
      }
      
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
        
        let price = null;
        
        if (typeof response.data === 'number') {
          price = response.data;
        } else if (typeof response.data === 'string' && response.data.trim() !== '') {
          
          const parsed = parseFloat(response.data);
          if (!isNaN(parsed)) {
            price = parsed;
          } else {
            console.warn(`⚠️ Cannot parse price from string:`, response.data);
          }
        } else if (typeof response.data === 'object' && response.data !== null) {
          
          price = response.data.price || response.data.value || response.data.amount || null;
        }
        
        
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

    const defaultPrices = {
      STANDARD: 90000,
      VIP: 120000,
      SWEETBOX: 150000
    };
    const defaultPrice = defaultPrices[seatType] || 90000;
    console.log(`💰 [USER] Using default price for ${seatType}: ${defaultPrice} VND`);
    return defaultPrice;
  }, [movieId, movieType, selectedDate, showtime, screenInfo, showtimeInfo]);
  
 
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
    
  
    if (isCalculatingRef.current) {
      return;
    }
    
    prevDepsRef.current = currentDeps;

    const calculateTotal = async () => {
      isCalculatingRef.current = true;
      setIsCalculatingPrice(true);
      let total = 0;
      
      try {
        
        const flatSeats = seats.flat();
        
        for (const seatKey of selectedRef.current) {
          const [seatId, seatCode] = seatKey.split('-');
          const seat = flatSeats.find(s => s.id === parseInt(seatId));
          const seatType = seat?.type || "STANDARD";
          
          if (getSeatPriceRef.current) {
            const price = await getSeatPriceRef.current(seatType, movieId);
          
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
