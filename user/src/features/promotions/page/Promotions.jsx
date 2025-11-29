import React, { useState, useEffect } from 'react';
import './Promotions.css';
import Header from "../../../shared/layout/Header/Header.jsx";
import Footer from "../../../shared/layout/Footer/Footer.jsx";
import promotionService from "../../../services/promotions/promotionService";

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response = await promotionService.getAll();
      if (response.status === 200) {
        const data = response.data;
        const items = Array.isArray(data) ? data : (data.items || data.data || []);

        const activePromotions = items.filter(
          (promo) => promo.active && promo.status === 'ACTIVE' && promo.image
        );
        setPromotions(activePromotions);
      }
    } catch (err) {
      console.error("Error loading promotions:", err);
      setError("Không thể tải danh sách khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="promotions-wrapper">
      <Header />

      <main className="promotions-content">
        <h1 className="promotions-title">Khuyến mãi</h1>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            Đang tải...
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#dc3545" }}>
            {error}
          </div>
        ) : promotions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            Không có khuyến mãi nào
          </div>
        ) : (
          <>
            <div className="promotions-grid">
              {promotions.map((promo) => (
                <div key={promo.id} className="promotion-card">
                  <img 
                    src={promo.image || '/event.jpg'} 
                    alt={promo.title || promo.code} 
                    className="promo-image"
                    onError={(e) => {
                      e.target.src = '/event.jpg';
                    }}
                  />
                  <div className="promo-info">
                    <div className="promo-date">
                      {promo.startAt ? formatDate(promo.startAt) : ""}
                    </div>
                    <h3 className="promo-title">{promo.title || promo.code}</h3>
                    {promo.description && (
                      <p className="promo-description" style={{ 
                        marginTop: "8px", 
                        fontSize: "14px", 
                        color: "#666",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {promo.description}
                      </p>
                    )}
                    <div className="promo-discount" style={{
                      marginTop: "8px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#667eea"
                    }}>
                      {promo.discountType === "PERCENT" 
                        ? `Giảm ${promo.discountValue}%`
                        : `Giảm ${parseInt(promo.discountValue).toLocaleString("vi-VN")} VND`
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pagination">
              <button className="btn-outline back">Quay lại</button>
              <button className="btn-outline">Tiếp theo</button>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Promotions;