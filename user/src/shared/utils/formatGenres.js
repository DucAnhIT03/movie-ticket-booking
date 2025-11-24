/**
 * Format thể loại phim - xử lý nhiều trường hợp
 * @param {any} genres - Dữ liệu genres từ API (có thể là array, object, string, null)
 * @returns {string} - Tên thể loại đầu tiên hoặc chuỗi rỗng
 */
export function formatGenres(genres) {
  // Nếu genres là null, undefined, hoặc empty
  if (!genres) {
    return "";
  }
  
  // Nếu genres là một object đơn (không phải array)
  if (typeof genres === "object" && !Array.isArray(genres)) {
    return genres.name || genres.genreName || genres.title || "";
  }
  
  // Nếu genres là array
  if (Array.isArray(genres)) {
    if (genres.length === 0) {
      return "";
    }
    
    // Lấy phần tử đầu tiên
    const firstGenre = genres[0];
    
    // Nếu phần tử đầu tiên là object
    if (firstGenre && typeof firstGenre === "object") {
      // Xử lý các trường hợp: { name: "..." }, { genre: { name: "..." } }, { genre: "..." }
      const genreName = firstGenre.name || 
                       firstGenre.genreName || 
                       firstGenre.title ||
                       (firstGenre.genre && typeof firstGenre.genre === 'object' ? firstGenre.genre.name : null) ||
                       (firstGenre.genre && typeof firstGenre.genre === 'object' ? firstGenre.genre.genreName : null) ||
                       (firstGenre.genre && typeof firstGenre.genre === 'string' ? firstGenre.genre : null) ||
                       "";
      
      if (genreName) {
        return genreName;
      }
      
      // Nếu không tìm thấy, thử map tất cả và lấy cái đầu tiên
      const genreNames = genres
        .map((g) => {
          if (typeof g === 'string') return g;
          if (g && typeof g === 'object') {
            return g.name || g.genreName || g.title || 
                   (g.genre && typeof g.genre === 'object' ? g.genre.name : null) ||
                   (g.genre && typeof g.genre === 'object' ? g.genre.genreName : null) ||
                   (g.genre && typeof g.genre === 'string' ? g.genre : null);
          }
          return null;
        })
        .filter(Boolean);
      return genreNames.length > 0 ? genreNames[0] : "";
    }
    
    // Nếu phần tử đầu tiên là string
    if (typeof firstGenre === "string") {
      return firstGenre || "";
    }
  }
  
  // Nếu genres là string
  if (typeof genres === "string") {
    return genres;
  }
  
  return "";
}

/**
 * Lấy genres từ movie object - kiểm tra nhiều nguồn
 * @param {Object} movie - Movie object từ API
 * @returns {any} - Dữ liệu genres để format
 */
export function getGenresData(movie) {
  // Kiểm tra genres từ nhiều nguồn có thể
  // Ưu tiên: genres (array string), movieGenres (array object với genre), genre (object đơn)
  if (movie.genres && Array.isArray(movie.genres)) {
    return movie.genres;
  } else if (movie.movieGenres && Array.isArray(movie.movieGenres) && movie.movieGenres.length > 0) {
    // Xử lý movieGenres: [{ genre: { name: "..." } }] hoặc [{ genre: "..." }]
    return movie.movieGenres.map(mg => {
      if (mg.genre) {
        return typeof mg.genre === 'object' ? mg.genre : { name: mg.genre };
      }
      return mg;
    });
  } else if (movie.genre) {
    return movie.genre;
  } else if (movie.genreIds && Array.isArray(movie.genreIds)) {
    return movie.genreIds;
  }
  
  return null;
}

