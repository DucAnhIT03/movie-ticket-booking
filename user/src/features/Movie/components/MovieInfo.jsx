import React, { useState } from "react";
import "./movie_info.css";
import { formatGenres, getGenresData } from "../../../shared/utils/formatGenres";
import MovieDetailModal from "./MovieDetailModal";

export default function MovieInfo({ movie }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!movie) return null;

  const formatDate = (movie) => {
    let dateString = movie.startDate || movie.start_date || movie.releaseDate || movie.release_date;
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const genresData = getGenresData(movie);
  const genre = formatGenres(genresData);
  const releaseDate = formatDate(movie);
  const posterUrl = movie.image || movie.poster || "/logo.png";
  const movieType = movie.type || "2D";
  
  const movieRating = movie.rating || movie.type || "T13";
  const duration = movie.duration ? `${movie.duration} phút` : "";
  const country = movie.country || "";
  const author = movie.author || "";
  const descriptions = movie.descriptions || movie.description || "";
  const ratingWarning = movie.ratingWarning || movie.rating_warning || "PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI XEM TỪ ĐỦ 13 TUỔI TRỞ LÊN (13+)";


  const metaParts = [];
  if (genre) metaParts.push(genre);
  if (country) metaParts.push(country);
  if (duration) metaParts.push(duration);
  
  const metaContent = metaParts.length > 0 ? (
    <>
      {metaParts.map((part, index) => (
        <React.Fragment key={index}>
          {part}
          {index < metaParts.length - 1 && <> &nbsp; | &nbsp; </>}
        </React.Fragment>
      ))}
    </>
  ) : null;

  const backgroundImage = movie.image || movie.poster || "/logo.png";

  return (
    <section 
      className="hero"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="overlay"></div>
      <div className="hero-content">
        <div className="main-content">
          <div className="top-row">
            <img
              src={posterUrl}
              alt={movie.title || "Movie poster"}
              onError={(e) => {
                e.target.src = "/logo.png";
              }}
            />
            <div className="top-side">
              <h1>
                {movie.title || "Chưa có tên"} - {movieRating} <span className="tag">{movieType}</span>
              </h1>
              <p>{metaContent}</p>
            </div>
          </div>
        </div>

        <div className="movie-infor">
          <h1>
            {movie.title || "Chưa có tên"} - {movieRating} <span className="tag">{movieType}</span>
          </h1>
          <p className="meta">
            {metaContent}
            {author && <> &nbsp;&nbsp;&nbsp; Đạo diễn: <strong>{author}</strong></>}
          </p>
          {descriptions && (
            <p className="desc">{descriptions}</p>
          )}
          {releaseDate && <p>Khởi chiếu: {releaseDate}</p>}
          <p className="rating">
            <span className="highlight">
              Kiểm duyệt: {movieRating} - {ratingWarning}
            </span>
          </p>
          <div className="actions">
            <button 
              className="button btn-outline"
              onClick={() => setIsModalOpen(true)}
            >
              Chi tiết nội dung
            </button>
            <button 
              className="button btn-yellow"
              onClick={() => {
                const trailerUrl = movie.trailer || movie.trailerUrl || movie.trailerLink;
                if (trailerUrl) {
                  window.open(trailerUrl, '_blank');
                } else {
                  alert('Phim này chưa có trailer');
                }
              }}
            >
              Xem trailer
            </button>
          </div>
        </div>
      </div>
      <MovieDetailModal 
        movie={movie} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </section>
  );
}
