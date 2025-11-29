import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./ticket_price.css";
import Header from "../../../shared/layout/Header/Header";
import Footer from "../../../shared/layout/Footer/Footer";
import newsService from "../../../services/news/newsService";
import ticketPriceService from "../../../services/ticket-prices/ticketPriceService";

const TicketPrice = () => {
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null); 
  const [allNewsData, setAllNewsData] = useState([]); 
  const [ticketPrices, setTicketPrices] = useState([]); 
  const [loadingPrices, setLoadingPrices] = useState(true);

  useEffect(() => {
    loadNews();
    loadTicketPrices();
    
    // Tự động refresh mỗi 30 giây để cập nhật tin tức mới
    const interval = setInterval(() => {
      console.log("🔄 TicketPrice - Auto refresh để kiểm tra tin tức mới...");
      loadNews();
      loadTicketPrices();
    }, 30000); // 30 giây
    
    return () => clearInterval(interval);
  }, []);

  
  const loadTicketPrices = async () => {
    setLoadingPrices(true);
    try {
      console.log("🔄 TicketPrice - Đang tải giá vé từ API...");
      const response = await ticketPriceService.getAllTicketPrices({ page: 1, limit: 1000 });
      console.log("📥 TicketPrice - API Response:", response);
      
      if (response.status === 200) {
        const data = response.data;
        const items = data.items || data.data || data || [];
        console.log("✅ TicketPrice - Loaded ticket prices:", items.length, "items");
        console.log("✅ TicketPrice - Sample data:", items.slice(0, 3));
     
        const processedItems = items.map(item => ({
          id: item.id,
          typeSeat: item.typeSeat || item.type_seat,
          typeMovie: item.typeMovie || item.type_movie,
          price: item.price,
          dayType: item.dayType !== undefined ? item.dayType : item.day_type,
          startTime: item.startTime || item.start_time,
          endTime: item.endTime || item.end_time,
          startDate: item.startDate || item.start_date || null,
          endDate: item.endDate || item.end_date || null,
          movieId: item.movieId || item.movie_id || null,
          theaterId: item.theaterId || item.theater_id || null,
        }));
        
        setTicketPrices(processedItems);
        console.log("✅ TicketPrice - Processed ticket prices:", processedItems.length);
      } else {
        console.error("❌ TicketPrice - Error response status:", response.status, response.data);
      }
    } catch (error) {
      console.error("❌ TicketPrice - Error loading ticket prices:", error);
      if (error.response) {
        console.error("❌ TicketPrice - Error response data:", error.response.data);
      }
    } finally {
      setLoadingPrices(false);
    }
  };

  const loadNews = async () => {
    setLoadingNews(true);
    try {
      console.log("🔄 TicketPrice - Đang tải tin tức...");
      const response = await newsService.getByDisplayPage("ticket-price", 50);
      console.log("✅ TicketPrice - News API Response:", response);
      
      if (response.status === 200) {
        
        const allNews = response.data.items || response.data || [];
        setAllNewsData(allNews); 
        window.allNews = allNews; 
        console.log("TicketPrice - All news from API:", allNews);
        console.log("TicketPrice - LocalStorage keys with 'news_':", Object.keys(localStorage).filter(k => k.startsWith('news_')));
        
       
        Object.keys(localStorage).filter(k => k.startsWith('news_')).forEach(key => {
          console.log(`TicketPrice - localStorage['${key}'] =`, localStorage.getItem(key));
        });

        let newsDisplayPageMap = {};
        try {
          const mapStr = localStorage.getItem('newsDisplayPageMap');
          if (mapStr && mapStr !== 'null' && mapStr !== 'undefined') {
            newsDisplayPageMap = JSON.parse(mapStr);
          }
        } catch (e) {
          console.error("TicketPrice - Error parsing newsDisplayPageMap:", e);
        }
        console.log("TicketPrice - newsDisplayPageMap from localStorage:", newsDisplayPageMap);
        
        const filteredNews = allNews
          .filter((item) => {
            
            let contentDisplayPage = null;
            if (item.content) {
              const contentStr = String(item.content);

              if (contentStr.includes('<!--DISPLAY_PAGE:ticket-price-->')) {
                contentDisplayPage = "ticket-price";
              }
      
              else if (/<!--\s*DISPLAY_PAGE\s*:\s*ticket-price\s*-->/i.test(contentStr)) {
                contentDisplayPage = "ticket-price";
              }
            }
            

            let storedDisplayPage = localStorage.getItem(`news_${item.id}_displayPage`);
            if (storedDisplayPage === 'null' || storedDisplayPage === 'undefined' || storedDisplayPage === null) {
              storedDisplayPage = null;
            }
            
   
            const mapDisplayPage = newsDisplayPageMap[item.id] || newsDisplayPageMap[String(item.id)] || newsDisplayPageMap[Number(item.id)];
            
         
            const apiDisplayPage = item.displayPage || item.display_page;
            
            const isTicketPrice = (
              contentDisplayPage === "ticket-price" || 
              storedDisplayPage === "ticket-price" ||
              mapDisplayPage === "ticket-price" ||
              apiDisplayPage === "ticket-price"
            );
            
            if (isTicketPrice) {
              console.log(`✅ TicketPrice - News ID ${item.id} MATCHED:`, {
                contentDisplayPage,
                storedDisplayPage,
                mapDisplayPage,
                apiDisplayPage,
                title: item.title,
                contentPreview: item.content ? item.content.substring(0, 100) : 'no content'
              });
            } else if (item.content) {
         
              console.log(`❌ TicketPrice - News ID ${item.id} NOT MATCHED:`, {
                title: item.title,
                contentPreview: item.content.substring(0, 200),
                hasTag: item.content.includes('DISPLAY_PAGE')
              });
            }
            
            return isTicketPrice;
          })
          .sort((a, b) => {
     
            const dateA = new Date(a.createdAt || a.created_at || 0);
            const dateB = new Date(b.createdAt || b.created_at || 0);
            return dateB - dateA;
          });
        
        console.log("TicketPrice - Filtered news:", filteredNews);
        
  
        if (filteredNews.length === 0 && allNews.length > 0) {
          console.warn("⚠️ TicketPrice - Không tìm thấy tin tức với displayPage='ticket-price'");
          console.warn("⚠️ localStorage không được chia sẻ giữa admin (localhost:5175) và user (localhost:5173)");
          console.warn("");
          console.warn("🚀 CÁCH NHANH NHẤT - Chạy lệnh này trong Console:");
          console.warn(`   localStorage.setItem('newsDisplayPageMap', '${JSON.stringify({})}'); location.reload();`);
          console.warn("");
          console.warn("📋 HOẶC sync từ admin:");
          console.warn("   1. Mở admin panel (localhost:5175), mở Console (F12)");
          console.warn("   2. Chạy: JSON.stringify(JSON.parse(localStorage.getItem('newsDisplayPageMap') || '{}'))");
          console.warn("   3. Copy kết quả (ví dụ: {\"1\":\"ticket-price\",\"5\":\"ticket-price\"})");
          console.warn("   4. Trong user console chạy:");
          console.warn("      localStorage.setItem('newsDisplayPageMap', '<paste-result-here>'); location.reload();");
          console.warn("");
          console.warn("💡 HOẶC set từng tin tức:");
          allNews.slice(0, 5).forEach(item => {
            console.warn(`   localStorage.setItem('news_${item.id}_displayPage', 'ticket-price');`);
          });
          console.warn("   Sau đó refresh trang (F5)");
        }
        
        setNews(filteredNews);
        
 
        if (filteredNews.length > 0) {
          setSelectedNews(filteredNews[0]); 
          console.log("✅✅✅ TicketPrice - ĐÃ TÌM THẤY TIN TỨC - selectedNews được set:", filteredNews[0].title);
        } else {
          setSelectedNews(null);
          console.log("❌❌❌ TicketPrice - KHÔNG TÌM THẤY TIN TỨC - selectedNews = null, sẽ hiển thị bảng giá");
          console.log("❌❌❌ TicketPrice - filteredNews.length =", filteredNews.length);
          console.log("❌❌❌ TicketPrice - allNews.length =", allNews.length);
          
          if (allNews.length > 0) {
            console.error("🚨🚨🚨 QUAN TRỌNG: Để hiển thị tin tức, chạy lệnh này trong Console:");
            console.error(`   localStorage.setItem('newsDisplayPageMap', '${JSON.stringify({})}'); location.reload();`);
            console.error("   Hoặc set từng tin tức:");
            allNews.slice(0, 3).forEach(item => {
              console.error(`   localStorage.setItem('news_${item.id}_displayPage', 'ticket-price');`);
            });
            console.error("   Sau đó: location.reload();");
          }
        }
      } else {
        console.log("Response status not 200:", response.status);
        setNews([]);
      }
    } catch (error) {
      console.error("Error loading news:", error);
      setNews([]);
    } finally {
      setLoadingNews(false);
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

  const renderContent = (htmlContent) => {
    if (!htmlContent) return null;
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  return (
    <>
      {/* HEADER */}
      <Header />

      {/* MAIN */}
      <section className="ticket-section">
        {loadingNews && (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            Đang tải...
          </div>
        )}

        {/* DEBUG: Hiển thị trạng thái */}
        {!loadingNews && (
          <div style={{ 
            position: "fixed", 
            top: "10px", 
            right: "10px", 
            background: "rgba(0,0,0,0.8)", 
            color: "#fff", 
            padding: "10px", 
            borderRadius: "5px",
            fontSize: "12px",
            zIndex: 9999,
            display: "none" 
          }}>
            <div>selectedNews: {selectedNews ? "CÓ" : "KHÔNG"}</div>
            <div>news.length: {news.length}</div>
            <div>allNewsData.length: {allNewsData.length}</div>
        </div>
        )}

        {/* NẾU CÓ TIN TỨC: Hiển thị nội dung tin tức thay thế bảng giá */}
        {!loadingNews && selectedNews && (
          <div className="ticket-news-content">
            {selectedNews.image && (
              <div style={{ 
                width: "100%", 
                maxHeight: "400px", 
                overflow: "hidden",
                marginBottom: "30px",
                borderRadius: "8px"
              }}>
                <img
                  src={selectedNews.image}
                  alt={selectedNews.title}
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
            <h1 className="price" style={{ marginBottom: "20px" }}>
              {selectedNews.title}
            </h1>
            {selectedNews.content && (
              <div 
                className="ticket-news-body"
                style={{
                  color: "#ccc",
                  lineHeight: "1.8",
                  fontSize: "16px",
                }}
              >
                {renderContent(
           
                  selectedNews.content.replace(/<!--DISPLAY_PAGE:ticket-price-->/g, '')
                )}
        </div>
            )}
            <p style={{ 
              color: "#888", 
              fontSize: "14px", 
              marginTop: "30px",
              textAlign: "right"
            }}>
              Ngày đăng: {formatDate(selectedNews.createdAt || selectedNews.created_at)}
            </p>
          </div>
        )}

        {/* NẾU KHÔNG CÓ TIN TỨC: Hiển thị bảng giá vé từ API */}
        {!loadingNews && !selectedNews && (
          <div>
            <h1 className="price">Giá vé</h1>
            <p className="subtitle">(Áp dụng từ ngày 01/06/2023)</p>
            
            {loadingPrices ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                Đang tải giá vé...
              </div>
            ) : ticketPrices.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                <p style={{ fontSize: "16px", marginTop: "20px" }}>
                  Chưa có thông tin giá vé - Vui lòng quay lại sau
                </p>
                <p style={{ fontSize: "14px" }}>
                  Vui lòng tạo tin tức mới và chọn "Trang Giá Vé" trong admin panel.
                </p>
              </div>
            ) : (
              <div style={{ marginTop: "30px", overflowX: "auto" }}>
                {/* Nhóm giá vé theo loại phim */}
                {['2D', '3D'].map(typeMovie => {
                  const pricesByType = ticketPrices.filter(p => 
                    (p.typeMovie || p.type_movie) === typeMovie
                  );
                  
                  if (pricesByType.length === 0) return null;
                  
        
                  const weekdayPrices = pricesByType.filter(p => !p.dayType && !p.day_type);
                  const weekendPrices = pricesByType.filter(p => p.dayType || p.day_type);
                  
                  // Hàm để tạo bảng giá vé
                  const renderPriceTable = (prices, dayTypeLabel) => {
                    if (prices.length === 0) return null;
                    

                    const timeGroups = {};
                    prices.forEach(price => {
                      const timeKey = `${price.startTime || price.start_time || '01:00'}-${price.endTime || price.end_time || '23:59'}`;
                      if (!timeGroups[timeKey]) {
                        timeGroups[timeKey] = {
                          startTime: price.startTime || price.start_time || '01:00',
                          endTime: price.endTime || price.end_time || '23:59',
                          standard: null,
                          vip: null,
                          sweetbox: null
                        };
                      }
                      const seatType = price.typeSeat || price.type_seat;
                      if (seatType === 'STANDARD') timeGroups[timeKey].standard = price.price;
                      if (seatType === 'VIP') timeGroups[timeKey].vip = price.price;
                      if (seatType === 'SWEETBOX') timeGroups[timeKey].sweetbox = price.price;
                    });
                    
                    const timeGroupsArray = Object.values(timeGroups);
                    
                    return (
                      <div style={{ marginBottom: "30px" }}>
                        <h3 style={{ fontSize: "16px", marginBottom: "15px", color: "#ccc" }}>
                          {dayTypeLabel}
                        </h3>
                        <table style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          marginBottom: "20px",
                          background: "#1a1f29",
                          color: "#fff"
                        }}>
                          <thead>
                            <tr style={{ background: "#242b36" }}>
                              <th style={{ padding: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>Thời gian</th>
                              <th style={{ padding: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>Ghế thường</th>
                              <th style={{ padding: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>Ghế VIP</th>
                              <th style={{ padding: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>Ghế đôi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {timeGroupsArray.map((group, idx) => (
                              <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                <td style={{ padding: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                  {group.startTime} - {group.endTime}
                                </td>
                                <td style={{ padding: "12px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                                  {group.standard ? `${group.standard.toLocaleString()}đ` : '-'}
                                </td>
                                <td style={{ padding: "12px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                                  {group.vip ? `${group.vip.toLocaleString()}đ` : '-'}
                                </td>
                                <td style={{ padding: "12px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                                  {group.sweetbox ? `${group.sweetbox.toLocaleString()}đ` : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  };
                  
                  return (
                    <div key={typeMovie} style={{ marginBottom: "40px" }}>
                      <h2 style={{ 
                        fontSize: "20px", 
                        marginBottom: "20px",
                        color: "#fff",
                        fontWeight: "600"
                      }}>
                        {typeMovie === '2D' ? '1. GIÁ VÉ XEM PHIM 2D' : '2. GIÁ VÉ XEM PHIM 3D'}
                      </h2>
                      
                      {renderPriceTable(weekdayPrices, "Ngày thường (Từ thứ 2 đến thứ 5)")}
                      {renderPriceTable(weekendPrices, "Cuối tuần (Thứ 6, 7, CN và ngày Lễ)")}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <Footer />
    </>
  );
};

export default TicketPrice;
