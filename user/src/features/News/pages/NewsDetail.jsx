import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../../../shared/layout/Header/Header";
import Footer from "../../../shared/layout/Footer/Footer";
import "./news_detail.css";
import newsService from "../../../services/news/newsService";

export default function NewsDetail() {
  const { id } = useParams();
  const [newsItem, setNewsItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNewsDetail();
  }, [id]);

  const loadNewsDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await newsService.getById(id);
      if (response.status === 200) {
        setNewsItem(response.data);
      } else if (response.status === 404) {
        setError("Bài viết không tồn tại");
      } else {
        setError("Có lỗi xảy ra khi tải bài viết");
      }
    } catch (error) {
      console.error("Error loading news detail:", error);
      setError("Có lỗi xảy ra khi tải bài viết");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
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
        <div className="news-detail-container">
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            Đang tải...
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !newsItem) {
    return (
      <>
        <Header />
        <div className="news-detail-container">
          <h2>{error || "Bài viết không tồn tại"}</h2>
          <Link to="/news" className="btn-outline">
            Quay lại Tin tức
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <section className="news-detail">
        <div className="container">
          <div className="news-content">
            <h3>{newsItem.title}</h3>
            <p className="news-date" style={{ color: "#999", fontSize: "14px", marginBottom: "20px" }}>
              {formatDate(newsItem.createdAt || newsItem.created_at)}
            </p>
            {newsItem.content && (
              <div
                style={{
                  lineHeight: "1.8",
                  fontSize: "16px",
                  color: "#ddd",
                }}
                dangerouslySetInnerHTML={{
                  __html: newsItem.content.replace(/<!--DISPLAY_PAGE:[^>]*-->/g, ''),
                }}
              />
            )}
          </div>

          {newsItem.image && (
            <div className="news-detail-img">
              <img src={newsItem.image} alt={newsItem.title} />
            </div>
          )}

          <div className="news-detail-actions">
            <Link to="/news" className="btn-outline">
              Quay lại
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
