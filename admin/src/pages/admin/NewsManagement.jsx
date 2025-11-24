import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Settings, Search, Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
import NewsModal from "./NewsModal";
import newsService from "../../services/news/newsService";
import { sortByNewest } from "../../utils/sortUtils";

export default function NewsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [news, setNews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ✅ Load dữ liệu từ API
  const loadNews = async () => {
    setLoading(true);
    try {
      const response = await newsService.getAll(searchTerm, page, limit);
      if (response.status === 200) {
        setNews(sortByNewest(response.data.items || []));
        setTotal(response.data.total || 0);
        setTotalPages(response.data.totalPages || 0);
      } else {
        console.error("Error loading news:", response.status);
        alert("Có lỗi xảy ra khi tải danh sách tin tức");
      }
    } catch (error) {
      console.error("Error loading news:", error);
      alert("Có lỗi xảy ra khi tải danh sách tin tức");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, [page]);

  // Tìm kiếm với debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadNews();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ✅ Mở modal
  const handleOpenModal = (item) => {
    setSelectedNews(item);
    setIsModalOpen(true);
  };

  // ✅ Đóng modal
  const handleCloseModal = () => {
    setSelectedNews(null);
    setIsModalOpen(false);
  };

  // ✅ Lưu tin tức
  const handleSaveNews = async (data) => {
    setIsSaving(true);
    try {
      let response;
      // Backend không hỗ trợ displayPage, nên không gửi field này
      // Có thể lưu vào localStorage hoặc dùng cách khác để lưu trữ
      const payload = {
        title: data.title,
        content: data.content || null,
        image: data.image || null,
      };
      
      // Lưu displayPage vào localStorage để frontend có thể filter
      const displayPageValue = data.displayPage || data.display_page || "news";
      console.log("NewsManagement - Received data:", data);
      console.log("NewsManagement - Saving news with displayPage:", displayPageValue);
      
      if (data.id) {
        // Cập nhật
        response = await newsService.update(data.id, payload);
        // Lưu displayPage vào localStorage với key là news_id
        if (response.status === 200) {
          const newsId = response.data?.id || data.id;
          console.log(`NewsManagement - Saving displayPage to localStorage: news_${newsId}_displayPage = ${displayPageValue}`);
          localStorage.setItem(`news_${newsId}_displayPage`, displayPageValue);
          
          // Cũng lưu vào một map object để dễ sync
          const newsDisplayPageMap = JSON.parse(localStorage.getItem('newsDisplayPageMap') || '{}');
          newsDisplayPageMap[newsId] = displayPageValue;
          localStorage.setItem('newsDisplayPageMap', JSON.stringify(newsDisplayPageMap));
          
          console.log(`NewsManagement - Verified: localStorage.getItem('news_${newsId}_displayPage') =`, localStorage.getItem(`news_${newsId}_displayPage`));
          console.log(`NewsManagement - newsDisplayPageMap updated:`, newsDisplayPageMap);
        }
      } else {
        // Tạo mới
        response = await newsService.create(payload);
        // Lưu displayPage vào localStorage với key là news_id
        if (response.status === 200 || response.status === 201) {
          const newsId = response.data?.id;
          if (newsId) {
            console.log(`NewsManagement - Saving displayPage to localStorage: news_${newsId}_displayPage = ${displayPageValue}`);
            localStorage.setItem(`news_${newsId}_displayPage`, displayPageValue);
            
            // Cũng lưu vào một map object để dễ sync
            const newsDisplayPageMap = JSON.parse(localStorage.getItem('newsDisplayPageMap') || '{}');
            newsDisplayPageMap[newsId] = displayPageValue;
            localStorage.setItem('newsDisplayPageMap', JSON.stringify(newsDisplayPageMap));
            
            console.log(`NewsManagement - Verified: localStorage.getItem('news_${newsId}_displayPage') =`, localStorage.getItem(`news_${newsId}_displayPage`));
            console.log(`NewsManagement - newsDisplayPageMap updated:`, newsDisplayPageMap);
            
            // Hướng dẫn: Copy newsDisplayPageMap từ admin localStorage sang user localStorage
            console.log(`NewsManagement - IMPORTANT: Copy this to user localStorage:`, JSON.stringify(newsDisplayPageMap));
          } else {
            console.error("NewsManagement - No news ID returned from create response:", response.data);
          }
        }
      }

      if (response.status === 200 || response.status === 201) {
        handleCloseModal();
        if (page !== 1) {
          setPage(1);
        } else {
          loadNews(); // Reload danh sách
        }
      } else {
        const errorMsg = response.data?.message || "Có lỗi xảy ra khi lưu tin tức";
        alert(errorMsg);
      }
    } catch (error) {
      console.error("Error saving news:", error);
      alert("Có lỗi xảy ra khi lưu tin tức");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Xóa tin tức
  const handleDeleteNews = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa tin tức này?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await newsService.delete(id);
      if (response.status === 200) {
        loadNews(); // Reload danh sách
      } else {
        const errorMsg = response.data?.message || "Có lỗi xảy ra khi xóa tin tức";
        alert(errorMsg);
      }
    } catch (error) {
      console.error("Error deleting news:", error);
      alert("Có lỗi xảy ra khi xóa tin tức");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Format ngày tháng
  const formatDate = (dateString) => {
    if (dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "-";
  };

  // ✅ Làm sạch HTML để hiển thị text thuần
  const stripHtml = (html) => {
    if (!html) return "-";
    // Loại bỏ comment tags
    let text = html.replace(/<!--[\s\S]*?-->/g, '');
    // Loại bỏ HTML tags
    text = text.replace(/<[^>]*>/g, '');
    // Decode HTML entities
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    text = tempDiv.textContent || tempDiv.innerText || '';
    // Loại bỏ khoảng trắng thừa
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  };

  return (
    <div style={{ color: "#fff" }}>
      <h1
        style={{
          fontSize: "26px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Newspaper /> Quản Lý Tin Tức
      </h1>

      {/* Search */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "15px",
        }}
      >
        <div style={{ position: "relative" }}>
          <Search
            style={{
              position: "absolute",
              left: "10px",
              top: "8px",
              color: "#aaa",
            }}
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm tin tức..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "5px",
              padding: "8px 10px 8px 35px",
              width: "260px",
              outline: "none",
            }}
          />
        </div>

        <button
          onClick={() => handleOpenModal(null)}
          style={{
            background: "#e53935",
            color: "#fff",
            padding: "10px 18px",
            border: "none",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          <PlusCircle size={18} /> Thêm Tin Tức
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "20px", color: "#aaa" }}>
          Đang tải...
        </div>
      )}

      {/* Table */}
      {!loading && (
        <>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#1a1f29",
              color: "#fff",
            }}
          >
            <thead style={{ background: "#242b36" }}>
              <tr>
                <th style={{ padding: "10px", textAlign: "left" }}>Ảnh</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Tiêu đề</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Nội dung</th>
                <th style={{ padding: "10px", textAlign: "center" }}>Ngày tạo</th>
                <th style={{ padding: "10px", textAlign: "center" }}>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {news.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#888",
                    }}
                  >
                    Không có tin tức nào
                  </td>
                </tr>
              ) : (
                news.map((n) => (
                  <tr key={n.id} style={{ borderBottom: "1px solid #2a303d" }}>
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      {n.image ? (
                        <img
                          src={n.image}
                          alt={n.title}
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : null}
                      {!n.image && (
                        <div
                          style={{
                            width: "60px",
                            height: "60px",
                            background: "#242b36",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#888",
                            fontSize: "12px",
                          }}
                        >
                          No img
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px" }}>{n.title}</td>

                    <td style={{ padding: "10px", maxWidth: "300px", wordWrap: "break-word" }}>
                      {(() => {
                        const cleanContent = stripHtml(n.content);
                        return cleanContent && cleanContent.length > 100
                          ? cleanContent.substring(0, 100) + "..."
                          : cleanContent;
                      })()}
                    </td>

                    <td style={{ padding: "10px", textAlign: "center", fontSize: "12px", color: "#aaa" }}>
                      {formatDate(n.createdAt || n.created_at)}
                    </td>

                    <td style={{ padding: "10px", textAlign: "center" }}>
                      <button
                        onClick={() => handleOpenModal(n)}
                        style={{
                          background: "#1976d2",
                          border: "none",
                          borderRadius: "5px",
                          padding: "6px 10px",
                          marginRight: "6px",
                          cursor: "pointer",
                        }}
                      >
                        <Settings size={16} color="#fff" />
                      </button>

                      <button
                        onClick={() => handleDeleteNews(n.id)}
                        style={{
                          background: "#d32f2f",
                          border: "none",
                          borderRadius: "5px",
                          padding: "6px 10px",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={16} color="#fff" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "20px",
                padding: "15px",
                background: "#242b36",
                borderRadius: "6px",
              }}
            >
              <div style={{ color: "#aaa", fontSize: "14px" }}>
                Trang {page} / {totalPages} (Tổng: {total} tin tức)
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  style={{
                    background: page === 1 ? "#2a303d" : "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    padding: "8px 12px",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <ChevronLeft size={16} />
                  Trước
                </button>
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1 || loading}
                  style={{
                    background: "#242b36",
                    color: "#fff",
                    border: "1px solid #333",
                    borderRadius: "5px",
                    padding: "8px 12px",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  1
                </button>
                {page > 1 && (
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={loading}
                    style={{
                      background: "#242b36",
                      color: "#fff",
                      border: "1px solid #333",
                      borderRadius: "5px",
                      padding: "8px 12px",
                      cursor: "pointer",
                    }}
                  >
                    {page - 1}
                  </button>
                )}
                {page > 1 && page < totalPages && (
                  <button
                    disabled
                    style={{
                      background: "#1976d2",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      padding: "8px 12px",
                      cursor: "default",
                    }}
                  >
                    {page}
                  </button>
                )}
                {page < totalPages && (
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loading}
                    style={{
                      background: "#242b36",
                      color: "#fff",
                      border: "1px solid #333",
                      borderRadius: "5px",
                      padding: "8px 12px",
                      cursor: "pointer",
                    }}
                  >
                    {page + 1}
                  </button>
                )}
                {totalPages > 1 && (
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages || loading}
                    style={{
                      background: "#242b36",
                      color: "#fff",
                      border: "1px solid #333",
                      borderRadius: "5px",
                      padding: "8px 12px",
                      cursor: page === totalPages ? "not-allowed" : "pointer",
                    }}
                  >
                    {totalPages}
                  </button>
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  style={{
                    background: page === totalPages ? "#2a303d" : "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    padding: "8px 12px",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  Sau
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal thêm/sửa */}
      {isModalOpen && (
        <NewsModal
          title={selectedNews ? "Sửa Tin Tức" : "Thêm Tin Tức"}
          onClose={handleCloseModal}
          onSave={handleSaveNews}
          initialData={selectedNews}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
