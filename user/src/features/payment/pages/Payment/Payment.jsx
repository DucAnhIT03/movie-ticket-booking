import React, { useState, useEffect } from "react";
import "../Payment/Payment.css";
import Header from "../../../../shared/layout/Header/Header";
import Footer from "../../../../shared/layout/Footer/Footer";
import { IoMdCheckmark } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import bookingService from "../../../../services/bookings/bookingService";
import paymentService from "../../../../services/payments/paymentService";
import movieService from "../../../../services/movies/movieService";
import showtimeService from "../../../../services/showtimes/showtimeService";
import seatService from "../../../../services/seats/seatService";
import theaterService from "../../../../services/theaters/theaterService";
import promotionService from "../../../../services/promotions/promotionService";
import axiosClient from "../../../../services/axiosClient";
import { isAuthenticated } from "../../../../shared/utils/auth";

export default function PaymentPage() {
  const [selected, setSelected] = useState("VIETQR");
  const [showQRModal, setShowQRModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  // State cho mã khuyến mãi
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // State để lưu thông tin booking
  const [bookingData, setBookingData] = useState({
    movie: null,
    showtime: null,
    theater: null,
    seats: [],
    seatIds: [],
    totalPrice: 0,
    showtimeId: null,
    selectedDate: "",
    selectedTime: "",
  });

  // Kiểm tra đăng nhập khi component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      // Lưu returnUrl để sau khi đăng nhập quay lại trang payment
      localStorage.setItem("returnUrl", "/payment");
      alert("Vui lòng đăng nhập để tiếp tục đặt vé!");
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Load dữ liệu từ localStorage khi component mount
  useEffect(() => {
    const loadBookingData = async () => {
      // Kiểm tra lại authentication trước khi load data
      if (!isAuthenticated()) {
        return;
      }

      try {
        // Lấy dữ liệu từ localStorage
        const selectedSeats = JSON.parse(localStorage.getItem("selectedSeats") || "[]");
        const totalPrice = parseFloat(localStorage.getItem("totalPrice") || "0");
        const showtimeId = parseInt(localStorage.getItem("selectedShowtimeId") || "0");
        const selectedDate = localStorage.getItem("selectedDate") || "";
        const selectedTime = localStorage.getItem("selectedTime") || "";
        const movieId = localStorage.getItem("selectedMovieId");

        console.log("🔍 [Payment] Loading data from localStorage:", {
          selectedSeats,
          totalPrice,
          showtimeId,
          selectedDate,
          selectedTime,
          movieId
        });

        if (!selectedSeats.length || !showtimeId || !movieId) {
          console.warn("⚠️ [Payment] Missing required data");
          setError("Thiếu thông tin đặt vé. Vui lòng chọn ghế lại.");
          return;
        }

        // Parse selectedSeats để lấy seatIds và seatCodes
        const seatIds = [];
        const seatCodes = [];
        selectedSeats.forEach((seatKey) => {
          const [seatId, seatCode] = seatKey.split("-");
          seatIds.push(parseInt(seatId));
          seatCodes.push(seatCode);
        });

        // Fetch thông tin movie
        const movieRes = await movieService.getMovieById(movieId);
        if (movieRes.status !== 200 || !movieRes.data) {
          setError("Không tìm thấy thông tin phim.");
          return;
        }
        const movie = movieRes.data;
        console.log("🎬 [Payment] Movie data:", movie);

        // Fetch thông tin showtime theo ID
        let showtime = null;
        try {
          console.log("🔍 [Payment] Fetching showtime by ID:", showtimeId);
          const showtimeRes = await showtimeService.getById(showtimeId);
          console.log("📥 [Payment] Showtime response:", showtimeRes);
          if (showtimeRes.status === 200 && showtimeRes.data) {
            showtime = showtimeRes.data;
            console.log("✅ [Payment] Found showtime:", showtime);
            console.log("🏢 [Payment] Theater info:", {
              screen: showtime.screen,
              theater: showtime.screen?.theater,
              theaterName: showtime.screen?.theater?.name
            });
          }
        } catch (err) {
          console.warn("⚠️ [Payment] Error fetching showtime by ID, trying getAll:", err);
        }

        // Fallback: Nếu không tìm thấy theo ID, thử tìm trong danh sách
        if (!showtime) {
          console.log("🔄 [Payment] Trying fallback: getAll showtimes");
          const showtimeRes = await showtimeService.getAll({ limit: 1000 });
          console.log("📥 [Payment] GetAll response:", showtimeRes);
          const allShowtimes = Array.isArray(showtimeRes.data) 
            ? showtimeRes.data 
            : showtimeRes.data?.data || showtimeRes.data?.items || [];
          console.log("📋 [Payment] All showtimes:", allShowtimes.length);
          showtime = allShowtimes.find((st) => st.id === showtimeId);
          if (showtime) {
            console.log("✅ [Payment] Found showtime in list:", showtime);
          }
        }

        // Nếu không tìm thấy showtime, vẫn cho phép hiển thị giao diện với dữ liệu có sẵn
        if (!showtime) {
          console.error("❌ [Payment] Showtime not found:", {
            showtimeId,
            selectedSeats,
            movieId,
            selectedDate,
            selectedTime
          });
          // Không set error để vẫn hiển thị giao diện thanh toán
          // setError("Không tìm thấy suất chiếu. Vui lòng chọn ghế lại.");
          // return;
        }

        // Fetch thông tin theater
        let theater = null;
        
        // Ưu tiên dùng theater từ showtime nếu đã có
        if (showtime?.screen?.theater) {
          theater = showtime.screen.theater;
          console.log("✅ [Payment] Using theater from showtime:", theater);
        } else {
          // Nếu không có, fetch từ API
          const theaterId = showtime?.screen?.theaterId;
          console.log("🏢 [Payment] Theater ID:", theaterId, "Screen:", showtime?.screen);
          
          if (theaterId) {
            try {
              const theaterRes = await theaterService.getById(theaterId);
              console.log("📥 [Payment] Theater response:", theaterRes);
              if (theaterRes.status === 200 && theaterRes.data) {
                theater = theaterRes.data;
                console.log("✅ [Payment] Found theater from API:", theater);
              } else {
                console.warn("⚠️ [Payment] Theater response status:", theaterRes.status, theaterRes.data);
              }
            } catch (err) {
              console.error("❌ [Payment] Error fetching theater:", err);
            }
          } else {
            console.warn("⚠️ [Payment] No theaterId found in showtime.screen");
          }
        }

        setBookingData({
          movie,
          showtime,
          theater,
          seats: seatCodes,
          seatIds,
          totalPrice,
          showtimeId,
          selectedDate,
          selectedTime,
        });
      } catch (err) {
        console.error("Error loading booking data:", err);
        setError("Có lỗi xảy ra khi tải thông tin đặt vé.");
      }
    };

    loadBookingData();
  }, []);

  // Tính tổng tiền sau khi áp dụng khuyến mãi
  const calculateTotalWithPromotion = () => {
    let total = bookingData.totalPrice;
    
    if (appliedPromotion) {
      const { discountType, discountValue } = appliedPromotion;
      
      if (discountType === 'PERCENT') {
        // Giảm theo phần trăm
        const discount = (total * discountValue) / 100;
        total = total - discount;
      } else if (discountType === 'AMOUNT') {
        // Giảm theo số tiền cố định
        total = total - discountValue;
      }
      
      // Đảm bảo tổng tiền không âm
      if (total < 0) total = 0;
    }
    
    return total;
  };
  
  const total = calculateTotalWithPromotion();
  const originalTotal = bookingData.totalPrice;
  const discountAmount = originalTotal - total;

  const methods = [
    { id: "VIETQR", name: "VietQR", img: "/vietqr.png" },
    { id: "VNPAY", name: "VNPAY", img: "/vnpay.png" },
    { id: "VIETTEL_PAY", name: "Viettel Money", img: "/viettelmoney.png" },
  ];

  // Tạo mã QR giả cho demo
  const generateQRCode = (method) => {
    const movieName = bookingData.movie?.name || "Phim";
    const qrData = {
      VIETQR: `https://api.vietqr.io/v2/generate?accountNo=1234567890&accountName=CINEMA&amount=${total}&description=Thanh toan ve phim ${movieName}`,
      VNPAY: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=${total * 100}&vnp_Command=pay&vnp_CreateDate=20241114102500&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh toan ve phim&vnp_OrderType=other&vnp_ReturnUrl=https://cinema.com&vnp_TmnCode=DEMO&vnp_TxnRef=123456789&vnp_Version=2.1.0`,
      VIETTEL_PAY: `viettel://payment?amount=${total}&description=Thanh toan ve phim ${movieName}&merchant=CINEMA`,
    };
    return qrData[method] || qrData.VIETQR;
  };

  const handlePayment = async () => {
    if (!bookingData.showtimeId || !bookingData.seatIds.length || !total) {
      setError("Thiếu thông tin đặt vé. Vui lòng kiểm tra lại.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Bước 1: Tạo booking
      const bookingResponse = await bookingService.createBooking({
        showtimeId: bookingData.showtimeId,
        seatIds: bookingData.seatIds,
        totalPriceMovie: total,
      });

      if (bookingResponse.status !== 201) {
        throw new Error("Không thể tạo booking.");
      }

      const booking = bookingResponse.data;
      const bookingId = booking.id;

      // Bước 2: Tạo payment (với promotion nếu có)
      const paymentData = {
        bookingId: bookingId,
        method: selected,
        amount: total,
      };
      
      // Thêm promotionId nếu có mã khuyến mãi đã áp dụng
      if (appliedPromotion && appliedPromotion.id) {
        paymentData.promotionId = appliedPromotion.id;
      }
      
      const paymentResponse = await paymentService.createPayment(paymentData);

      if (paymentResponse.status !== 201) {
        throw new Error("Không thể tạo payment.");
      }

      const payment = paymentResponse.data;

      // Lưu bookingId và paymentId vào localStorage để sử dụng sau
      localStorage.setItem("currentBookingId", bookingId.toString());
      localStorage.setItem("currentPaymentId", payment.id.toString());

      // Nếu là VNPAY, redirect đến VNPAY payment URL
      if (selected === "VNPAY") {
        try {
          // Tạo return URL - phải trỏ đến backend API endpoint
          // Lấy API base URL từ axiosClient
          const apiBaseUrl = axiosClient.defaults.baseURL || 'http://localhost:3000';
          const returnUrl = `${apiBaseUrl}/api/payments/vnpay/return`;
          
          console.log("🔗 [Payment] Creating VNPAY URL with returnUrl:", returnUrl);
          console.log("💳 [Payment] Payment ID:", payment.id);
          
          // Tạo VNPAY payment URL
          const vnpayUrlResponse = await paymentService.createVnpayUrl(
            payment.id,
            returnUrl
          );

          console.log("📥 [Payment] VNPAY URL response:", vnpayUrlResponse);
          console.log("📥 [Payment] Response status:", vnpayUrlResponse.status);
          console.log("📥 [Payment] Response data:", vnpayUrlResponse.data);
          console.log("📥 [Payment] Response data type:", typeof vnpayUrlResponse.data);

          // Lấy paymentUrl từ response
          // Axios wrap response trong .data, nhưng có thể structure khác
          let paymentUrl = null;
          
          if (vnpayUrlResponse.data) {
            // Thử các cách truy cập khác nhau
            paymentUrl = vnpayUrlResponse.data.paymentUrl || 
                        vnpayUrlResponse.data?.data?.paymentUrl ||
                        (typeof vnpayUrlResponse.data === 'string' ? vnpayUrlResponse.data : null);
          }

          console.log("🔗 [Payment] Extracted paymentUrl:", paymentUrl);

          // Kiểm tra status 200 hoặc 201 (Created) và có paymentUrl
          if ((vnpayUrlResponse.status === 200 || vnpayUrlResponse.status === 201) && paymentUrl) {
            console.log("✅ [Payment] Redirecting to VNPAY:", paymentUrl);
            // Redirect đến VNPAY
            window.location.href = paymentUrl;
            return; // Không cần set loading false vì đang redirect
          } else {
            console.error("❌ [Payment] Invalid VNPAY URL response:", {
              status: vnpayUrlResponse.status,
              data: vnpayUrlResponse.data,
              paymentUrl: paymentUrl
            });
            throw new Error("Không thể tạo VNPAY payment URL. Response không hợp lệ.");
          }
        } catch (vnpayError) {
          console.error("❌ [Payment] Error creating VNPAY URL:", vnpayError);
          
          // Hiển thị lỗi chi tiết hơn
          let vnpayErrorMessage = "Không thể tạo liên kết thanh toán VNPAY. Vui lòng thử lại.";
          
          if (vnpayError.response) {
            const status = vnpayError.response.status;
            const data = vnpayError.response.data;
            console.error("❌ [Payment] VNPAY Error Status:", status);
            console.error("❌ [Payment] VNPAY Error Data:", data);
            
            if (status === 400) {
              // Lấy message từ response
              if (data?.message) {
                vnpayErrorMessage = data.message;
              } else if (Array.isArray(data?.message)) {
                // Nếu là array của validation errors
                vnpayErrorMessage = data.message.join(', ');
              } else if (typeof data === 'string') {
                vnpayErrorMessage = data;
              } else {
                vnpayErrorMessage = "Cấu hình VNPAY chưa đúng hoặc dữ liệu không hợp lệ. Vui lòng kiểm tra lại file .env và khởi động lại backend.";
              }
            } else if (status === 401) {
              vnpayErrorMessage = "Bạn cần đăng nhập để thanh toán VNPAY.";
            } else if (status === 404) {
              vnpayErrorMessage = "Không tìm thấy payment. Vui lòng thử lại.";
            } else {
              vnpayErrorMessage = data?.message || `Lỗi ${status}: Không thể tạo VNPAY payment URL.`;
            }
          } else if (vnpayError.message) {
            vnpayErrorMessage = vnpayError.message;
          }
          
          console.error("❌ [Payment] Final error message:", vnpayErrorMessage);
          throw new Error(vnpayErrorMessage);
        }
      }

      // Hiển thị modal QR cho các phương thức khác
      setShowQRModal(true);
    } catch (err) {
      console.error("Error processing payment:", err);
      
      let errorMessage = "Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.";
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        if (status === 409) {
          // Conflict - thường là ghế đã được đặt
          errorMessage = data?.message || "Một hoặc nhiều ghế đã được đặt bởi người khác. Vui lòng chọn ghế khác.";
        } else if (status === 400) {
          // Bad Request
          errorMessage = data?.message || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
        } else if (status === 404) {
          // Not Found
          errorMessage = data?.message || "Không tìm thấy suất chiếu hoặc ghế. Vui lòng chọn lại.";
        } else if (status === 401) {
          // Unauthorized
          errorMessage = "Bạn cần đăng nhập để đặt vé. Vui lòng đăng nhập lại.";
        } else {
          errorMessage = data?.message || errorMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeQRModal = () => {
    setShowQRModal(false);
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);
    try {
      const paymentId = localStorage.getItem("currentPaymentId");
      if (paymentId) {
        // Hoàn thành payment
        await paymentService.completePayment(
          parseInt(paymentId),
          `TXN_${Date.now()}`,
          true
        );
      }

      // Xóa dữ liệu tạm
      localStorage.removeItem("selectedSeats");
      localStorage.removeItem("totalPrice");
      localStorage.removeItem("currentBookingId");
      localStorage.removeItem("currentPaymentId");

    setShowQRModal(false);
    navigate("/payment-success");
    } catch (err) {
      console.error("Error completing payment:", err);
      setError("Có lỗi xảy ra khi hoàn tất thanh toán.");
      setLoading(false);
    }
  };

  const handlePaymentFailure = async () => {
    setLoading(true);
    try {
      const paymentId = localStorage.getItem("currentPaymentId");
      const bookingId = localStorage.getItem("currentBookingId");

      if (paymentId) {
        // Đánh dấu payment là failed
        await paymentService.completePayment(
          parseInt(paymentId),
          `TXN_${Date.now()}`,
          false
        );
      }

      if (bookingId) {
        // Hủy booking
        await bookingService.cancelBooking(parseInt(bookingId));
      }

      // Xóa dữ liệu tạm
      localStorage.removeItem("selectedSeats");
      localStorage.removeItem("totalPrice");
      localStorage.removeItem("currentBookingId");
      localStorage.removeItem("currentPaymentId");

    setShowQRModal(false);
    navigate("/payment-failure");
    } catch (err) {
      console.error("Error canceling payment:", err);
      setError("Có lỗi xảy ra khi hủy thanh toán.");
      setLoading(false);
    }
  };

  // Format date và time
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    // Format từ DD-MM-YYYY sang DD/MM/YYYY
    return dateStr.replace(/-/g, "/");
  };

  // Hàm áp dụng mã khuyến mãi
  const handleApplyPromoCode = async () => {
    const codeToApply = promoCode.trim();
    if (!codeToApply) {
      setPromoError("Vui lòng nhập mã khuyến mãi");
      return;
    }

    setIsApplyingPromo(true);
    setPromoError("");

    console.log("🔍 [Payment] Applying promotion code:", codeToApply);

    try {
      // Gửi mã code như user nhập (không tự động uppercase)
      // Backend sẽ xử lý case-insensitive nếu cần
      const response = await promotionService.applyCode(codeToApply);
      
      console.log("📥 [Payment] Promotion API response (full):", response);
      console.log("📥 [Payment] Promotion API response (details):", {
        status: response?.status,
        statusText: response?.statusText,
        data: response?.data,
        headers: response?.headers,
        responseType: typeof response
      });
      
      // Axios trả về response với data trong response.data
      // Nếu status là 200-299, axios tự động coi là success
      // Nếu có lỗi, axios sẽ throw error
      if (response && response.data) {
        // Backend đã trả về đầy đủ thông tin promotion (id, code, title, discountType, discountValue)
        setAppliedPromotion(response.data);
        setPromoError("");
        console.log("✅ [Payment] Promotion applied successfully:", response.data);
      } else {
        const errorMsg = response?.data?.message || "Mã khuyến mãi không hợp lệ hoặc đã hết hạn";
        console.warn("⚠️ [Payment] Promotion apply failed - no data:", {
          status: response?.status,
          data: response?.data,
          fullResponse: response
        });
        setPromoError(errorMsg);
        setAppliedPromotion(null);
      }
    } catch (error) {
      console.error("❌ [Payment] Error applying promotion:", {
        error,
        message: error.message,
        response: error.response,
        responseData: error.response?.data,
        responseStatus: error.response?.status,
        code: codeToApply
      });
      
      let errorMessage = "Mã khuyến mãi không hợp lệ hoặc đã hết hạn";
      
      if (error.response) {
        // Có response từ server
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data?.message || "Mã khuyến mãi không hợp lệ";
        } else if (status === 404) {
          errorMessage = data?.message || "Không tìm thấy mã khuyến mãi";
        } else if (status === 401) {
          errorMessage = "Bạn cần đăng nhập để sử dụng mã khuyến mãi";
        } else {
          errorMessage = data?.message || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setPromoError(errorMessage);
      setAppliedPromotion(null);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Hàm xóa mã khuyến mãi
  const handleRemovePromoCode = () => {
    setPromoCode("");
    setAppliedPromotion(null);
    setPromoError("");
  };

  // Chỉ hiển thị loading khi chưa có dữ liệu và không có lỗi nghiêm trọng
  if (!bookingData.movie && !error) {
    return (
      <div className="payment-wrapper">
        <Header />
        <main className="content" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ color: "#fff", fontSize: "18px" }}>Đang tải thông tin...</div>
        </main>
        <Footer />
      </div>
    );
  }

  // Nếu có lỗi nghiêm trọng và không có dữ liệu, hiển thị lỗi
  if (error && !bookingData.movie && !bookingData.seats.length) {
    return (
      <div className="payment-wrapper">
        <Header />
        <main className="content" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ 
            color: "#ff4444", 
            fontSize: "18px", 
            marginBottom: "20px",
            padding: "20px",
            backgroundColor: "#ffebee",
            borderRadius: "8px",
            border: "2px solid #f44336"
          }}>
            {error}
          </div>
          <button
            className="btn-back"
            onClick={() => navigate("/")}
            style={{ marginTop: "20px", padding: "10px 20px" }}
          >
            Về trang chủ
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="payment-wrapper">
      <Header />

      {error && (
        <div style={{
          margin: "20px auto",
          maxWidth: "600px",
          padding: "16px 20px",
          backgroundColor: "#ffebee",
          border: "2px solid #f44336",
          borderLeft: "5px solid #f44336",
          borderRadius: "8px",
          color: "#c62828",
          fontSize: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <span style={{ fontWeight: "500" }}>{error}</span>
          </div>
          {error.includes("ghế") && (
            <button
              onClick={() => {
                // Xóa dữ liệu và quay lại chọn ghế
                localStorage.removeItem("selectedSeats");
                localStorage.removeItem("totalPrice");
                navigate(-1);
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f44336",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                alignSelf: "flex-start",
              }}
            >
              Quay lại chọn ghế
            </button>
          )}
        </div>
      )}

      <main className="content">
        {/* LEFT COLUMN */}
        <div className="left-column">
          {/* Movie Information Card */}
          <div className="info-card">
            <h3>Thông tin phim</h3>
            <div className="movie-info">
              <div className="info-row">
                <span className="label">Phim</span>
                <span className="value">{bookingData.movie?.title || bookingData.movie?.name || "N/A"}</span>
              </div>
              <div className="info-row">
                <span className="label">Ngày giờ chiếu</span>
                <span className="value highlight">
                  {bookingData.selectedTime || "N/A"} - {formatDate(bookingData.selectedDate) || "N/A"}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Tên rạp</span>
                <span className="value">
                  {bookingData.theater?.name || 
                   bookingData.showtime?.screen?.theater?.name || 
                   "N/A"}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Ghế</span>
                <span className="value">{bookingData.seats.length > 0 ? bookingData.seats.join(", ") : "N/A"}</span>
              </div>
              <div className="info-row">
                <span className="label">Phòng chiếu</span>
                <span className="value">
                  {bookingData.showtime?.screen?.name || bookingData.showtime?.screenId || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information Card */}
          <div className="info-card">
            <h3>Thông tin thanh toán</h3>
            <div className="payment-table">
              <div className="table-header">
                <span>Danh mục</span>
                <span>Số lượng</span>
              </div>
              <div className="table-row">
                <span>Ghế ({bookingData.seats.join(",")})</span>
                <span>{bookingData.seats.length}</span>
              </div>
              <div className="total-row">
                <span>Tổng tiền</span>
                <span>{total.toLocaleString("vi-VN")}₫</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="right-column">
          {/* Payment Methods Card */}
          <div className="info-card">
            <h3>Phương thức thanh toán</h3>
            <div className="methods">
              {methods.map((m) => (
                <label
                  key={m.id}
                  className={`method ${selected === m.id ? "selected" : ""}`}
                  onClick={() => setSelected(m.id)}
                >
                  <span className="custom-radio">
                    {selected === m.id && <span className="checkmark"><IoMdCheckmark /></span>}
                  </span>
                  <img src={m.img} alt={m.name} />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Summary Card */}
          <div className="info-card">
            <h3>Thông tin thanh toán</h3>
            <div className="payment-summary">
              {/* Mã khuyến mãi */}
              <div className="promo-section" style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "14px", marginBottom: "10px", color: "#ccc" }}>Mã khuyến mãi</h4>
                {!appliedPromotion ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError("");
                      }}
                      placeholder="Nhập mã khuyến mãi"
                      style={{
                        flex: 1,
                        padding: "10px",
                        background: "#242b36",
                        color: "#fff",
                        border: promoError ? "1px solid #f44336" : "1px solid #333",
                        borderRadius: "5px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleApplyPromoCode();
                        }
                      }}
                    />
                    <button
                      onClick={handleApplyPromoCode}
                      disabled={isApplyingPromo || !promoCode.trim()}
                      style={{
                        padding: "10px 20px",
                        background: isApplyingPromo || !promoCode.trim() ? "#666" : "#e53935",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: isApplyingPromo || !promoCode.trim() ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      {isApplyingPromo ? "Đang kiểm tra..." : "Áp dụng"}
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px",
                    background: "#1a5f1a",
                    border: "1px solid #4caf50",
                    borderRadius: "5px",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#4caf50", fontSize: "14px", fontWeight: "500" }}>
                        ✓ {appliedPromotion.code}
                      </div>
                      {appliedPromotion.title && (
                        <div style={{ color: "#aaa", fontSize: "12px", marginTop: "4px" }}>
                          {appliedPromotion.title}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleRemovePromoCode}
                      style={{
                        padding: "5px 10px",
                        background: "transparent",
                        color: "#f44336",
                        border: "1px solid #f44336",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                )}
                {promoError && (
                  <div style={{
                    marginTop: "8px",
                    color: "#f44336",
                    fontSize: "12px",
                  }}>
                    {promoError}
                  </div>
                )}
              </div>

              <div className="summary-section">
                <h4>Chi tiết</h4>
                <div className="payment-table">
                  <div className="table-row">
                    <span>Ghế ({bookingData.seats.join(",")})</span>
                    <span>{bookingData.seats.length}</span>
                  </div>
                  <div className="table-row">
                    <span>Thanh toán</span>
                    <span>{originalTotal.toLocaleString("vi-VN")}₫</span>
                  </div>
                  {appliedPromotion && discountAmount > 0 && (
                    <div className="table-row" style={{ color: "#4caf50" }}>
                      <span>Giảm giá ({appliedPromotion.discountType === 'PERCENT' ? `${appliedPromotion.discountValue}%` : `${appliedPromotion.discountValue.toLocaleString("vi-VN")}₫`})</span>
                      <span>-{discountAmount.toLocaleString("vi-VN")}₫</span>
                    </div>
                  )}
                  <div className="table-row">
                    <span>Phí</span>
                    <span>0₫</span>
                  </div>
                  <div className="total-row">
                    <span>Tổng cộng</span>
                    <span>{total.toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>
              </div>

              <button 
                className="btn-pay" 
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Thanh toán"}
              </button>
              <button 
                className="btn-back"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Quay lại
              </button>

              <p className="note">
                <span className="note-label">Lưu ý:</span> Không mua vé cho trẻ em dưới 13 tuổi đối
                với các suất chiếu kết thúc sau 22h00 và không mua vé cho trẻ em
                dưới 16 tuổi đối với các suất chiếu phim kết thúc sau 23h00.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="qr-modal-overlay" onClick={closeQRModal}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h3>Quét mã QR để thanh toán</h3>
              <button className="close-btn" onClick={closeQRModal}>
                <IoClose />
              </button>
            </div>
            
            <div className="qr-modal-content">
              <div className="payment-info">
                <div className="selected-method">
                  <img src={methods.find(m => m.id === selected)?.img} alt={methods.find(m => m.id === selected)?.name} />
                  <span>{methods.find(m => m.id === selected)?.name}</span>
                </div>
                <div className="amount-info">
                  <span className="amount-label">Số tiền:</span>
                  <span className="amount-value">{total.toLocaleString("vi-VN")}₫</span>
                </div>
              </div>
              
              <div className="qr-code-container">
                <div className="qr-code">
                  <img src="/maqrthanhtoan.png" alt="Mã QR thanh toán" className="qr-image" />
                </div>
                <p className="qr-instruction">
                  Mở ứng dụng {methods.find(m => m.id === selected)?.name} và quét mã QR để thanh toán
                </p>
              </div>
              
              <div className="payment-details">
                <div className="detail-row">
                  <span>Phim:</span>
                  <span>{bookingData.movie?.name || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span>Ghế:</span>
                  <span>{bookingData.seats.join(", ")}</span>
                </div>
                <div className="detail-row">
                  <span>Thời gian:</span>
                  <span>
                    {bookingData.selectedTime} - {formatDate(bookingData.selectedDate)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="qr-modal-footer">
              <button 
                className="btn-cancel" 
                onClick={handlePaymentFailure}
                disabled={loading}
              >
                Hủy thanh toán
              </button>
              <button 
                className="btn-confirm" 
                onClick={handlePaymentSuccess}
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đã thanh toán"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
