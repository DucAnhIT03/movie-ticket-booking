import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Settings, Search, CreditCard } from "lucide-react";
import MovieModal from "./MovieModal";

export default function PaymentManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [payments, setPayments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // ✅ Load localStorage
  useEffect(() => {
    const stored = localStorage.getItem("payments");
    if (stored) setPayments(JSON.parse(stored));
    else {
      setPayments([
        {
          id: 1,
          booking_id: 101,
          payment_method: "VNPAY",
          payment_status: "COMPLETED",
          payment_time: "2025-11-07T14:30",
          amount: 150000,
          transaction_id: "TXN123456789",
          created_at: new Date(),
          updated_at: null
        },
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("payments", JSON.stringify(payments));
  }, [payments]);

  const handleOpenModal = (item) => {
    setSelectedPayment(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedPayment(null);
    setIsModalOpen(false);
  };

  const handleSavePayment = (data) => {
    // ✅ Validate booking_id
    if (!data.booking_id || data.booking_id <= 0) {
      alert("Booking ID không hợp lệ!");
      return;
    }

    // ✅ Validate amount
    if (data.amount < 0) {
      alert("Số tiền không được nhỏ hơn 0!");
      return;
    }

    // ✅ Validate payment_time
    if (!data.payment_time) {
      alert("Thời gian thanh toán không được bỏ trống!");
      return;
    }

    // ✅ Validate transaction_id
    if (!data.transaction_id.trim()) {
      alert("Mã giao dịch không được để trống!");
      return;
    }

    // ✅ Update
    if (data.id) {
      setPayments((prev) =>
        prev.map((p) =>
          p.id === data.id ? { ...data, updated_at: new Date() } : p
        )
      );
    } else {
      // ✅ Create
      const newItem = {
        ...data,
        id: Date.now(),
        created_at: new Date(),
        updated_at: null,
      };
      setPayments((prev) => [...prev, newItem]);
    }

    handleCloseModal();
  };

  const handleDeletePayment = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) {
      setPayments((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // ✅ Search theo booking_id hoặc transaction_id
  const filtered = payments.filter(
    (p) =>
      String(p.booking_id).includes(searchTerm) ||
      p.transaction_id.toLowerCase().includes(searchTerm.toLowerCase())
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
        <CreditCard /> Quản Lý Thanh Toán
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
            placeholder="Tìm theo Booking ID hoặc Transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "5px",
              padding: "8px 10px 8px 35px",
              width: "300px",
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
          <PlusCircle size={18} /> Thêm Giao Dịch
        </button>
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
            <th style={{ padding: "10px", textAlign: "center" }}>Booking ID</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Phương thức</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Trạng thái</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Thời gian</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Tổng tiền</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Mã giao dịch</th>
            <th style={{ padding: "10px", textAlign: "center" }}>Hành động</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #2a303d" }}>
              <td style={{ padding: "10px", textAlign: "center" }}>{p.booking_id}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{p.payment_method}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{p.payment_status}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {new Date(p.payment_time).toLocaleString("vi-VN")}
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {p.amount.toLocaleString()} đ
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>{p.transaction_id}</td>

              <td style={{ padding: "10px", textAlign: "center" }}>
                <button
                  onClick={() => handleOpenModal(p)}
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
                  onClick={() => handleDeletePayment(p.id)}
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

      {/* Modal */}
      {isModalOpen && (
        <MovieModal
          title={selectedPayment ? "Sửa Giao Dịch" : "Thêm Giao Dịch"}
          onClose={handleCloseModal}
          onSave={handleSavePayment}
          initialData={selectedPayment}
          fields={[
            { name: "booking_id", label: "Booking ID", type: "number" },
            {
              name: "payment_method",
              label: "Phương thức thanh toán",
              type: "select",
              options: ["VIETQR", "VNPAY", "VIETTEL_PAY", "PAYPAL"],
            },
            {
              name: "payment_status",
              label: "Trạng thái",
              type: "select",
              options: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"],
            },
            { name: "payment_time", label: "Thời gian thanh toán", type: "datetime-local" },
            { name: "amount", label: "Số tiền", type: "number" },
            { name: "transaction_id", label: "Mã giao dịch", type: "text" },
          ]}
        />
      )}
    </div>
  );
}
