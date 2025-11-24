import React, { useState, useEffect } from "react";
import Header from "../../../shared/layout/Header/Header";
import Footer from "../../../shared/layout/Footer/Footer";
import "./Festival.css";
import { Link } from "react-router-dom";
import festivalService from "../../../services/festivals/festivalService";
import posterService from "../../../services/poster/posterService";

export default function Festival() {
  const [festivals, setFestivals] = useState([]);
  const [poster, setPoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    loadPoster();
    loadFestivals();
  }, [page]);

  const loadPoster = async () => {
    try {
      const response = await posterService.get();
      if (response.status === 200) {
        setPoster(response.data);
      }
    } catch (error) {
      console.error("Error loading poster:", error);
    }
  };

  const loadFestivals = async () => {
    setLoading(true);
    try {
      const response = await festivalService.getAll("", page, limit);
      if (response.status === 200) {
        setFestivals(response.data.items || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        console.error("Error loading festivals:", response.status);
        setFestivals([]);
      }
    } catch (error) {
      console.error("Error loading festivals:", error);
      setFestivals([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (startTime, endTime) => {
    if (!startTime || !endTime) return "";
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const startDate = start.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const startTimeStr = start.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endDate = end.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    
    if (startDate === endDate) {
      return `${startTimeStr} ${startDate}`;
    }
    return `${startTimeStr} ${startDate} - ${endDate}`;
  };

  const formatTimeShort = (startTime, endTime) => {
    if (!startTime || !endTime) return "";
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const startDate = start.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const startTimeStr = start.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    
    return `${startTimeStr} ${startDate}`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <section className="festival-section">
          <div className="container">
            <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
              Đang tải...
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <section className="festival-section">
        {/* Hiển thị Poster full width khít 2 bên lề */}
        {poster?.image_url && (
          <div className="festival-poster-container">
            <img
              src={poster.image_url}
              alt="Festival Poster"
              className="festival-poster"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        )}

        <div className="container">
          {festivals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
              Chưa có lễ hội nào
            </div>
          ) : (
            <>
              <div className="festival-list">
                {festivals.map((item) => {
                  return (
                    <React.Fragment key={item.id}>
                      <div className="reponsive-title">
                        <h3>{item.title}</h3>
                      </div>
                      <div className="festival-item">
                        <Link to={`/festival/${item.id}`}>
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title || "festival"}
                              onError={(e) => {
                                e.target.src = "/src/assets/1.jpg";
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "200px",
                                height: "200px",
                                background: "#222",
                                borderRadius: "6px",
                              }}
                            />
                          )}
                        </Link>
                        <div className="festival-item-body">
                          <p className="reponsive-item-time">
                            {formatTimeShort(item.start_time, item.end_time)}
                          </p>
                          <h3 className="festival-item-title">{item.title}</h3>
                          {item.content && (
                            <p className="festival-item-content">
                              {item.content}
                            </p>
                          )}
                        </div>
                        <div className="festival-item-meta">
                          <p className="festival-item-time">
                            {formatTimeShort(item.start_time, item.end_time)}
                          </p>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn-outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Quay lại
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Tiếp theo
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
