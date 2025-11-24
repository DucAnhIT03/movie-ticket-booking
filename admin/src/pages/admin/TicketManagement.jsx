import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Settings, Search, Ticket } from "lucide-react";
import MovieModal from "./MovieModal";
import { sortByNewest } from "../../utils/sortUtils";

export default function TicketManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tickets, setTickets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // ✅ Lưu dữ liệu vào localStorage
  useEffect(() => {
    const stored = localStorage.getItem("tickets");
    if (stored) setTickets(sortByNewest(JSON.parse(stored)));
    else {
      // dữ liệu mẫu
      setTickets(sortByNewest([
        {
          id: 1,
          user_id: 101,
          showtime_id: 201,
          total_seat: 3,
          total_price_movie: 270000,
          created_at: new Date(),
          updated_at: null,
        },
      ]));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tickets", JSON.stringify(tickets));
  }, [tickets]);

  const handleOpenModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedTicket(null);
    setIsModalOpen(false);
  };

  const handleSaveTicket = (data) => {
    // ✅ Kiểm tra dữ liệu hợp lệ
    if (data.total_seat < 0 || data.total_price_movie < 0) {
      alert("Tổng số ghế và tổng giá tiền không được nhỏ hơn 0!");
      return;
    }

    if (data.id) {
      // cập nhật vé
      setTickets((prev) =>
        sortByNewest(
          prev.map((t) =>
            t.id === data.id ? { ...data, updated_at: new Date() } : t
          )
        )
      );
    } else {
      // thêm vé mới
      const newTicket = {
        ...data,
        id: Date.now(),
        created_at: new Date(),
        updated_at: null,
      };
      setTickets((prev) => sortByNewest([newTicket, ...prev]));
    }
    handleCloseModal();
  };

  const handleDeleteTicket = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vé này không?")) {
      setTickets((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const filtered = tickets.filter(
    (t) =>
      t.user_id.toString().includes(searchTerm) ||
      t.showtime_id.toString().includes(searchTerm)
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
        <Ticket /> Quản Lý Vé
      </h1>

      {/* Thanh tìm kiếm & nút thêm */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "15px",
        }}
      >
        <div style={{ position: "relative" }}>
          <Search
            style={{ position: "absolute", left: "10px", top: "8px", color: "#aaa" }}
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm theo user_id hoặc showtime_id..."
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
          <PlusCircle size={18} /> Thêm Vé
        </button>
      </div>

      {/* Bảng vé */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#1a1f29",
          color: "#fff",
        }}
      >
        <thead style={{ background: "#242b36", textAlign: "left" }}>
          <tr>
            <th style={{ padding: "10px" }}>ID</th>
            <th style={{ padding: "10px" }}>Mã người dùng</th>
            <th style={{ padding: "10px" }}>Mã lịch chiếu</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Tổng ghế</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Tổng giá (VNĐ)</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Ngày tạo</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Ngày cập nhật</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((ticket) => (
            <tr key={ticket.id} style={{ borderBottom: "1px solid #2a303d" }}>
              <td style={{ padding: "10px" }}>{ticket.id}</td>
              <td style={{ padding: "10px" }}>{ticket.user_id}</td>
              <td style={{ padding: "10px" }}>{ticket.showtime_id}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{ticket.total_seat}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {ticket.total_price_movie.toLocaleString("vi-VN")}
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {new Date(ticket.created_at).toLocaleDateString("vi-VN")}
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {ticket.updated_at
                  ? new Date(ticket.updated_at).toLocaleDateString("vi-VN")
                  : "—"}
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                <button
                  onClick={() => handleOpenModal(ticket)}
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
                  onClick={() => handleDeleteTicket(ticket.id)}
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
          ))}
        </tbody>
      </table>

      {/* Modal thêm/sửa vé */}
      {isModalOpen && (
        <MovieModal
          title={selectedTicket ? "Sửa Vé" : "Thêm Vé"}
          onClose={handleCloseModal}
          onSave={handleSaveTicket}
          initialData={selectedTicket}
          fields={[
            { name: "user_id", label: "User ID", type: "number" },
            { name: "showtime_id", label: "ShowTime ID", type: "number" },
            { name: "total_seat", label: "Tổng số ghế", type: "number" },
            { name: "total_price_movie", label: "Tổng giá phim (VNĐ)", type: "number" },
          ]}
        />
      )}
    </div>
  );
}
