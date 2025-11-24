import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Settings, Search, Ticket } from "lucide-react";
import BookingSeatModal from "./BookingSeat";

export default function BookingSeatManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bookingSeats, setBookingSeats] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);

  // ✅ Lưu dữ liệu vào localStorage
  useEffect(() => {
    const stored = localStorage.getItem("bookingSeats");
    if (stored) setBookingSeats(JSON.parse(stored));
    else {
      // Dữ liệu mẫu
      setBookingSeats([
        {
          id: 1,
          booking_id: 101,
          seat_id: 12,
          quantity: 2,
          created_at: new Date(),
          updated_at: null,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bookingSeats", JSON.stringify(bookingSeats));
  }, [bookingSeats]);

  const handleOpenModal = (seat) => {
    setSelectedSeat(seat);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedSeat(null);
    setIsModalOpen(false);
  };

  const handleSaveSeat = (seatData) => {
    if (seatData.id) {
      // Cập nhật
      setBookingSeats((prev) =>
        prev.map((s) =>
          s.id === seatData.id ? { ...seatData, updated_at: new Date() } : s
        )
      );
    } else {
      // Thêm mới
      const newSeat = {
        ...seatData,
        id: Date.now(),
        created_at: new Date(),
        updated_at: null,
      };
      setBookingSeats((prev) => [...prev, newSeat]);
    }
    handleCloseModal();
  };

  const handleDeleteSeat = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đặt ghế này không?")) {
      setBookingSeats((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const filtered = bookingSeats.filter(
    (s) =>
      s.booking_id.toString().includes(searchTerm) ||
      s.seat_id.toString().includes(searchTerm)
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
        <Ticket /> Quản Lý Đặt Ghế
      </h1>

      {/* Thanh tìm kiếm + nút thêm */}
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
            placeholder="Tìm kiếm theo booking ID hoặc seat ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "5px",
              padding: "8px 10px 8px 35px",
              width: "250px",
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
          <PlusCircle size={18} /> Thêm Đặt Ghế
        </button>
      </div>

      {/* Bảng danh sách */}
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
            <th style={{ padding: "10px" }}>Booking ID</th>
            <th style={{ padding: "10px" }}>Seat ID</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Số lượng</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Ngày tạo</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Ngày cập nhật</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((seat) => (
            <tr key={seat.id} style={{ borderBottom: "1px solid #2a303d" }}>
              <td style={{ padding: "10px" }}>{seat.booking_id}</td>
              <td style={{ padding: "10px" }}>{seat.seat_id}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {seat.quantity}
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {new Date(seat.created_at).toLocaleDateString("vi-VN")}
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {seat.updated_at
                  ? new Date(seat.updated_at).toLocaleDateString("vi-VN")
                  : "-"}
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                <button
                  onClick={() => handleOpenModal(seat)}
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
                  onClick={() => handleDeleteSeat(seat.id)}
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

      {/* Modal thêm/sửa */}
      {isModalOpen && (
        <BookingSeatModal
          title={selectedSeat ? "Sửa Đặt Ghế" : "Thêm Đặt Ghế"}
          onClose={handleCloseModal}
          onSave={handleSaveSeat}
          initialData={selectedSeat}
          fields={[
            { name: "booking_id", label: "Booking ID", type: "number" },
            { name: "seat_id", label: "Seat ID", type: "number" },
            { name: "quantity", label: "Số lượng", type: "number" },
          ]}
        />
      )}
    </div>
  );
}
