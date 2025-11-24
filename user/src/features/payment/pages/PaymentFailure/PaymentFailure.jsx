import React from "react";
import { useNavigate } from "react-router-dom";
import "./PaymentFailure.css";
import Header from "../../../../shared/layout/Header/Header";
import Footer from "../../../../shared/layout/Footer/Footer";
import { FaTimesCircle } from "react-icons/fa";

export default function PaymentFailurePage() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  const handleTryAgain = () => {
    navigate("/payment");
  };

  return (
    <div className="payment-failure-wrapper">
      <Header />
      
      <main className="failure-content">
        <div className="failure-container">
          <div className="failure-icon">
            <FaTimesCircle className="error-icon" />
          </div>
          
          <h1 className="failure-title">Thanh toán thất bại!</h1>
          
          <p className="failure-note">
            Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
          </p>
          
          <div className="action-buttons">
            <button className="btn-try-again" onClick={handleTryAgain}>
              Thử lại
            </button>
            <button className="btn-go-home" onClick={handleGoHome}>
              Về trang chủ
            </button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
