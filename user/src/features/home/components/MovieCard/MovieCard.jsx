import React from "react";
import { Link } from "react-router-dom";
import "./MovieCard.css";
import { formatGenres as formatGenresUtil, getGenresData as getGenresDataUtil } from "../../../../shared/utils/formatGenres";

/**
 * Component hiển thị một thẻ phim
 * @param {Object} movie - Thông tin phim từ API
 * @param {number} movie.id - ID phim
 * @param {string} movie.title - Tên phim
 * @param {string} movie.image - URL poster phim
 * @param {Date|string} movie.release_date - Ngày công chiếu
 * @param {Array} movie.genres - Danh sách thể loại (nếu có)
 */
export default function MovieCard({ movie }) {
 
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

  
  const formatGenres = (genres) => {
    
    if (!genres) {
      return "";
    }
  
    if (typeof genres === "object" && !Array.isArray(genres)) {
      return genres.name || genres.genreName || genres.title || "";
    }
  
    if (Array.isArray(genres)) {
      if (genres.length === 0) {
        return "";
      }
    
      const firstGenre = genres[0];
      
      if (firstGenre && typeof firstGenre === "object") {
     
        const genreName = firstGenre.name || 
                         firstGenre.genreName || 
                         firstGenre.title ||
                         (firstGenre.genre && typeof firstGenre.genre === 'object' ? firstGenre.genre.name : null) ||
                         (firstGenre.genre && typeof firstGenre.genre === 'string' ? firstGenre.genre : null) ||
                         "";
        
        if (genreName) {
          return genreName;
        }
       
        const genreNames = genres
          .map((g) => {
            if (typeof g === 'string') return g;
            if (g && typeof g === 'object') {
              return g.name || g.genreName || g.title || 
                     (g.genre && typeof g.genre === 'object' ? g.genre.name : null) ||
                     (g.genre && typeof g.genre === 'string' ? g.genre : null);
            }
            return null;
          })
          .filter(Boolean);
        return genreNames.length > 0 ? genreNames[0] : "";
      }
      
      if (typeof firstGenre === "string") {
        return firstGenre || "";
      }
    }
  
    if (typeof genres === "string") {
      return genres;
    }
    
    return "";
  };

  const posterUrl = movie.image || movie.poster || "/logo.png";
  const releaseDate = formatDate(movie);

  let genresData = null;
  
  if (movie.genres && Array.isArray(movie.genres)) {
    genresData = movie.genres;
  } else if (movie.movieGenres && Array.isArray(movie.movieGenres) && movie.movieGenres.length > 0) {
    
    genresData = movie.movieGenres.map(mg => {
      if (mg.genre) {
        return typeof mg.genre === 'object' ? mg.genre : { name: mg.genre };
      }
      return mg;
    });
  } else if (movie.genre) {
    genresData = movie.genre;
  } else if (movie.genreIds && Array.isArray(movie.genreIds)) {
    genresData = movie.genreIds;
  }
  
  const genres = formatGenres(genresData);
  
  if (movie.id && !genres && Math.random() < 0.1) {
    console.log("Movie genres debug (sample):", {
      id: movie.id,
      title: movie.title,
      genres: movie.genres,
      genre: movie.genre,
      genreIds: movie.genreIds,
      movieGenres: movie.movieGenres,
      allKeys: Object.keys(movie),
    });
  }

  return (
    <Link
      to={`/movie-detail/${movie.id}`}
      className="movie-card"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <img 
        src={posterUrl} 
        alt={movie.title || "Movie poster"} 
        onError={(e) => {
          e.target.src = "/logo.png";
        }} 
      />
      <div className="movie-info-container">
        {(genres || releaseDate) && (
          <div className="movie-des">
            {genres && <p className="movie-genre">{genres}</p>}
            {releaseDate && <p className="movie-date">{releaseDate}</p>}
          </div>
        )}
        <h4 className="movie-title">{movie.title || "Chưa có tên"}</h4>
      </div>
    </Link>
  );
}

