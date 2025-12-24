import { useState, useEffect } from "react";
import Header from "../../../shared/layout/Header/Header";
import Footer from "../../../shared/layout/Footer/Footer";
import { Link } from "react-router-dom";
import "./news.css";
import newsService from "../../../services/news/newsService";

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 8; 

  useEffect(() => {
    loadNews();
  }, [page]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const response = await newsService.getAll("", page, limit);
      if (response.status === 200) {
        setNews(response.data.items || []);
        setTotal(response.data.total || 0);
        setTotalPages(response.data.totalPages || 1);
      } else {
        console.error("Error loading news:", response.status);
        setNews([]);
      }
    } catch (error) {
      console.error("Error loading news:", error);
      setNews([]);
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
    });
  };

  // Lấy đoạn trích ngắn từ nội dung (bỏ thẻ HTML)
  const getExcerpt = (html = "", maxLen = 140) => {
    const text = html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "";
    return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
  };

  return (
    <>
      <Header />
      <section className="news-section">
        <div className="container">
          <h1 className="news-title">Tin tức</h1>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
              Đang tải...
            </div>
          ) : news.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
              Chưa có tin tức nào
            </div>
          ) : (
            <>
              <div className="news-grid">
                {news.map((item) => (
                  <Link
                    to={`/news/${item.id}`}
                    className="news-card"
                    key={item.id}
                  >
                    <div className="news-img">
                      {item.image ? (
                        <img src={item.image} alt={item.title} />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "#222",
                          }}
                        />
                      )}
                    </div>
                    <div className="news-container">
                      <p className="news-date">
                        {formatDate(item.createdAt || item.created_at)}
                      </p>
                      <h3 className="news-text">{item.title}</h3>
                      {item.content && (
                        <p className="news-excerpt">{getExcerpt(item.content)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className={`btn-outline back ${page === 1 ? "disabled" : ""}`}
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
