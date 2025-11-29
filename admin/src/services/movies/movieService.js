import axiosClient from "../axiosClient";

const movieService = {

  getAllMovies(params = {}) {
    return axiosClient.get("/movies", {
      params: {
        page: params.page || 1,
        limit: params.limit || 100, 
        search: params.search || undefined,
        genreId: params.genreId || undefined,
      },
      validateStatus: () => true,
    });
  },

  
  getMovieById(id) {
    return axiosClient.get(`/movies/${id}`, {
      validateStatus: () => true,
    });
  },

  
  createMovie(data) {
    const formData = new FormData();
    
    
    Object.keys(data).forEach(key => {
      if (key !== 'file' && key !== 'genreIds') {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      }
    });

    if (data.file) {
      formData.append('file', data.file);
    }

    return axiosClient.post("/movies", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      validateStatus: () => true,
    });
  },

  
  updateMovie(id, data) {
    const formData = new FormData();
    
   
    Object.keys(data).forEach(key => {
      if (key !== 'file' && key !== 'genreIds') {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      }
    });

    
    if (data.file) {
      formData.append('file', data.file);
    }

    return axiosClient.put(`/movies/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      validateStatus: () => true,
    });
  },

  
  deleteMovie(id) {
    return axiosClient.delete(`/movies/${id}`, {
      validateStatus: () => true,
    });
  },

  
  getMovieGenres(movieId) {
    return axiosClient.get(`/movies/${movieId}/genres`, {
      validateStatus: () => true,
    });
  },

  
  setMovieGenres(movieId, genreIds) {
    return axiosClient.put(`/movies/${movieId}/genres`, { genreIds }, {
      validateStatus: () => true,
    });
  },

  
  addMovieGenre(movieId, genreId) {
    return axiosClient.post(`/movies/${movieId}/genres`, { genreId }, {
      validateStatus: () => true,
    });
  },

  
  removeMovieGenre(movieId, genreId) {
    return axiosClient.delete(`/movies/${movieId}/genres/${genreId}`, {
      validateStatus: () => true,
    });
  },
};

export default movieService;

