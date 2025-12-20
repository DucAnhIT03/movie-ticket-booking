import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PaymentSuccess.css";
import Header from "../../../../shared/layout/Header/Header";
import Footer from "../../../../shared/layout/Footer/Footer";
import { FaStar } from "react-icons/fa";
import paymentService from "../../../../services/payments/paymentService";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [note, setNote] = useState("Lưu ý: Hãy đến đúng giờ của suất chiếu và tận hưởng bộ phim");

  useEffect(() => {
    const finalizePayment = async () => {
      try {
        const params = new URLSearchParams(location.search);
       
        const rawPaymentId =
          params.get("paymentId") ||
          params.get("orderId") ||
          localStorage.getItem("currentPaymentId");

       
        const paymentIdMatch = rawPaymentId?.match(/^PAY(\d+)_/);
        const paymentId = paymentIdMatch ? paymentIdMatch[1] : rawPaymentId;
        const resultCode = params.get("resultCode");
        const transId = params.get("transId") || params.get("orderId") || params.get("requestId");

        if (!paymentId) return;

        const success = !resultCode || Number(resultCode) === 0;
        const res = await paymentService.completePayment(
          paymentId,
          transId || `momo-${Date.now()}`,
          success
        );

        // API trả PaymentResponseDto với payment_status
        const paymentStatus = res?.payment_status || res?.status;
        if (!res || paymentStatus !== "COMPLETED") {
          setNote(
            "Thanh toán trên MoMo thành công nhưng hệ thống chưa xác nhận. Vui lòng tải lại sau ít phút hoặc liên hệ hỗ trợ."
          );
        }

        // Dọn session tạm
        localStorage.removeItem("currentBookingId");
        localStorage.removeItem("currentPaymentId");
        localStorage.removeItem("selectedSeats");
        localStorage.removeItem("totalPrice");
      } catch (err) {
        console.error("Finalize payment failed:", err);
        setNote("Thanh toán đã hoàn tất trên MoMo, hệ thống đang đồng bộ. Nếu ghế chưa đổi trạng thái, vui lòng tải lại hoặc liên hệ hỗ trợ.");
      }
    };

    finalizePayment();
  }, [location.search]);

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="payment-success-wrapper">
      <Header />
      
      <main className="success-content">
        <div className="success-container">
          <div className="success-icon">
            <FaStar className="star-icon" />
            <div className="sparkles">
              <div className="sparkle sparkle-1"></div>
              <div className="sparkle sparkle-2"></div>
              <div className="sparkle sparkle-3"></div>
              <div className="sparkle sparkle-4"></div>
              <div className="sparkle sparkle-5"></div>
              <div className="sparkle sparkle-6"></div>
            </div>
          </div>
          
          <h1 className="success-title">Đặt vé thành công!</h1>
          
          <p className="success-note">{note}</p>
          
          <button className="btn-go-home" onClick={handleGoHome}>
            Về trang chủ
          </button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
