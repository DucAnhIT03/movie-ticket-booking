import React, { useState, useEffect } from "react";
import "./Banner.css";
import bannerService from "../../../../services/banners/bannerService";

export default function Banner() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const response = await bannerService.getAllNoPaging();
      if (response.status === 200) {
        const sliderBanners = (response.data || []).filter(
          (banner) => banner.position === "Home-Slider"
        );
        setBanners(sliderBanners);
        if (sliderBanners.length > 0) {
          setCurrentIndex(0);
        }
      }
    } catch (error) {
      console.error("Error loading banners:", error);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div
        className="banner loading-state"
      >
        <div className="loading-message">Đang tải...</div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const activeBanner = banners[currentIndex] || {};
  const desiredHeight = activeBanner.height || 640;
  const carouselStyle = {
    "--banner-height": `${desiredHeight}px`,
  };

  return (
    <div className="banner">
      {/* Carousel Banner */}
      {banners.length > 0 && (
        <div className="banner-carousel" style={carouselStyle}>
          {banners.length > 1 && (
            <button className="nav-btn left" onClick={goToPrevious}>
              {"\u276E"}
            </button>
          )}
          <div className="banner-slider">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`banner-slide ${
                  index === currentIndex ? "active" : ""
                }`}
              >
                <img src={banner.url} alt={`Banner ${index + 1}`} />
              </div>
            ))}
          </div>
          {banners.length > 1 && (
            <button className="nav-btn right" onClick={goToNext}>
              {"\u276F"}
            </button>
          )}
          {banners.length > 1 && (
            <div className="banner-dots">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`banner-dot ${index === currentIndex ? "active" : ""}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
