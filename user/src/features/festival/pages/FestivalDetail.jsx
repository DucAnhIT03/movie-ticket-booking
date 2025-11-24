import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../../../shared/layout/Header/Header";
import Footer from "../../../shared/layout/Footer/Footer";
import "./FestivalDetail.css";
import festivalService from "../../../services/festivals/festivalService";
import newsService from "../../../services/news/newsService";

export default function FestivalDetail() {
  const { id } = useParams();
  const [festival, setFestival] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFestivalDetail();
    loadRelatedNews();
  }, [id]);

  const loadFestivalDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await festivalService.getById(id);
      if (response.status === 200) {
        setFestival(response.data);
      } else if (response.status === 404) {
        setError("Lễ hội không tồn tại");
      } else {
        setError("Có lỗi xảy ra khi tải thông tin lễ hội");
      }
    } catch (error) {
      console.error("Error loading festival detail:", error);
      setError("Có lỗi xảy ra khi tải thông tin lễ hội");
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedNews = async () => {
    try {
      // Lấy tin tức liên quan đến festival này
      const response = await newsService.getAll("", 1, 5);
      if (response.status === 200) {
        // Lọc tin tức có festivalId trùng với id hiện tại
        const filtered = (response.data.items || []).filter(
          (news) => news.festivalId === Number(id)
        );
        setRelatedNews(filtered);
      }
    } catch (error) {
      console.error("Error loading related news:", error);
    }
  };

  const formatDateRange = (startTime, endTime) => {
    if (!startTime || !endTime) return "";
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const startDate = start.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const endDate = end.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    
    if (startDate === endDate) {
      return startDate;
    }
    return `${startDate} - ${endDate}`;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "";
    const date = new Date(dateTime);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="festival-detail">
          <div className="container">
            <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
              Đang tải...
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !festival) {
    return (
      <>
        <Header />
        <main className="festival-detail">
          <div className="container">
            <h2>{error || "Lễ hội không tồn tại"}</h2>
            <Link to="/festival" style={{ color: "#e63946", textDecoration: "none" }}>
              Quay lại Liên hoan phim
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="festival-detail">
        {festival.image && (
          <section className="gallery container" style={{ marginTop: "20px" }}>
            <img
              src={festival.image}
              alt={festival.title}
              style={{
                width: "100%",
                maxWidth: "100%",
                height: "auto",
                borderRadius: "6px",
              }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </section>
        )}

        <section className="content container">
          <div className="text-content">
            <h1>{festival.title}</h1>

            <p className="lead" style={{ color: "#d7d7d7", fontSize: "16px", marginBottom: "20px" }}>
              <strong>Thời gian diễn ra:</strong> {formatDateRange(festival.start_time, festival.end_time)}
            </p>

            <p style={{ color: "#cfcfcf", marginBottom: "16px" }}>
              <strong>Bắt đầu:</strong> {formatDateTime(festival.start_time)}
            </p>

            <p style={{ color: "#cfcfcf", marginBottom: "20px" }}>
              <strong>Kết thúc:</strong> {formatDateTime(festival.end_time)}
            </p>

            {festival.content && (
              <div
                style={{
                  marginTop: "30px",
                  marginBottom: "30px",
                  lineHeight: "1.8",
                  fontSize: "16px",
                  color: "#ddd",
                  whiteSpace: "pre-wrap",
                }}
              >
                {festival.content}
              </div>
            )}

            {relatedNews.length > 0 && (
              <div style={{ marginTop: "30px" }}>
                <h2 style={{ fontSize: "20px", marginBottom: "15px" }}>Tin tức liên quan</h2>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {relatedNews.map((news) => (
                    <li key={news.id} style={{ marginBottom: "15px" }}>
                      <Link
                        to={`/news/${news.id}`}
                        style={{
                          color: "#e63946",
                          textDecoration: "none",
                          fontSize: "16px",
                        }}
                      >
                        {news.title}
                      </Link>
                      {news.createdAt && (
                        <p style={{ color: "#999", fontSize: "13px", marginTop: "5px" }}>
                          {new Date(news.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ marginTop: "40px" }}>
              <Link
                to="/festival"
                style={{
                  color: "#e63946",
                  textDecoration: "none",
                  fontSize: "15px",
                  border: "1px solid #e63946",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  display: "inline-block",
                }}
              >
                Quay lại Liên hoan phim
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
