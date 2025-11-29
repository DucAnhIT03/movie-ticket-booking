import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Settings, Search, Ticket, Download, Upload } from "lucide-react";
import { toast } from "react-toastify";
import MovieModal from "./MovieModal";
import ticketPriceService from "../../services/ticket-prices/ticketPriceService";
import theaterService from "../../services/theaters/theaterService";
import movieService from "../../services/movies/movieService";
import { sortByNewest } from "../../utils/sortUtils";

export default function TicketPriceManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketPrices, setTicketPrices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theaters, setTheaters] = useState([]);
  const [movies, setMovies] = useState([]);

  
  useEffect(() => {
    loadTicketPrices();
    loadTheaters();
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      const response = await movieService.getAllMovies({ page: 1, limit: 1000 });
      if (response.status === 200) {
        const data = response.data;
        const items = data.items || data.data || data || [];
        setMovies(items);
      }
    } catch (error) {
      console.error("Error loading movies:", error);
    }
  };

  const loadTheaters = async () => {
    try {
      const response = await theaterService.getAllTheaters({ page: 1, limit: 1000 });
      if (response.status === 200) {
        const data = response.data;
        const items = data.items || data.data || data || [];
        setTheaters(items);
      }
    } catch (error) {
      console.error("Error loading theaters:", error);
    }
  };

  const loadTicketPrices = async () => {
    setLoading(true);
    try {
      const response = await ticketPriceService.getAllTicketPrices({ page: 1, limit: 1000 });
      if (response.status === 200) {
        const data = response.data;
        const items = data.items || data || [];
        
        const convertedItems = items.map(item => ({
          id: item.id,
          type_seat: item.typeSeat || item.type_seat,
          type_movie: item.typeMovie || item.type_movie || "2D",
          price: item.price,
          day_type: item.dayType !== undefined ? item.dayType : item.day_type,
          start_time: item.startTime || item.start_time,
          end_time: item.endTime || item.end_time,
          start_date: item.startDate || item.start_date || null,
          end_date: item.endDate || item.end_date || null,
          theater_id: item.theaterId ?? item.theater_id ?? null,
          movie_id: item.movieId ?? item.movie_id ?? null,
          created_at: item.created_at || item.createdAt,
          updated_at: item.updated_at || item.updatedAt,
        }));
        setTicketPrices(sortByNewest(convertedItems));
      } else {
        toast.error("Lỗi khi tải danh sách giá vé");
      }
    } catch (error) {
      console.error("Error loading ticket prices:", error);
      toast.error("Lỗi khi tải danh sách giá vé");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item) => {
    setSelectedPrice(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedPrice(null);
    setIsModalOpen(false);
  };

  const handleSavePrice = async (data) => {
  
    if (data.price < 0) {
      toast.error("Giá vé không được nhỏ hơn 0!");
      return;
    }

   
    const validSeat = ["STANDARD", "VIP", "SWEETBOX"];
    if (!validSeat.includes(data.type_seat)) {
      toast.error("Loại ghế không hợp lệ!");
      return;
    }

    if (!data.movie_id && !data.type_movie) {
      toast.error("Vui lòng chọn phim hoặc loại phim!");
      return;
    }

 
    if (data.start_time >= data.end_time) {
      toast.error("Giờ kết thúc phải lớn hơn giờ bắt đầu!");
      return;
    }


    if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
      toast.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!");
      return;
    }

    try {
      const selectedTheaterIds = data.theater_ids || [];
      
     
      let typeMovie = data.type_movie || '2D'; 
      if (data.movie_id) {
        const selectedMovie = movies.find(m => m.id === parseInt(data.movie_id));
        if (selectedMovie && selectedMovie.type) {
          typeMovie = selectedMovie.type; 
        }
      }
      
      
      if (!typeMovie && !data.movie_id) {
        toast.error("Vui lòng chọn phim hoặc loại phim!");
        return;
      }
      
    
      if (selectedTheaterIds.length > 0) {
        const ticketPrices = selectedTheaterIds.map(theaterId => {
          const ticketData = {
            typeSeat: data.type_seat,
            price: parseFloat(data.price),
            dayType: data.day_type,
            startTime: data.start_time || "01:00",
            endTime: data.end_time || "23:59",
            theaterId: theaterId,
          };
          
       
          ticketData.typeMovie = typeMovie;
          
         
          if (data.movie_id) {
            ticketData.movieId = parseInt(data.movie_id);
          }
          
        
          if (data.start_date) {
            ticketData.startDate = data.start_date;
          }
          if (data.end_date) {
            ticketData.endDate = data.end_date;
          }
          
          return ticketData;
        });

        const response = await ticketPriceService.createBatchTicketPrices(ticketPrices);
        if (response.status === 201 || response.status === 200) {
          toast.success(`Đã tạo ${ticketPrices.length} giá vé thành công!`);
          loadTicketPrices();
        } else {
          const errorMsg = response.data?.message || response.data?.error || "Lỗi khi tạo giá vé";
          toast.error(errorMsg);
          console.error("Error response:", response);
        }
      } else {
        
        const apiData = {
          typeSeat: data.type_seat,
          price: parseFloat(data.price),
          dayType: data.day_type,
          startTime: data.start_time || "01:00",
          endTime: data.end_time || "23:59",
          theaterId: null,
        };
        
        
        apiData.typeMovie = typeMovie;
        
       
        if (data.movie_id) {
          apiData.movieId = parseInt(data.movie_id);
        }
        
      
        if (data.start_date) {
          apiData.startDate = data.start_date;
        }
        if (data.end_date) {
          apiData.endDate = data.end_date;
        }

        if (data.id) {
        
          const response = await ticketPriceService.updateTicketPrice(data.id, apiData);
          if (response.status === 200) {
            toast.success("Cập nhật giá vé thành công!");
            loadTicketPrices();
          } else {
            toast.error("Lỗi khi cập nhật giá vé");
          }
        } else {
      
          const response = await ticketPriceService.createTicketPrice(apiData);
          if (response.status === 201 || response.status === 200) {
            toast.success("Tạo giá vé thành công!");
            loadTicketPrices();
          } else {
            const errorMsg = response.data?.message || response.data?.error || "Lỗi khi tạo giá vé";
            toast.error(errorMsg);
            console.error("Error response:", response);
          }
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving ticket price:", error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || "Lỗi khi lưu giá vé";
      toast.error(errorMsg);
    }
  };

  const handleDeletePrice = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa giá vé này?")) {
      return;
    }

    try {
      const response = await ticketPriceService.deleteTicketPrice(id);
      if (response.status === 200) {
        toast.success("Xóa giá vé thành công!");
        loadTicketPrices();
      } else {
        toast.error("Lỗi khi xóa giá vé");
      }
    } catch (error) {
      console.error("Error deleting ticket price:", error);
      toast.error("Lỗi khi xóa giá vé");
    }
  };

  const handleBatchSetup = () => {
    loadTicketPrices();
  };


  const filtered = ticketPrices.filter(
    (t) =>
      t.type_seat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.type_movie.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Ticket /> Quản Lý Giá Vé
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
            placeholder="Tìm theo loại ghế hoặc loại phim..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "5px",
              padding: "8px 10px 8px 35px",
              width: "280px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setIsBatchModalOpen(true)}
            style={{
              background: "#1976d2",
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
            <Upload size={18} /> Setup Đồng Loạt
          </button>
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
            <PlusCircle size={18} /> Thêm Giá Vé
          </button>
        </div>
      </div>

      {/* Table */}
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
            <th style={{ padding: "10px", textAlign: "center" }}>Loại ghế</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Loại phim</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Giá vé</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Ngày</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Giờ BD</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Giờ KT</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Hành động</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} style={{ padding: "20px", textAlign: "center" }}>
                Đang tải...
              </td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: "20px", textAlign: "center" }}>
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            filtered.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid #2a303d" }}>
              <td style={{ padding: "10px", textAlign: "center" }}>{t.type_seat}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{t.type_movie}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {t.price.toLocaleString()} đ
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {t.day_type ? "Cuối tuần (T6, T7, CN)" : "Ngày thường (T2-T5)"}
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>{t.start_time}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{t.end_time}</td>

              <td style={{ padding: "10px", textAlign: "center" }}>
                <button
                  onClick={() => handleOpenModal(t)}
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
                  onClick={() => handleDeletePrice(t.id)}
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

      {/* Modal */}
      {isModalOpen && (
        <MovieModal
          title={selectedPrice ? "Sửa Giá Vé" : "Thêm Giá Vé"}
          onClose={handleCloseModal}
          onSave={handleSavePrice}
          initialData={selectedPrice ? {
            ...selectedPrice,
            type_movie: selectedPrice.type_movie || "2D",
            theater_ids: selectedPrice.theater_id ? [selectedPrice.theater_id] : [],
            movie_id: selectedPrice.movie_id || selectedPrice.movieId || '',
            start_date: selectedPrice.start_date ? (typeof selectedPrice.start_date === 'string' ? selectedPrice.start_date.split('T')[0] : selectedPrice.start_date) : '',
            end_date: selectedPrice.end_date ? (typeof selectedPrice.end_date === 'string' ? selectedPrice.end_date.split('T')[0] : selectedPrice.end_date) : '',
            start_time: selectedPrice.start_time || "01:00",
            end_time: selectedPrice.end_time || "23:59",
          } : {
            type_movie: "2D",
            start_time: "01:00",
            end_time: "23:59",
          }}
          fields={[
            {
              name: "theater_ids",
              label: "Chọn rạp (có thể chọn nhiều)",
              type: "multiselect",
              options: theaters.map(t => ({ label: t.name || `Rạp ${t.id}`, value: t.id })),
            },
            {
              name: "type_seat",
              label: "Loại ghế",
              type: "select",
              options: ["STANDARD", "VIP", "SWEETBOX"],
            },
            {
              name: "type_movie",
              label: "Loại phim (2D/3D)",
              type: "select",
              required: false,
              defaultValue: "2D",
              options: [
                { label: "2D", value: "2D" },
                { label: "3D", value: "3D" },
              ],
            },
            {
              name: "movie_id",
              label: "Chọn phim",
              type: "select",
              options: movies.map(m => ({ 
                label: `${m.title || `Phim ${m.id}`} (${m.type || '2D'})`, 
                value: m.id 
              })),
            },
            { name: "price", label: "Giá vé", type: "number" },
            {
              name: "day_type",
              label: "Ngày",
              type: "select",
              options: [
                { label: "Ngày thường (T2 - T5)", value: false },
                { label: "Cuối tuần (T6, T7, CN)", value: true },
              ],
            },
            { name: "start_date", label: "Ngày bắt đầu", type: "date" },
            { name: "end_date", label: "Ngày kết thúc", type: "date" },
            { name: "start_time", label: "Giờ bắt đầu", type: "time" },
            { name: "end_time", label: "Giờ kết thúc", type: "time" },
          ]}
        />
      )}

      {/* Batch Setup Modal */}
      {isBatchModalOpen && (
        <BatchSetupModal
          theaters={theaters}
          movies={movies}
          onClose={() => setIsBatchModalOpen(false)}
          onSave={handleBatchSetup}
        />
      )}
    </div>
  );
}

