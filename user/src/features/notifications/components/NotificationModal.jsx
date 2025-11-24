import React, { useState, useEffect } from "react";
import { FaTimes, FaGift, FaCalendarAlt } from "react-icons/fa";
import promotionService from "../../../services/promotions/promotionService";
import ReadMoreText from "./ReadMoreText";
import "./NotificationModal.css";

export default function NotificationModal({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await promotionService.getMyNotifications();
      if (response.status === 200) {
        setNotifications(response.data || []);
      } else {
        console.error("Error loading notifications:", response.status);
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
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

  const formatDiscount = (type, value) => {
    if (type === "PERCENT") {
      return `Giảm ${value}%`;
    }
    return `Giảm ${parseInt(value).toLocaleString("vi-VN")} VND`;
  };

  if (!isOpen) return null;

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <h3>Thông báo</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes size={20} />
          </button>
        </div>

        <div className="notification-content">
          {loading ? (
            <div className="notification-loading">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <FaGift size={48} style={{ color: "#888", marginBottom: "10px" }} />
              <p>Bạn chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notif) => (
                <div key={notif.id} className="notification-item">
                  {notif.image && (
                    <img
                      src={notif.image}
                      alt={notif.title || notif.code}
                      className="notification-image"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                  <div className="notification-info">
                    <div className="notification-title">
                      {notif.title || notif.code}
                    </div>
                    {notif.description && (
                      <ReadMoreText
                        text={notif.description}
                        maxLines={3}
                        className="notification-description"
                      />
                    )}
                    <div className="notification-details">
                      <span className="notification-discount">
                        <FaGift size={14} />
                        {formatDiscount(notif.discountType, notif.discountValue)}
                      </span>
                      {notif.endAt && (
                        <span className="notification-date">
                          <FaCalendarAlt size={14} />
                          HSD: {formatDate(notif.endAt)}
                        </span>
                      )}
                    </div>
                    {notif.code && (
                      <div className="notification-code">
                        Mã: <strong>{notif.code}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

