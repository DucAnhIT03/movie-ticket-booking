import React, { useState, useEffect } from "react";
import { FaTimes, FaFilter } from "react-icons/fa";
import genreService from "../../../../services/genres/genreService";
import theaterService from "../../../../services/theaters/theaterService";
import "./FilterModal.css";

export default function FilterModal({ isOpen, onClose, onApplyFilter, currentFilters }) {
  const [genres, setGenres] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(currentFilters?.genreId || "");
  const [selectedTheater, setSelectedTheater] = useState(currentFilters?.theaterId || "");

  useEffect(() => {
    if (isOpen) {
      loadGenres();
      loadTheaters();
      // Khôi phục giá trị đã chọn
      setSelectedGenre(currentFilters?.genreId || "");
      setSelectedTheater(currentFilters?.theaterId || "");
    }
  }, [isOpen, currentFilters]);

  const loadGenres = async () => {
    try {
      setLoading(true);
      const response = await genreService.getAll({ page: 1, limit: 100 });
      if (response.status === 200) {
        const data = response.data || {};
        const items = Array.isArray(data) ? data : (data.items || []);
        setGenres(items);
      }
    } catch (error) {
      console.error("Error loading genres:", error);
      setGenres([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTheaters = async () => {
    try {
      const response = await theaterService.getAll();
      if (response.status === 200) {
        const data = response.data || {};
        const items = Array.isArray(data) ? data : (data.items || data.data || []);
        setTheaters(items);
      }
    } catch (error) {
      console.error("Error loading theaters:", error);
      setTheaters([]);
    }
  };

  const handleApply = () => {
    onApplyFilter({
      genreId: selectedGenre || undefined,
      theaterId: selectedTheater || undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedGenre("");
    setSelectedTheater("");
    onApplyFilter({
      genreId: undefined,
      theaterId: undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="filter-modal-overlay" onClick={onClose}>
      <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="filter-modal-header">
          <div className="filter-modal-title">
            <FaFilter size={20} />
            <h3>Lọc phim</h3>
          </div>
          <button className="filter-modal-close" onClick={onClose}>
            <FaTimes size={20} />
          </button>
        </div>

        <div className="filter-modal-body">
          <div className="filter-group">
            <label htmlFor="genre-filter">Thể loại phim</label>
            <select
              id="genre-filter"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả thể loại</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.genreName || genre.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="theater-filter">Rạp chiếu</label>
            <select
              id="theater-filter"
              value={selectedTheater}
              onChange={(e) => setSelectedTheater(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả rạp</option>
              {theaters.map((theater) => (
                <option key={theater.id} value={theater.id}>
                  {theater.name}
                  {theater.location ? ` - ${theater.location}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-modal-footer">
          <button className="filter-btn-reset" onClick={handleReset}>
            Xóa bộ lọc
          </button>
          <button className="filter-btn-apply" onClick={handleApply}>
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}