// Component Batch Setup Modal
function BatchSetupModal({ theaters = [], movies = [], onClose, onSave }) {
  const [formData, setFormData] = useState({
    type_seat: "STANDARD", // Setup theo loại ghế
    movie_ids: [], // Chọn nhiều phim
    movie_type_filter: "ALL", // Lọc theo loại phim: ALL, 2D, 3D
    price: "",
    day_type: false,
    start_date: "",
    end_date: "",
    start_time: "01:00",
    end_time: "23:59",
  });
  
  // Lọc phim theo loại được chọn
  const filteredMovies = formData.movie_type_filter === "ALL" 
    ? movies 
    : movies.filter(m => (m.type || '2D') === formData.movie_type_filter);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.price || formData.price < 0) {
      toast.error("Vui lòng nhập giá vé hợp lệ!");
      return;
    }

    if (formData.start_time >= formData.end_time) {
      toast.error("Giờ kết thúc phải lớn hơn giờ bắt đầu!");
      return;
    }

    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!");
      return;
    }

    try {
      const selectedMovieIds = formData.movie_ids || [];
      
      if (selectedMovieIds.length === 0) {
        toast.error("Vui lòng chọn ít nhất một phim!");
        return;
      }
      
      // Setup đồng loạt luôn áp dụng cho tất cả rạp (theaterId = null)
      const ticketPrices = [];
      selectedMovieIds.forEach(movieId => {
        const selectedMovie = movies.find(m => m.id === movieId);
        const typeMovie = selectedMovie?.type || '2D';
        
        const ticketData = {
          typeSeat: formData.type_seat,
          typeMovie: typeMovie,
          movieId: movieId,
          price: parseFloat(formData.price),
          dayType: Boolean(formData.day_type), // Đảm bảo là boolean
          startTime: formData.start_time,
          endTime: formData.end_time,
          theaterId: null, // Luôn null để áp dụng cho tất cả rạp
        };
        
        console.log('📤 [ADMIN] Creating ticket price:', {
          ...ticketData,
          dayType: ticketData.dayType,
          dayTypeType: typeof ticketData.dayType
        });
        
        // Thêm dates nếu có
        if (formData.start_date) {
          ticketData.startDate = formData.start_date;
        }
        if (formData.end_date) {
          ticketData.endDate = formData.end_date;
        }
        
        ticketPrices.push(ticketData);
      });

      const response = await ticketPriceService.createBatchTicketPrices(ticketPrices);
      if (response.status === 201 || response.status === 200) {
        toast.success(`Đã tạo ${ticketPrices.length} giá vé thành công!`);
        onSave();
        onClose();
      } else {
        toast.error("Lỗi khi tạo giá vé đồng loạt");
      }
    } catch (error) {
      console.error("Error batch creating ticket prices:", error);
      toast.error("Lỗi khi tạo giá vé đồng loạt");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#1a1f29",
          padding: "30px",
          borderRadius: "10px",
          width: "900px",
          maxWidth: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ marginBottom: "20px", fontSize: "22px", flexShrink: 0 }}>
          Setup Giá Vé Đồng Loạt
        </h2>
        <p style={{ marginBottom: "20px", color: "#aaa", fontSize: "14px" }}>
          ⚠️ Lưu ý: Setup đồng loạt sẽ áp dụng cho <strong>TẤT CẢ CÁC RẠP</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1 }}>

          {/* Hàng 1: Loại ghế và Giá vé */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
            <div style={{ flex: 1, marginBottom: 0 }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Loại ghế *
              </label>
              <select
                value={formData.type_seat}
                onChange={(e) =>
                  setFormData({ ...formData, type_seat: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#242b36",
                  color: "#fff",
                  border: "1px solid #333",
                  borderRadius: "5px",
                }}
              >
                <option value="STANDARD">STANDARD</option>
                <option value="VIP">VIP</option>
                <option value="SWEETBOX">SWEETBOX</option>
              </select>
            </div>

            <div style={{ flex: 1, marginBottom: 0 }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Giá vé (VND) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
                min="0"
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#242b36",
                  color: "#fff",
                  border: "1px solid #333",
                  borderRadius: "5px",
                }}
              />
            </div>
          </div>

          {/* Hàng 2: Loại ngày và Lọc loại phim */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
            <div style={{ flex: 1, marginBottom: 0 }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Loại ngày
              </label>
              <select
                value={formData.day_type ? "true" : "false"}
                onChange={(e) => {
                  const dayTypeValue = e.target.value === "true";
                  console.log('🔧 [ADMIN] Setting day_type:', {
                    selectedValue: e.target.value,
                    convertedValue: dayTypeValue,
                    type: typeof dayTypeValue
                  });
                  setFormData({
                    ...formData,
                    day_type: dayTypeValue,
                  });
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#242b36",
                  color: "#fff",
                  border: "1px solid #333",
                  borderRadius: "5px",
                }}
              >
                <option value="false">Ngày thường (T2 - T5)</option>
                <option value="true">Cuối tuần (T6, T7, CN)</option>
              </select>
            </div>

            <div style={{ flex: 1, marginBottom: 0 }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Lọc theo loại phim
              </label>
              <select
                value={formData.movie_type_filter}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    movie_type_filter: e.target.value,
                    movie_ids: [], // Reset danh sách phim khi đổi filter
                  });
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#242b36",
                  color: "#fff",
                  border: "1px solid #333",
                  borderRadius: "5px",
                }}
              >
                <option value="ALL">Tất cả (2D & 3D)</option>
                <option value="2D">Chỉ phim 2D</option>
                <option value="3D">Chỉ phim 3D</option>
              </select>
            </div>
          </div>

          {/* Hàng 3: Ngày bắt đầu và Ngày kết thúc */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
            <div style={{ flex: 1, marginBottom: 0 }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#242b36",
                  color: "#fff",
                  border: "1px solid #333",
                  borderRadius: "5px",
                }}
              />
            </div>

            <div style={{ flex: 1, marginBottom: 0 }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#242b36",
                  color: "#fff",
                  border: "1px solid #333",
                  borderRadius: "5px",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Chọn phim (có thể chọn nhiều) *
              {filteredMovies.length > 0 && (
                <span style={{ fontSize: "12px", color: "#aaa", marginLeft: "8px" }}>
                  ({filteredMovies.length} phim {formData.movie_type_filter === "ALL" ? "" : formData.movie_type_filter})
                </span>
              )}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", maxHeight: "200px", overflowY: "auto", padding: "15px", background: "#242b36", borderRadius: "5px" }}>
              {filteredMovies.length === 0 ? (
                <div style={{ color: "#888", fontSize: "14px", width: "100%", textAlign: "center", padding: "20px" }}>
                  Không có phim {formData.movie_type_filter === "ALL" ? "" : formData.movie_type_filter} nào
                </div>
              ) : (
                <>
                  {/* Nút chọn tất cả */}
                  <div style={{ width: "100%", marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #333" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        fontWeight: "500",
                        color: "#4caf50",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filteredMovies.length > 0 && filteredMovies.every(m => formData.movie_ids.includes(m.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Chọn tất cả phim đã lọc
                            const allFilteredIds = filteredMovies.map(m => m.id);
                            setFormData({
                              ...formData,
                              movie_ids: [...new Set([...formData.movie_ids, ...allFilteredIds])],
                            });
                          } else {
                            // Bỏ chọn tất cả phim đã lọc
                            const filteredIds = filteredMovies.map(m => m.id);
                            setFormData({
                              ...formData,
                              movie_ids: formData.movie_ids.filter(id => !filteredIds.includes(id)),
                            });
                          }
                        }}
                      />
                      <span>Chọn tất cả ({filteredMovies.length} phim)</span>
                    </label>
                  </div>
                  
                  {/* Danh sách phim */}
                  {filteredMovies.map(movie => (
                    <label
                      key={movie.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        padding: "6px 10px",
                        borderRadius: "4px",
                        background: formData.movie_ids.includes(movie.id) ? "#1976d2" : "transparent",
                        transition: "background 0.2s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.movie_ids.includes(movie.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              movie_ids: [...formData.movie_ids, movie.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              movie_ids: formData.movie_ids.filter(
                                (id) => id !== movie.id
                              ),
                            });
                          }
                        }}
                      />
                      <span style={{ fontSize: "14px" }}>
                        {movie.title || `Phim ${movie.id}`} 
                        <span style={{ color: "#aaa", marginLeft: "5px" }}>
                          ({movie.type || '2D'})
                        </span>
                      </span>
                    </label>
                  ))}
                </>
              )}
            </div>
            {formData.movie_ids.length > 0 && (
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#4caf50" }}>
                Đã chọn: {formData.movie_ids.length} phim
              </div>
            )}
          </div>

          {/* Hàng 4: Giờ bắt đầu và Giờ kết thúc */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
            <div style={{ flex: 1, marginBottom: 0 }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Giờ bắt đầu
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#242b36",
                  color: "#fff",
                  border: "1px solid #333",
                  borderRadius: "5px",
                }}
              />
            </div>

            <div style={{ flex: 1, marginBottom: 0 }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Giờ kết thúc
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#242b36",
                  color: "#fff",
                  border: "1px solid #333",
                  borderRadius: "5px",
                }}
              />
            </div>
          </div>

          <div style={{ 
            display: "flex", 
            gap: "10px", 
            justifyContent: "flex-end",
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px solid #333",
            flexShrink: 0,
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                background: "#666",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Tạo Đồng Loạt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
