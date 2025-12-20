import React, { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { Building, Tv, Calendar, RefreshCw, Grid, Check } from "lucide-react";
import { toast } from "react-toastify";
import theaterService from "../../services/theaters/theaterService";
import screenService from "../../services/screens/screenService";
import seatService from "../../services/seats/seatService";
import showtimeService from "../../services/showtimes/showtimeService";
import bookingService from "../../services/bookings/bookingService";
import promotionService from "../../services/promotions/promotionService";

export default function SeatBookingView() {
  const [theaters, setTheaters] = useState([]);
  const [screens, setScreens] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [seats, setSeats] = useState([]);
  const [selectedTheaterId, setSelectedTheaterId] = useState("");
  const [selectedScreenId, setSelectedScreenId] = useState("");
  const [selectedShowtimeId, setSelectedShowtimeId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceQuote, setPriceQuote] = useState(null);
  const [isPricing, setIsPricing] = useState(false);
  const [promotionCode, setPromotionCode] = useState("");
  const [promotionInfo, setPromotionInfo] = useState(null);
  const [isValidatingPromotion, setIsValidatingPromotion] = useState(false);
  const [promotionError, setPromotionError] = useState("");

  // WebSocket instance (giữ ở level component để dùng trong cleanup)
  const [socket, setSocket] = useState(null);

  const currentUserRoles = useMemo(() => {
    try {
      const raw = localStorage.getItem("adminUser");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.roles) ? parsed.roles : [];
    } catch (error) {
      console.error("Failed to parse adminUser", error);
      return [];
    }
  }, []);

  const currentUserTheaterId = useMemo(() => {
    try {
      const raw = localStorage.getItem("adminUser");
      if (!raw) {
        console.log("SeatBookingView: No adminUser in localStorage");
        return null;
      }
      const parsed = JSON.parse(raw);
      const theaterId = parsed?.theaterId || parsed?.theater_id || null;
      console.log("SeatBookingView: Current user data:", parsed);
      console.log("SeatBookingView: TheaterId from localStorage:", theaterId);
      return theaterId;
    } catch (error) {
      console.error("Failed to parse adminUser", error);
      return null;
    }
  }, []);

  const isEmployee = currentUserRoles.includes("ROLE_EMPLOYEE") && !currentUserRoles.includes("ROLE_ADMIN");
  
  console.log("SeatBookingView: isEmployee:", isEmployee, "currentUserTheaterId:", currentUserTheaterId);
  const canCreateOfflineBooking = currentUserRoles.includes("ROLE_ADMIN") || currentUserRoles.includes("ROLE_EMPLOYEE");
  const paymentOptions = [
    { value: "CASH", label: "Tiền mặt" },
    { value: "POS", label: "Quẹt thẻ (POS)" },
  ];

  const buildErrorMessage = (data) => {
    if (!data) return "Không thể xuất vé tại quầy";
    if (typeof data === "string") return data;
    if (typeof data === "object") {
      return data.message || data.error || "Không thể xuất vé tại quầy";
    }
    return "Không thể xuất vé tại quầy";
  };

  useEffect(() => {
    loadTheaters();
  }, []);

  // Kết nối WebSocket để nhận sự kiện cập nhật ghế real-time
  useEffect(() => {
    // Dùng cùng baseURL với axiosClient
    const baseURL = "http://localhost:3000";
    const socketInstance = io(`${baseURL}/seat-booking`, {
      transports: ["websocket"],
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("SeatBookingView: Connected to seat-booking WebSocket");
    });

    socketInstance.on("seat_update", (payload) => {
      console.log("SeatBookingView: Received seat_update", payload);
      if (!payload || !payload.showtimeId) return;

      if (
        !selectedShowtimeId ||
        Number(selectedShowtimeId) !== Number(payload.showtimeId)
      ) {
        return;
      }

      const { seatIds, action } = payload;

      // Nếu backend không gửi chi tiết ghế, fallback load lại không loading
      if (!Array.isArray(seatIds) || seatIds.length === 0) {
        loadSeats({ showLoading: false });
        return;
      }

      const targetIds = new Set(seatIds.map((id) => Number(id)));

      // Cập nhật cục bộ trạng thái ghế để tránh giật layout
      setSeats((prevSeats) => {
        if (!prevSeats || prevSeats.length === 0) {
          // Nếu chưa có dữ liệu, fallback load lại
          loadSeats({ showLoading: false });
          return prevSeats;
        }

        return prevSeats.map((seat) => {
          if (!targetIds.has(seat.id)) return seat;

          if (action === "BOOKED") {
            return { ...seat, isBooked: true };
          }
          if (action === "RELEASED") {
            return { ...seat, isBooked: false };
          }

          // Action khác (hoặc không xác định) thì giữ nguyên
          return seat;
        });
      });
    });

    socketInstance.on("disconnect", () => {
      console.log("SeatBookingView: Disconnected from seat-booking WebSocket");
    });

    return () => {
      console.log("SeatBookingView: Cleaning up WebSocket");
      socketInstance.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShowtimeId]);

  useEffect(() => {
    if (selectedTheaterId) {
      loadScreens();
    } else {
      setScreens([]);
      setSelectedScreenId("");
    }
  }, [selectedTheaterId]);

  useEffect(() => {
    if (selectedScreenId) {
      loadShowtimes();
    } else {
      setShowtimes([]);
      setSelectedShowtimeId("");
      setSeats([]);
    }
  }, [selectedScreenId]);

  useEffect(() => {
    // Reset suất chiếu khi thay đổi ngày
    if (selectedDate) {
      setSelectedShowtimeId("");
      setSeats([]);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedShowtimeId) {
      // Lần load đầu khi chọn suất chiếu: cho phép hiện loading
      loadSeats({ showLoading: true });
    } else {
      setSeats([]);
    }
  }, [selectedShowtimeId]);

  useEffect(() => {
    
    setSelectedSeats([]);
    setCustomerName("");
    setCustomerPhone("");
    setPriceQuote(null);
    setPromotionCode("");
    setPromotionInfo(null);
    setPromotionError("");
  }, [selectedShowtimeId]);

  useEffect(() => {
    if (!selectedShowtimeId || selectedSeats.length === 0) {
      setPriceQuote(null);
      return;
    }
    // Chỉ tính giá khi đã có promotionInfo hoặc không có promotionCode
    // Tránh tính giá khi đang validate mã
    if (promotionCode.trim() && !promotionInfo) {
      return;
    }
    
    let cancelled = false;
    setIsPricing(true);
    const payload = {
        showtimeId: Number(selectedShowtimeId),
        seatIds: selectedSeats.map((seat) => seat.id),
    };
    
    // Chỉ gửi promotionCode nếu đã validate thành công
    if (promotionCode.trim() && promotionInfo) {
      payload.promotionCode = promotionCode.trim();
      // Admin và nhân viên có thể dùng mã nhiều lần (bỏ qua giới hạn "mỗi user 1 lần")
      // Nhưng vẫn phải tuân theo giới hạn tổng số lượt sử dụng của mã
      payload.bypassUserLimit = canCreateOfflineBooking;
    }
    
    console.log("Preview booking with payload:", payload);
    bookingService
      .previewOfflineBooking(payload)
      .then((res) => {
        if (cancelled) return;
        console.log("Preview booking response:", res);
        if (res.status === 200) {
          setPriceQuote(res.data);
          console.log("Price quote:", res.data);
        } else {
          setPriceQuote(null);
          toast.error(res.data?.message || "Không thể tính giá vé, vui lòng kiểm tra cấu hình.");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Quote error:", error);
        setPriceQuote(null);
        toast.error(error.response?.data?.message || "Không thể tính giá tự động.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsPricing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedShowtimeId, selectedSeats, promotionCode, promotionInfo]);

  const loadTheaters = async () => {
    try {
      const res = await theaterService.getAllTheaters();
      if (res.status === 200) {
        let theatersData = res.data.items || res.data || [];
        console.log("SeatBookingView: All theaters loaded:", theatersData);
        console.log("SeatBookingView: Filtering - isEmployee:", isEmployee, "currentUserTheaterId:", currentUserTheaterId);
        
        // Nếu là nhân viên, chỉ hiển thị rạp được gán
        if (isEmployee && currentUserTheaterId) {
          const theaterIdNum = typeof currentUserTheaterId === 'string' ? parseInt(currentUserTheaterId, 10) : currentUserTheaterId;
          theatersData = theatersData.filter(t => t.id === theaterIdNum);
          console.log("SeatBookingView: Filtered theaters for employee:", theatersData);
          // Tự động chọn rạp được gán
          if (theatersData.length > 0) {
            setSelectedTheaterId(theatersData[0].id.toString());
            console.log("SeatBookingView: Auto-selected theater:", theatersData[0].id);
          } else {
            console.warn("SeatBookingView: Employee has theaterId but no matching theater found!");
          }
        } else if (isEmployee && !currentUserTheaterId) {
          console.warn("SeatBookingView: Employee but no theaterId assigned!");
          toast.warning("Bạn chưa được gán rạp. Vui lòng liên hệ quản trị viên.");
        }
        
        setTheaters(theatersData);
      }
    } catch (error) {
      console.error("Error loading theaters:", error);
      toast.error("Lỗi khi tải danh sách rạp!");
    }
  };

  const loadScreens = async () => {
    try {
      const res = await screenService.getAllScreens();
      if (res.status === 200) {
        const allScreens = res.data.items || res.data || [];
        let filteredScreens = allScreens.filter(
          (s) => s.theater_id === parseInt(selectedTheaterId, 10)
        );
        
        // Nếu là nhân viên, đảm bảo chỉ hiển thị phòng chiếu của rạp được gán
        if (isEmployee && currentUserTheaterId) {
          filteredScreens = filteredScreens.filter(
            (s) => s.theater_id === currentUserTheaterId
          );
        }
        
        setScreens(filteredScreens);
      }
    } catch (error) {
      console.error("Error loading screens:", error);
      toast.error("Lỗi khi tải danh sách phòng!");
    }
  };

  const loadShowtimes = async () => {
    if (!selectedScreenId) return;
    try {
      // Filter trực tiếp trong API call
      const res = await showtimeService.getAllShowtimes({ 
        limit: 1000,
        screenId: parseInt(selectedScreenId, 10)
      });
      if (res.status === 200) {
        const showtimesData = res.data?.items || res.data || [];
        console.log("Loaded showtimes for screen:", selectedScreenId, showtimesData);
        setShowtimes(showtimesData);
        
        if (showtimesData.length === 0) {
          toast.info("Không có suất chiếu nào trong phòng này");
        }
      }
    } catch (error) {
      console.error("Error loading showtimes:", error);
      toast.error("Lỗi khi tải danh sách suất chiếu!");
    }
  };

  const loadSeats = async (options = {}) => {
    const { showLoading = true } = options;
    if (!selectedShowtimeId) return;
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const res = await seatService.getSeatsByShowtime(selectedShowtimeId);
      console.log("Seats response:", res);
      if (res.status === 200) {
        const seatsData = res.data || [];
        console.log("Loaded seats:", seatsData.length, seatsData);
        setSeats(seatsData);
        setSelectedSeats((prev) =>
          prev.filter((seat) => {
            const freshSeat = seatsData.find((s) => s.id === seat.id);
            return freshSeat && !freshSeat.isBooked && !freshSeat.isHidden;
          })
        );
        
        if (seatsData.length === 0) {
          toast.warning("Phòng này chưa có sơ đồ ghế. Vui lòng tạo sơ đồ ghế trước!");
        }
      } else {
        toast.error(`Lỗi: ${res.data?.message || "Không thể tải sơ đồ ghế"}`);
      }
    } catch (error) {
      console.error("Error loading seats:", error);
      toast.error(error.response?.data?.message || "Lỗi khi tải sơ đồ ghế!");
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  // Tính toán layout từ danh sách ghế
  const calculateLayout = () => {
    if (seats.length === 0) return { rows: 0, cols: 0, seatGrid: {} };

    const seatGrid = {};
    let maxRow = 0;
    let maxCol = 0;

    seats.forEach((seat) => {
      const match = seat.seatNumber.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const row = match[1];
        const col = parseInt(match[2], 10);
        seatGrid[`${row}-${col}`] = seat;
        const rowIndex = row.charCodeAt(0) - 65;
        maxRow = Math.max(maxRow, rowIndex);
        maxCol = Math.max(maxCol, col);
      }
    });

    return {
      rows: maxRow + 1,
      cols: maxCol,
      seatGrid,
    };
  };

  const { rows, cols, seatGrid } = calculateLayout();
  const rowsArray = Array.from({ length: rows }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  const isSeatSelectable = (seat) => seat && !seat.isBooked && !seat.isHidden;

  const isSeatSelected = (seatId) => selectedSeats.some((seat) => seat.id === seatId);

  const handleSeatClick = (seat) => {
    if (!isSeatSelectable(seat)) return;
    setSelectedSeats((prev) => {
      if (prev.some((item) => item.id === seat.id)) {
        return prev.filter((item) => item.id !== seat.id);
      }
      return [...prev, seat];
    });
  };

  const getSeatColor = (seat) => {
    if (!seat) return "#2b3448";
    if (seat.isBooked) return "#d32f2f";
    if (isSeatSelected(seat.id)) return "#4caf50";
    if (seat.isHidden) return "#ffffff";
    if (seat.type === "VIP") return "#ff9800";
    if (seat.type === "SWEETBOX") return "#e91e63";
    return "#2b3448";
  };

  const getSeatTextColor = (seat) => {
    if (!seat) return "#888";
    if (seat.isBooked) return "#fff";
    if (seat?.isHidden) return "#333";
    if (isSeatSelected(seat.id)) return "#0f1c2c";
    return "#fff";
  };

  const handleValidatePromotion = async () => {
    if (!promotionCode.trim()) {
      setPromotionError("Vui lòng nhập mã giảm giá");
      setPromotionInfo(null);
      return;
    }

    setIsValidatingPromotion(true);
    setPromotionError("");
    try {
      // Admin và nhân viên có thể dùng mã giảm giá nhiều lần (bỏ qua giới hạn "mỗi user 1 lần")
      // Nhưng vẫn phải tuân theo giới hạn tổng số lượt sử dụng của mã
      const isAdminOrEmployee = canCreateOfflineBooking;
      const res = await promotionService.applyCode(promotionCode.trim(), isAdminOrEmployee);
      console.log("Promotion validation response:", res);
      if (res.status === 200 && res.data) {
        setPromotionInfo(res.data);
        toast.success("Áp dụng mã giảm giá thành công!");
       
      } else {
        setPromotionInfo(null);
        const errorMsg = res.data?.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn";
        setPromotionError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Promotion validation error:", error);
      setPromotionInfo(null);
      const errorMsg = error.response?.data?.message || "Lỗi khi kiểm tra mã giảm giá";
      setPromotionError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsValidatingPromotion(false);
    }
  };

  const handleRemovePromotion = () => {
    setPromotionCode("");
    setPromotionInfo(null);
    setPromotionError("");
  };

  const calculateFinalPrice = () => {
   
    if (priceQuote?.finalPrice !== undefined) {
      return priceQuote.finalPrice;
    }
   
    if (!priceQuote?.totalPrice) return 0;
    let finalPrice = priceQuote.totalPrice;
    
    if (promotionInfo) {
      if (promotionInfo.discountType === "PERCENTAGE") {
        const discount = (finalPrice * promotionInfo.discountValue) / 100;
        finalPrice = Math.max(0, finalPrice - discount);
      } else if (promotionInfo.discountType === "FIXED") {
        finalPrice = Math.max(0, finalPrice - promotionInfo.discountValue);
      }
    }
    
    return Math.round(finalPrice);
  };

  const handleCreateOfflineBooking = async () => {
    if (!selectedShowtimeId) {
      toast.warning("Vui lòng chọn suất chiếu trước khi xuất vé!");
      return;
    }
    if (selectedSeats.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một ghế!");
      return;
    }
    if (!customerName.trim()) {
      toast.warning("Vui lòng nhập tên khách hàng!");
      return;
    }
    if (!priceQuote || !priceQuote.totalPrice) {
      toast.warning("Không xác định được tổng tiền. Vui lòng thử lại!");
      return;
    }

    if (promotionCode.trim() && !promotionInfo) {
      toast.warning("Vui lòng áp dụng mã giảm giá trước khi xuất vé!");
      return;
    }

    setIsSubmitting(true);
    try {
      // Gửi promotionCode để backend tính giá cuối cùng
      // Nếu backend không tính, dùng giá đã tính ở frontend
      const finalPrice = priceQuote?.finalPrice !== undefined 
        ? priceQuote.finalPrice 
        : calculateFinalPrice();
      
      const payload = {
        showtimeId: Number(selectedShowtimeId),
        seatIds: selectedSeats.map((seat) => seat.id),
        totalPriceMovie: finalPrice,
        paymentMethod,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
      };

      // Gửi promotionCode và bypassUserLimit nếu có mã giảm giá
      if (promotionCode.trim() && promotionInfo) {
        payload.promotionCode = promotionCode.trim();
        // Admin và nhân viên có thể dùng mã nhiều lần (bỏ qua giới hạn "mỗi user 1 lần")
        // Nhưng vẫn phải tuân theo giới hạn tổng số lượt sử dụng của mã
        payload.bypassUserLimit = canCreateOfflineBooking;
      }

      console.log("Creating offline booking with payload:", payload);
      const res = await bookingService.createOfflineBooking(payload);
      console.log("Booking response:", res);
      if (res.status >= 200 && res.status < 300) {
        toast.success(res.data?.message || "Xuất vé thành công!");
        setSelectedSeats([]);
        setCustomerName("");
        setCustomerPhone("");
        setPriceQuote(null);
        setPromotionCode("");
        setPromotionInfo(null);
        setPromotionError("");
        await loadSeats();
      } else {
        toast.error(buildErrorMessage(res.data));
      }
    } catch (error) {
      console.error("Offline booking error:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ color: "#fff", padding: "20px" }}>
      <h1
        style={{
          fontSize: "26px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Grid size={28} /> Xem Sơ Đồ Ghế Đặt Chỗ
      </h1>

      {/* Bộ lọc */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.3)",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          display: "flex",
          gap: "15px",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", height: "100%" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#aaa", height: "20px", lineHeight: "20px" }}>
            Chọn rạp
          </label>
          <select
            value={selectedTheaterId}
            onChange={(e) => {
              setSelectedTheaterId(e.target.value);
              setSelectedScreenId("");
              setSelectedShowtimeId("");
            }}
            disabled={isEmployee}
            style={{
              width: "100%",
              padding: "10px",
              background: isEmployee ? "#1a1f29" : "#1a1f29",
              color: isEmployee ? "#888" : "#fff",
              border: "1px solid #333",
              borderRadius: "6px",
              cursor: isEmployee ? "not-allowed" : "pointer",
              opacity: isEmployee ? 0.6 : 1,
              height: "42px",
              boxSizing: "border-box",
            }}
          >
            <option value="">-- Chọn rạp --</option>
            {theaters.map((theater) => (
              <option key={theater.id} value={theater.id}>
                {theater.name} - {theater.location}
              </option>
            ))}
          </select>
          <div style={{ height: "20px", marginTop: "4px" }}>
            {isEmployee && currentUserTheaterId && (
              <div style={{ fontSize: "12px", color: "#888", lineHeight: "16px" }}>
                Bạn chỉ có thể chọn phòng chiếu của rạp được gán
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", height: "100%" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#aaa", height: "20px", lineHeight: "20px" }}>
            Chọn phòng chiếu
          </label>
          <select
            value={selectedScreenId}
            onChange={(e) => {
              setSelectedScreenId(e.target.value);
              setSelectedShowtimeId("");
            }}
            disabled={!selectedTheaterId}
            style={{
              width: "100%",
              padding: "10px",
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "6px",
              opacity: selectedTheaterId ? 1 : 0.5,
              height: "42px",
              boxSizing: "border-box",
            }}
          >
            <option value="">-- Chọn phòng --</option>
            {screens.map((screen) => (
              <option key={screen.id} value={screen.id}>
                {screen.name} ({screen.seat_capacity} ghế)
              </option>
            ))}
          </select>
          <div style={{ height: "20px", marginTop: "4px" }}></div>
        </div>

        <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", height: "100%" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#aaa", height: "20px", lineHeight: "20px" }}>
            Lọc theo ngày
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={!selectedScreenId}
            style={{
              width: "100%",
              padding: "10px",
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "6px",
              opacity: selectedScreenId ? 1 : 0.5,
              height: "42px",
              cursor: selectedScreenId ? "pointer" : "not-allowed",
              boxSizing: "border-box",
            }}
          />
          <div style={{ height: "20px", marginTop: "4px" }}></div>
        </div>

        <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", height: "100%" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#aaa", height: "20px", lineHeight: "20px" }}>
            Chọn suất chiếu
          </label>
          <select
            value={selectedShowtimeId}
            onChange={(e) => setSelectedShowtimeId(e.target.value)}
            disabled={!selectedScreenId}
            style={{
              width: "100%",
              padding: "10px",
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "6px",
              opacity: selectedScreenId ? 1 : 0.5,
              height: "42px",
              boxSizing: "border-box",
            }}
          >
            <option value="">-- Chọn suất chiếu --</option>
            {showtimes
              .filter((showtime) => {
                if (!selectedDate) return true;
                const startTime = showtime.startTime || showtime.start_time;
                if (!startTime) return false;
                const showtimeDate = new Date(startTime);
                const selectedDateObj = new Date(selectedDate);
                return (
                  showtimeDate.getFullYear() === selectedDateObj.getFullYear() &&
                  showtimeDate.getMonth() === selectedDateObj.getMonth() &&
                  showtimeDate.getDate() === selectedDateObj.getDate()
                );
              })
              .map((showtime) => {
                const startTime = showtime.startTime || showtime.start_time;
                return (
                  <option key={showtime.id} value={showtime.id}>
                    {startTime ? new Date(startTime).toLocaleString("vi-VN") : `Suất chiếu #${showtime.id}`}
                  </option>
                );
              })}
          </select>
          <div style={{ height: "20px", marginTop: "4px" }}></div>
        </div>

        {/* Đã bỏ nút tải lại vì đã có cập nhật realtime qua WebSocket */}
      </div>

      {/* Sơ đồ ghế */}
      {selectedShowtimeId && (
        <div
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            padding: "30px",
            borderRadius: "12px",
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>
              Đang tải sơ đồ ghế...
            </div>
          ) : seats.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>
              Chưa có ghế nào trong phòng này
            </div>
          ) : (
            <>
              {/* Màn hình */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "30px",
                  padding: "15px",
                  borderTop: "3px dashed #555",
                  borderBottom: "3px dashed #555",
                }}
              >
                <span style={{ color: "#aaa", fontSize: "18px" }}>Màn hình</span>
              </div>

              {/* Lưới ghế */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                {/* Header cột */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `40px repeat(${cols}, 1fr)`,
                    gap: "8px",
                    width: "100%",
                    maxWidth: "1200px",
                  }}
                >
                  <div></div>
                  {Array.from({ length: cols }, (_, i) => (
                    <div
                      key={i + 1}
                      style={{
                        textAlign: "center",
                        color: "#aaa",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Các hàng ghế */}
                {rowsArray.map((row) => (
                  <div
                    key={row}
                    style={{
                      display: "grid",
                      gridTemplateColumns: `40px repeat(${cols}, 1fr)`,
                      gap: "8px",
                      width: "100%",
                      maxWidth: "1200px",
                    }}
                  >
                    {/* Label hàng */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#aaa",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      {row}
                    </div>

                    {/* Ghế trong hàng */}
                    {Array.from({ length: cols }, (_, colIndex) => {
                      const col = colIndex + 1;
                      const key = `${row}-${col}`;
                      const seat = seatGrid[key];
                      const seatNumber = `${row}${col}`;
                      const selectable = isSeatSelectable(seat);
                      const selected = seat ? isSeatSelected(seat.id) : false;

                      return (
                        <div
                          key={col}
                          onClick={() => handleSeatClick(seat)}
                          style={{
                            position: "relative",
                            aspectRatio: "1",
                            minWidth: "40px",
                            background: getSeatColor(seat),
                            border: seat?.isBooked
                              ? "2px solid #d32f2f"
                              : seat
                              ? "1px solid rgba(255, 255, 255, 0.3)"
                              : selected
                              ? "2px solid #4caf50"
                              : "1px dashed rgba(255, 255, 255, 0.2)",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: getSeatTextColor(seat),
                            opacity: seat?.isHidden ? 0.5 : 1,
                            cursor: selectable ? "pointer" : "default",
                            transition: "transform 0.15s ease, box-shadow 0.15s ease",
                            boxShadow: selected ? "0 0 10px rgba(76, 175, 80, 0.6)" : "none",
                          }}
                          title={
                            seat
                              ? `${seat.seatNumber} - ${seat.type}${seat.isBooked ? " (Đã đặt)" : ""}`
                              : `Chưa có ghế ${seatNumber}`
                          }
                        >
                          {seat?.isBooked ? "X" : seatNumber}
                          {selected && (
                            <Check
                              size={14}
                              style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                color: "#0f1c2c",
                              }}
                            />
                          )}
                          {seat && seat.type === "VIP" && !seat.isBooked && (
                            <span
                              style={{
                                position: "absolute",
                                top: "2px",
                                right: "2px",
                                fontSize: "8px",
                                color: "#ffd700",
                              }}
                            >
                              ★
                            </span>
                          )}
                          {seat && seat.type === "SWEETBOX" && !seat.isBooked && (
                            <span
                              style={{
                                position: "absolute",
                                top: "2px",
                                right: "2px",
                                fontSize: "8px",
                                color: "#fff",
                              }}
                            >
                              ❤
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div
                style={{
                  marginTop: "30px",
                  padding: "20px",
                  background: "rgba(0, 0, 0, 0.3)",
                  borderRadius: "12px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      background: "#d32f2f",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    X
                  </div>
                  <span style={{ fontSize: "14px" }}>Đã đặt</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      background: "#2b3448",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px" }}>Ghế thường</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      background: "#ff9800",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px" }}>Ghế VIP</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      background: "#e91e63",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px" }}>Ghế đôi</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      background: "#ffffff",
                      borderRadius: "6px",
                      border: "1px solid rgba(0, 0, 0, 0.2)",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px" }}>Ghế bị ẩn</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      background: "#4caf50",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px" }}>Đang chọn</span>
                </div>
              </div>

              {canCreateOfflineBooking && (
                <div
                  style={{
                    marginTop: "30px",
                    padding: "24px",
                    background: "rgba(15, 28, 44, 0.65)",
                    borderRadius: "12px",
                    border: "1px solid rgba(25, 118, 210, 0.4)",
                  }}
                >
                  <h3 style={{ marginBottom: "12px", fontSize: "20px" }}>Xuất vé cho khách tại quầy</h3>
                  <p style={{ color: "#cfd8dc", marginBottom: "16px", fontSize: "14px" }}>
                    Chọn ghế còn trống, nhập thông tin khách và xác nhận để giữ vé ngay.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    {selectedSeats.length === 0 ? (
                      <span style={{ color: "#90a4ae" }}>Chưa có ghế nào được chọn.</span>
                    ) : (
                      selectedSeats
                        .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber))
                        .map((seat) => (
                          <span
                            key={seat.id}
                            style={{
                              padding: "6px 12px",
                              background: "#1b5e20",
                              borderRadius: "999px",
                              fontSize: "13px",
                              border: "1px solid rgba(255,255,255,0.2)",
                            }}
                          >
                            {seat.seatNumber}
                          </span>
                        ))
                    )}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "20px",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label style={{ display: "block", marginBottom: "6px", color: "#cfd8dc" }}>
                        Tên khách hàng *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nhập tên khách"
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #333",
                          background: "#0f172a",
                          color: "#fff",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label style={{ display: "block", marginBottom: "6px", color: "#cfd8dc" }}>
                        Số điện thoại
                      </label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="VD: 0912 345 678"
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #333",
                          background: "#0f172a",
                          color: "#fff",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label style={{ display: "block", marginBottom: "6px", color: "#cfd8dc" }}>
                        Mã giảm giá
                      </label>
                      <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                        <input
                          type="text"
                          value={promotionCode}
                          onChange={(e) => {
                            setPromotionCode(e.target.value);
                            setPromotionError("");
                            if (promotionInfo) {
                              setPromotionInfo(null);
                            }
                          }}
                          placeholder="Nhập mã giảm giá"
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: "10px",
                            borderRadius: "6px",
                            border: promotionError ? "1px solid #d32f2f" : "1px solid #333",
                            background: "#0f172a",
                            color: "#fff",
                            boxSizing: "border-box",
                          }}
                        />
                        {promotionInfo ? (
                          <button
                            type="button"
                            onClick={handleRemovePromotion}
                            style={{
                              padding: "10px 16px",
                              borderRadius: "6px",
                              border: "1px solid #4caf50",
                              background: "transparent",
                              color: "#4caf50",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            Hủy
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleValidatePromotion}
                            disabled={isValidatingPromotion || !promotionCode.trim()}
                            style={{
                              padding: "10px 16px",
                              borderRadius: "6px",
                              border: "1px solid #1976d2",
                              background: isValidatingPromotion || !promotionCode.trim() ? "rgba(25,118,210,0.3)" : "#1976d2",
                              color: "#fff",
                              cursor: isValidatingPromotion || !promotionCode.trim() ? "not-allowed" : "pointer",
                              whiteSpace: "nowrap",
                              opacity: isValidatingPromotion || !promotionCode.trim() ? 0.6 : 1,
                              flexShrink: 0,
                            }}
                          >
                            {isValidatingPromotion ? "..." : "Áp dụng"}
                          </button>
                        )}
                      </div>
                      {promotionError && (
                        <small style={{ color: "#d32f2f", marginTop: "4px", display: "block" }}>
                          {promotionError}
                        </small>
                      )}
                      {promotionInfo && (
                        <small style={{ color: "#4caf50", marginTop: "4px", display: "block" }}>
                          {promotionInfo.discountType === "PERCENTAGE"
                            ? `Giảm ${promotionInfo.discountValue}%`
                            : `Giảm ${promotionInfo.discountValue.toLocaleString("vi-VN")} đ`}
                        </small>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label style={{ display: "block", marginBottom: "6px", color: "#cfd8dc" }}>
                        Tổng tiền (VNĐ)
                      </label>
                      <input
                        type="text"
                        value={
                          priceQuote?.totalPrice
                            ? calculateFinalPrice().toLocaleString("vi-VN")
                            : ""
                        }
                        readOnly
                        placeholder="Hệ thống tự tính theo ghế"
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #333",
                          background: "#19253a",
                          color: "#fff",
                          opacity: priceQuote?.totalPrice ? 1 : 0.6,
                          boxSizing: "border-box",
                        }}
                      />
                      {isPricing && (
                        <small style={{ color: "#90caf9", marginTop: "4px", display: "block" }}>
                          Đang tính giá dựa trên ghế đã chọn...
                        </small>
                      )}
                      {promotionInfo && priceQuote?.totalPrice && (
                        <div style={{ marginTop: "4px" }}>
                          <small style={{ color: "#90a4ae", display: "block" }}>
                            Giá gốc: {priceQuote.totalPrice.toLocaleString("vi-VN")} đ
                          </small>
                          {priceQuote.finalPrice !== undefined && priceQuote.finalPrice !== priceQuote.totalPrice && (
                            <small style={{ color: "#4caf50", display: "block", fontWeight: "600" }}>
                              Giá sau giảm: {priceQuote.finalPrice.toLocaleString("vi-VN")} đ
                            </small>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label style={{ display: "block", marginBottom: "6px", color: "#cfd8dc" }}>
                        Phương thức thanh toán
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #333",
                          background: "#0f172a",
                          color: "#fff",
                          boxSizing: "border-box",
                        }}
                      >
                        {paymentOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: "16px" }}>
                    <button
                      onClick={handleCreateOfflineBooking}
                      disabled={isSubmitting || !priceQuote || !priceQuote.totalPrice}
                      style={{
                        padding: "12px 24px",
                        background:
                          isSubmitting || !priceQuote?.totalPrice
                            ? "rgba(25,118,210,0.4)"
                            : "#1976d2",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor:
                          isSubmitting || !priceQuote?.totalPrice ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        fontSize: "15px",
                        boxShadow: "0 8px 24px rgba(25,118,210,0.35)",
                      }}
                    >
                      {isSubmitting ? "Đang xử lý..." : "Xuất vé ngay"}
                    </button>
                  </div>
                  {priceQuote?.seats?.length > 0 && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "12px",
                        borderRadius: "8px",
                        background: "rgba(9, 19, 35, 0.75)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <p style={{ marginBottom: "8px", color: "#cfd8dc", fontWeight: 600 }}>
                        Chi tiết giá:
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {priceQuote.seats.map((seat) => (
                          <span
                            key={seat.seatId}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              background: "rgba(76, 175, 80, 0.18)",
                              border: "1px solid rgba(76, 175, 80, 0.3)",
                              fontSize: "13px",
                            }}
                          >
                            {seat.seatNumber}: {Number(seat.price || 0).toLocaleString("vi-VN")} đ
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

