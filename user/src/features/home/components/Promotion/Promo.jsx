import React from "react";
import "./Promo.css";
import { useNavigate } from "react-router-dom";

export default function Promo({ promos, loading }) {
  const navigate = useNavigate();

  const handleViewAll = () => {
    navigate("/promotions");
  };

  if (loading) {
    return (
      <div className="promo">
        <div className="option">
          <h3>Khuyến mãi</h3>
          <h3>Xem tất cả</h3>
        </div>
        <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
          Đang tải...
        </div>
      </div>
    );
  }

  if (!promos || promos.length === 0) {
    return (
      <div className="promo">
        <div className="option">
          <h3>Khuyến mãi</h3>
          <h3 onClick={handleViewAll} style={{ cursor: "pointer" }}>Xem tất cả</h3>
        </div>
        <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
          Không có khuyến mãi nào
        </div>
      </div>
    );
  }

  return (
    <div className="promo">
      <div className="option">
        <h3>Khuyến mãi</h3>
        <h3 onClick={handleViewAll} style={{ cursor: "pointer" }}>Xem tất cả</h3>
      </div>
      {promos.map((p) => (
        <img 
          key={p.id} 
          src={p.image || '/event.jpg'} 
          alt={p.title || p.code || "promo"}
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/promotions")}
          onError={(e) => {
            e.target.src = '/event.jpg';
          }}
        />
      ))}
    </div>
  );
}
