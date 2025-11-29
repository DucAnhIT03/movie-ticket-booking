import { useState, useEffect } from "react";
import movieService from "../../../services/movies/movieService";

/**
 * Custom hook để fetch danh sách phim đang chiếu và sắp chiếu
 * @returns {Object} { nowShowing, comingSoon, loading, error }
 */
export function useMovies() {
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        const [nowShowingResponse, comingSoonResponse] = await Promise.all([
          movieService.getNowShowing(),
          movieService.getComingSoon(),
        ]);

        if (nowShowingResponse.status === 200) {
          const movies = nowShowingResponse.data || [];
          console.log("Now showing movies:", movies);
          setNowShowing(movies);
        } else {
          console.error("Error fetching now showing:", nowShowingResponse);
          setNowShowing([]);
        }

        if (comingSoonResponse.status === 200) {
          const movies = comingSoonResponse.data || [];
          console.log("Coming soon movies:", movies);
          setComingSoon(movies);
        } else {
          console.error("Error fetching coming soon:", comingSoonResponse);
          setComingSoon([]);
        }
      } catch (err) {
        console.error("Error fetching movies:", err);
        setError(err.message || "Có lỗi xảy ra khi tải danh sách phim");
        setNowShowing([]);
        setComingSoon([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  return { nowShowing, comingSoon, loading, error };
}

