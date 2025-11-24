import React from "react";
import { useNavigate } from "react-router-dom";
import "./PaymentSuccess.css";
import Header from "../../../../shared/layout/Header/Header";
import Footer from "../../../../shared/layout/Footer/Footer";
import { FaStar } from "react-icons/fa";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();

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
          
          <p className="success-note">
            Lưu ý: Hãy đến đúng giờ của suất chiếu và tận hưởng bộ phim
          </p>
          
          <button className="btn-go-home" onClick={handleGoHome}>
            Về trang chủ
          </button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
