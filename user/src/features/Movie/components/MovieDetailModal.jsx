import React from "react";
import "./MovieDetailModal.css";

export default function MovieDetailModal({ movie, isOpen, onClose }) {
  if (!isOpen || !movie) return null;

  const descriptions = movie.descriptions || movie.description || "Chưa có mô tả chi tiết.";

  return (
    <div className="movie-detail-modal-overlay" onClick={onClose}>
      <div className="movie-detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="movie-detail-modal-header">
          <h2>{movie.title || "Chi tiết nội dung"}</h2>
          <button className="movie-detail-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="movie-detail-modal-body">
          <div className="movie-detail-description">
            <h3>Nội dung phim</h3>
            <p>{descriptions}</p>
          </div>
          {movie.duration && (
            <div className="movie-detail-info">
              <p><strong>Thời lượng:</strong> {movie.duration} phút</p>
            </div>
          )}
          {movie.country && (
            <div className="movie-detail-info">
              <p><strong>Xuất xứ:</strong> {movie.country}</p>
            </div>
          )}
          {movie.author && (
            <div className="movie-detail-info">
              <p><strong>Đạo diễn:</strong> {movie.author}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




