import React from "react";
import "./FilmList.css";
import MovieCard from "../MovieCard/MovieCard";

/**
 * Component hiển thị danh sách phim
 * @param {string} title - Tiêu đề section (ví dụ: "Phim đang chiếu")
 * @param {Array} films - Danh sách phim từ API
 * @param {boolean} loading - Trạng thái loading
 * @param {string|null} error - Thông báo lỗi (nếu có)
 */
export default function FilmList({ title, films = [], loading = false, error = null }) {
  return (
    <div className="film-section">
      <div className="title">
        <div className="left-group">
          <div className="circle"></div>
          <h2>{title}</h2>
        </div>
        <span className="view-all">Xem tất cả</span>
      </div>

      {loading && (
        <div className="film-list-loading">
          <p>Đang tải danh sách phim...</p>
        </div>
      )}

      {error && !loading && (
        <div className="film-list-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && films.length === 0 && (
        <div className="film-list-empty">
          <p>Chưa có phim nào</p>
        </div>
      )}

      {!loading && !error && films.length > 0 && (
        <div className="film-list">
          {films.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
