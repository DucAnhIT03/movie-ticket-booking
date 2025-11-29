import React, { useState, useEffect, useMemo } from "react";
import { FaFilter } from "react-icons/fa";
import "./Home.css";
import Header from "../../../shared/layout/Header/Header.jsx";
import Footer from "../../../shared/layout/Footer/Footer.jsx";
import FilmList from "../components/FilmList/FilmList";
import Promo from "../components/Promotion/Promo";
import Event from "../components/Event/Event";
import Space from "../../../shared/layout/Space/Space";
import Banner from "../components/Banner/Banner";
import FilterModal from "../components/FilterModal/FilterModal";
import { useMovies } from "../hooks/useMovies";
import { events as mockEvents } from "../../../data/filmData";
import promotionService from "../../../services/promotions/promotionService";
import eventService from "../../../services/events/eventService";
import movieService from "../../../services/movies/movieService";
import showtimeService from "../../../services/showtimes/showtimeService";

export default function Home() {
  const { nowShowing: allNowShowing, comingSoon: allComingSoon, loading, error } = useMovies();
  const [promotions, setPromotions] = useState([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [homeEvents, setHomeEvents] = useState(mockEvents.slice(0, 3));
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    genreId: undefined,
    theaterId: undefined,
  });
  const [filteredMovies, setFilteredMovies] = useState({
    nowShowing: [],
    comingSoon: [],
  });
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    loadPromotions();
    loadEvents();
  }, []);

  // Lọc phim khi filters thay đổi
  useEffect(() => {
    if (filters.genreId || filters.theaterId) {
      loadFilteredMovies();
    } else {
      // Nếu không có filter, dùng danh sách gốc
      setFilteredMovies({
        nowShowing: allNowShowing,
        comingSoon: allComingSoon,
      });
    }
  }, [filters, allNowShowing, allComingSoon]);

  const loadFilteredMovies = async () => {
    setFilterLoading(true);
    try {
      // Lấy tất cả phim với filter
      const params = {
        page: 1,
        limit: 100,
      };
      if (filters.genreId) {
        params.genreId = filters.genreId;
      }

      const response = await movieService.getAllMovies(params);
      if (response.status === 200) {
        const data = response.data || {};
        const allMovies = Array.isArray(data) ? data : (data.items || data.data || []);
        
        let filtered = allMovies;

        // Nếu có filter theo rạp, cần kiểm tra showtimes
        if (filters.theaterId) {
          const moviesWithTheater = [];
          for (const movie of allMovies) {
            try {
              // Lấy showtimes của phim
              const showtimeRes = await showtimeService.getByMovie(movie.id);
              if (showtimeRes.status === 200) {
                const showtimes = Array.isArray(showtimeRes.data) 
                  ? showtimeRes.data 
                  : (showtimeRes.data?.items || showtimeRes.data?.data || []);
                
                // Kiểm tra xem có showtime nào thuộc rạp được chọn không
                const hasTheater = showtimes.some((st) => {
                  const theater = st?.screen?.theater || st?.screen?.Theater || st?.theater;
                  const theaterId = theater?.id || theater?.theaterId || st?.screen?.theaterId || st?.screen?.theater_id;
                  return String(theaterId) === String(filters.theaterId);
                });

                if (hasTheater) {
                  moviesWithTheater.push(movie);
                }
              }
            } catch (err) {
              console.error(`Error checking theater for movie ${movie.id}:`, err);
            }
          }
          filtered = moviesWithTheater;
        }

        // Phân loại phim đang chiếu và sắp chiếu
        const now = new Date();
        const nowShowingFiltered = filtered.filter((movie) => {
          if (!movie.releaseDate) return false;
          const releaseDate = new Date(movie.releaseDate);
          return releaseDate <= now;
        });
        const comingSoonFiltered = filtered.filter((movie) => {
          if (!movie.releaseDate) return false;
          const releaseDate = new Date(movie.releaseDate);
          return releaseDate > now;
        });

        setFilteredMovies({
          nowShowing: nowShowingFiltered,
          comingSoon: comingSoonFiltered,
        });
      } else {
        setFilteredMovies({
          nowShowing: [],
          comingSoon: [],
        });
      }
    } catch (err) {
      console.error("Error loading filtered movies:", err);
      setFilteredMovies({
        nowShowing: [],
        comingSoon: [],
      });
    } finally {
      setFilterLoading(false);
    }
  };

  const handleApplyFilter = (newFilters) => {
    setFilters(newFilters);
  };

  // Xác định danh sách phim hiển thị
  const nowShowing = useMemo(() => {
    return filters.genreId || filters.theaterId ? filteredMovies.nowShowing : allNowShowing;
  }, [filters, filteredMovies.nowShowing, allNowShowing]);

  const comingSoon = useMemo(() => {
    return filters.genreId || filters.theaterId ? filteredMovies.comingSoon : allComingSoon;
  }, [filters, filteredMovies.comingSoon, allComingSoon]);

  const isLoading = loading || filterLoading;

  const loadPromotions = async () => {
    try {
      setPromosLoading(true);
      const response = await promotionService.getAll();
      if (response.status === 200) {
        const data = response.data;
        const items = Array.isArray(data) ? data : (data.items || data.data || []);
        
        const activePromotions = items
          .filter((promo) => 
            promo.active && 
            promo.status === 'ACTIVE' && 
            promo.image &&
            promo.channelInApp
          )
          .slice(0, 5); 
        setPromotions(activePromotions);
      }
    } catch (err) {
      console.error("Error loading promotions:", err);
      setPromotions([]);
    } finally {
      setPromosLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      // Lấy cả sự kiện đang diễn ra và sắp diễn ra
      const [ongoingResponse, upcomingResponse] = await Promise.all([
        eventService.getAll({ page: 1, limit: 3, status: "ONGOING" }),
        eventService.getAll({ page: 1, limit: 3, status: "UPCOMING" }),
      ]);

      let allEvents = [];

      // Xử lý sự kiện đang diễn ra
      if (ongoingResponse.status === 200) {
        const ongoingItems = Array.isArray(ongoingResponse.data?.items)
          ? ongoingResponse.data.items
          : ongoingResponse.data?.data || [];
        allEvents = [...allEvents, ...ongoingItems];
      }

      // Xử lý sự kiện sắp diễn ra
      if (upcomingResponse.status === 200) {
        const upcomingItems = Array.isArray(upcomingResponse.data?.items)
          ? upcomingResponse.data.items
          : upcomingResponse.data?.data || [];
        allEvents = [...allEvents, ...upcomingItems];
      }

      // Nếu không có sự kiện ONGOING hoặc UPCOMING, thử lấy tất cả
      if (allEvents.length === 0) {
        const allResponse = await eventService.getAll({ page: 1, limit: 6 });
        if (allResponse.status === 200) {
          const allItems = Array.isArray(allResponse.data?.items)
            ? allResponse.data.items
            : allResponse.data?.data || [];
          allEvents = allItems;
        }
      }

      // Chuẩn hóa dữ liệu
      const normalized = allEvents
        .map((evt) => ({
          id: evt.id,
          img: evt.image || evt.img || "/event.jpg",
          title: evt.title || "Sự kiện điện ảnh",
        }))
        .filter((evt) => evt.title && evt.img)
        .slice(0, 3);

      if (normalized.length > 0) {
        setHomeEvents(normalized);
      } else {
        // Fallback về mock data nếu không có sự kiện nào
        setHomeEvents(mockEvents.slice(0, 3));
      }
    } catch (err) {
      console.error("Error loading events:", err);
      // Fallback về mock data khi có lỗi
      setHomeEvents(mockEvents.slice(0, 3));
    }
  };

  const hasActiveFilter = filters.genreId || filters.theaterId;

  return (
    <div>
      <Header />
      <Banner />
      <div className="content">
        <div className="left">
          <div className="home-filter-section">
            <button
              className={`filter-button ${hasActiveFilter ? "has-filter" : ""}`}
              onClick={() => setShowFilterModal(true)}
            >
              <FaFilter size={18} />
              Lọc phim
            </button>
            {hasActiveFilter && (
              <span className="filter-indicator">
                Đang áp dụng bộ lọc
              </span>
            )}
          </div>
          <FilmList 
            title="Phim đang chiếu" 
            films={nowShowing} 
            loading={isLoading}
            error={error}
          />
          <Space />
          <FilmList 
            title="Phim sắp chiếu" 
            films={comingSoon} 
            loading={isLoading}
            error={error}
          />
        </div>
        <div className="right">
          <Promo promos={promotions} loading={promosLoading} />
          <Event events={homeEvents} />
        </div>
      </div>
      <Footer />
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilter={handleApplyFilter}
        currentFilters={filters}
      />
    </div>
  );
}
