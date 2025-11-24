import React, { useState, useEffect } from "react";
import "./Home.css";
import Header from "../../../shared/layout/Header/Header.jsx";
import Footer from "../../../shared/layout/Footer/Footer.jsx";
import FilmList from "../components/FilmList/FilmList";
import Promo from "../components/Promotion/Promo";
import Event from "../components/Event/Event";
import Space from "../../../shared/layout/Space/Space";
import Banner from "../components/Banner/Banner";
import { useMovies } from "../hooks/useMovies";
import { events } from "../../../data/filmData";
import promotionService from "../../../services/promotions/promotionService";

export default function Home() {
  const { nowShowing, comingSoon, loading, error } = useMovies();
  const [promotions, setPromotions] = useState([]);
  const [promosLoading, setPromosLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setPromosLoading(true);
      const response = await promotionService.getAll();
      if (response.status === 200) {
        const data = response.data;
        const items = Array.isArray(data) ? data : (data.items || data.data || []);
        // Lọc chỉ lấy các khuyến mãi đang hoạt động, có ảnh và channelInApp = true
        const activePromotions = items
          .filter((promo) => 
            promo.active && 
            promo.status === 'ACTIVE' && 
            promo.image &&
            promo.channelInApp
          )
          .slice(0, 5); // Chỉ lấy 5 khuyến mãi đầu tiên
        setPromotions(activePromotions);
      }
    } catch (err) {
      console.error("Error loading promotions:", err);
      setPromotions([]);
    } finally {
      setPromosLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <Banner />
      <div className="content">
        <div className="left">
          <FilmList 
            title="Phim đang chiếu" 
            films={nowShowing} 
            loading={loading}
            error={error}
          />
          <Space />
          <FilmList 
            title="Phim sắp chiếu" 
            films={comingSoon} 
            loading={loading}
            error={error}
          />
        </div>
        <div className="right">
          <Promo promos={promotions} loading={promosLoading} />
          <Event events={events} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
