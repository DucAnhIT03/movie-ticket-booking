import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Ticket,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import bookingService from "../../services/bookings/bookingService";

export default function TicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const statusOptions = useMemo(
    () => [
      { label: "Tất cả trạng thái", value: "" },
      { label: "Đã thanh toán", value: "BOOKED" },
      { label: "Chờ thanh toán", value: "PENDING" },
      { label: "Đã hủy", value: "CANCELLED" },
      { label: "Thanh toán lỗi", value: "FAILED" },
    ],
    [],
  );

  const channelOptions = useMemo(
    () => [
      { label: "Mọi kênh", value: "" },
      { label: "Online", value: "ONLINE" },
      { label: "Tại quầy", value: "OFFLINE" },
    ],
    [],
  );

  const fetchTickets = async (override = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        q: query || undefined,
        status: statusFilter || undefined,
        channel: channelFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        ...override,
      };
      const response = await bookingService.getAdminBookings(params);
      if (response.status === 200) {
        const data = response.data || {};
        setTickets(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.page && data.page !== page) {
          setPage(data.page);
        }
      } else if (response.status === 401) {
        toast.error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!");
      } else if (response.status === 403) {
        toast.error("Bạn không có quyền truy cập danh sách vé.");
      } else {
        toast.error(response.data?.message || "Không thể tải danh sách vé đã đặt.");
      }
    } catch (error) {
      console.error("Fetch admin bookings error:", error);
      toast.error("Lỗi kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
   
  }, [page, limit, query, statusFilter, channelFilter]);

  const handleSearch = () => {
    setPage(1);
    setQuery(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setQuery("");
    setStatusFilter("");
    setChannelFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    fetchTickets({
      page: 1,
      q: undefined,
      status: undefined,
      channel: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const handleRefresh = () => {
    fetchTickets();
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vé này không?")) {
      return;
    }

    try {
      const response = await bookingService.deleteBooking(bookingId);
      if (response.status === 200) {
        toast.success("Xóa vé thành công!");
        fetchTickets(); // Làm mới danh sách
      } else if (response.status === 401) {
        toast.error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!");
      } else if (response.status === 403) {
        toast.error("Bạn không có quyền xóa vé.");
      } else if (response.status === 404) {
        toast.error("Không tìm thấy vé để xóa.");
      } else {
        toast.error(response.data?.message || "Không thể xóa vé.");
      }
    } catch (error) {
      console.error("Delete booking error:", error);
      toast.error("Lỗi kết nối đến server.");
    }
  };

  const gotoPrev = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  const gotoNext = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const getPaymentInfo = (booking) => {
    const payments = booking.payments || [];
    if (payments.some((p) => p.payment_status === "COMPLETED")) {
      const completed = payments.find((p) => p.payment_status === "COMPLETED");
      // Lấy thời gian thanh toán từ updated_at hoặc completed_at
      const paidAt = completed?.updated_at || completed?.completed_at || completed?.paid_at || completed?.created_at;
      return {
        label: "Đã thanh toán",
        color: "#22c55e",
        method: completed?.payment_method || "N/A",
        paidAt: paidAt,
      };
    }
    if (payments.some((p) => p.payment_status === "CANCELLED")) {
      const cancelled = payments.find((p) => p.payment_status === "CANCELLED");
      const cancelledAt = cancelled?.updated_at || cancelled?.created_at;
      return { 
        label: "Đã hủy", 
        color: "#ef4444", 
        method: "—",
        paidAt: cancelledAt,
      };
    }
    if (payments.some((p) => p.payment_status === "FAILED")) {
      const failed = payments.find((p) => p.payment_status === "FAILED");
      const failedAt = failed?.updated_at || failed?.created_at;
      return { 
        label: "Thanh toán lỗi", 
        color: "#f97316", 
        method: "—",
        paidAt: failedAt,
      };
    }
    if (payments.some((p) => p.payment_status === "PENDING") || payments.length === 0) {
      const pending = payments[0];
      return {
        label: "Chờ thanh toán",
        color: "#fbbf24",
        method: pending?.payment_method || "—",
        paidAt: null,
      };
    }
    return { 
      label: "Không xác định", 
      color: "#9ca3af", 
      method: "—",
      paidAt: null,
    };
  };

  const formatCurrency = (value) => {
    if (value == null) return "—";
    return `${Number(value).toLocaleString("vi-VN")} đ`;
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("vi-VN");
  };

  const currentRangeStart = (page - 1) * limit + 1;
  const currentRangeEnd = Math.min(total, page * limit);

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
        <Ticket /> Quản Lý Thông Tin Vé Đã Đặt
      </h1>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          rowGap: "10px",
          marginBottom: "15px",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: "1 1 100%",
            flexBasis: "100%",
            minWidth: "260px",
            maxWidth: "100%",
          }}
        >
          <Search
            style={{ position: "absolute", left: "10px", top: "8px", color: "#aaa" }}
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm theo mã hóa đơn hoặc số điện thoại..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "6px",
              padding: "8px 10px 8px 35px",
              width: "100%",
              height: "44px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          style={{
            background: "#1a1f29",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "8px 12px",
            minWidth: "180px",
            flex: "0 1 200px",
            height: "44px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            flex: "0 1 200px",
            flexBasis: "200px",
            minWidth: "170px",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>Từ ngày</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setPage(1);
              setStartDate(e.target.value);
            }}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "6px",
              padding: "10px 12px",
              minWidth: "140px",
              height: "44px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            flex: "0 1 200px",
            flexBasis: "200px",
            minWidth: "170px",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>Đến ngày</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setPage(1);
              setEndDate(e.target.value);
            }}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "6px",
              padding: "10px 12px",
              minWidth: "140px",
              height: "44px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <select
          value={channelFilter}
          onChange={(e) => {
            setPage(1);
            setChannelFilter(e.target.value);
          }}
          style={{
            background: "#1a1f29",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "8px 12px",
            minWidth: "180px",
            flex: "0 1 200px",
            height: "44px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {channelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "nowrap",
            justifyContent: "flex-end",
            flex: "0 0 auto",
          }}
        >
          <button
            onClick={handleSearch}
            style={{
              background: "#2563eb",
              color: "#fff",
              padding: "10px 16px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
              minWidth: "90px",
              height: "44px",
              boxSizing: "border-box",
            }}
          >
            Tìm kiếm
          </button>
          <button
            onClick={handleResetFilters}
            style={{
              background: "#1f2937",
              color: "#fff",
              padding: "10px 16px",
              border: "1px solid #374151",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
              minWidth: "90px",
              height: "44px",
              boxSizing: "border-box",
            }}
          >
            Xóa lọc
          </button>
          <button
            onClick={handleRefresh}
            style={{
              background: "#374151",
              color: "#fff",
              padding: "10px 16px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              minWidth: "100px",
              height: "44px",
              boxSizing: "border-box",
            }}
          >
            <RefreshCcw size={16} /> Làm mới
          </button>
        </div>
      </div>

      <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #2a303d", overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#1a1f29",
            color: "#fff",
            tableLayout: "auto",
          }}
        >
          <thead style={{ background: "#242b36", textAlign: "left" }}>
            <tr>
              <th style={{ padding: "10px", maxWidth: "180px", minWidth: "150px" }}>Mã hóa đơn</th>
              <th style={{ padding: "10px" }}>Khách hàng</th>
              <th style={{ padding: "10px" }}>Liên hệ</th>
              <th style={{ padding: "10px" }}>Suất chiếu</th>
              <th style={{ padding: "10px", textAlign: "center", width: "80px" }}>Tổng ghế</th>
              <th style={{ padding: "10px" }}>Tổng giá</th>
              <th style={{ padding: "10px", whiteSpace: "nowrap" }}>Thanh toán</th>
              <th style={{ padding: "10px", whiteSpace: "nowrap" }}>Kênh</th>
              <th style={{ padding: "10px" }}>Ngày tạo</th>
              <th style={{ padding: "10px", textAlign: "center", whiteSpace: "nowrap" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ padding: "30px", textAlign: "center" }}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: "30px", textAlign: "center", color: "#cbd5f5" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <AlertCircle size={18} />
                    <span>Không có vé nào phù hợp với bộ lọc.</span>
                  </div>
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const paymentInfo = getPaymentInfo(ticket);
                const userLabel =
                  ticket.customerName ||
                  `${ticket.user?.firstName || ""} ${ticket.user?.lastName || ""}`.trim() ||
                  ticket.user?.email ||
                  "Người dùng hệ thống";
                const contact = ticket.customerPhone || ticket.user?.phone || "—";
                const movieTitle = ticket.showtime?.movie?.title || "Chưa xác định";
                const showtimeStart = ticket.showtime?.startTime
                  ? new Date(ticket.showtime.startTime).toLocaleString("vi-VN")
                  : "—";

                // Xác định thông tin hiển thị dưới tên khách hàng
                let staffInfo = "—";
                if (ticket.channel === "OFFLINE") {
                  // Nếu là thanh toán tại quầy, hiển thị tên nhân viên
                  if (ticket.createdByStaff) {
                    // Ưu tiên hiển thị tên đầy đủ (firstName + lastName)
                    let staffName = "";
                    if (ticket.createdByStaff.firstName || ticket.createdByStaff.lastName) {
                      staffName = `${ticket.createdByStaff.firstName || ""} ${ticket.createdByStaff.lastName || ""}`.trim();
                    }
                    // Nếu không có tên đầy đủ, dùng username hoặc email
                    if (!staffName) {
                      staffName = ticket.createdByStaff.username || ticket.createdByStaff.email || "Nhân viên";
                    }
                    staffInfo = staffName;
                  } else if (ticket.createdByStaffId) {
                    // Có ID nhưng không có thông tin staff object
                    staffInfo = "Nhân viên";
                  } else {
                    // Không có thông tin staff
                    staffInfo = "Tại quầy";
                  }
                } else if (ticket.channel === "ONLINE") {
                  // Nếu là thanh toán online
                  staffInfo = "Thanh toán online";
                }

                return (
                  <tr key={ticket.id} style={{ borderBottom: "1px solid #2a303d" }}>
                    <td style={{ 
                      padding: "10px", 
                      maxWidth: "180px", 
                      minWidth: "150px",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      overflow: "hidden"
                    }} title={ticket.invoiceCode || ticket.invoice_code || "—"}>
                      {ticket.invoiceCode || ticket.invoice_code || "—"}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <div style={{ fontWeight: 600 }}>{userLabel}</div>
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>{staffInfo}</div>
                    </td>
                    <td style={{ padding: "10px" }}>{contact}</td>
                    <td style={{ padding: "10px" }}>
                      <div>{movieTitle}</div>
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>{showtimeStart}</div>
                    </td>
                    <td style={{ padding: "10px", textAlign: "center", width: "80px" }}>{ticket.totalSeat || ticket.total_seat || 0}</td>
                    <td style={{ padding: "10px" }}>{formatCurrency(ticket.totalPriceMovie || ticket.total_price_movie)}</td>
                    <td style={{ padding: "10px" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: "999px",
                          padding: "4px 10px",
                          color: paymentInfo.color,
                          fontWeight: 600,
                        }}
                      >
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "999px",
                            background: paymentInfo.color,
                          }}
                        />
                        {paymentInfo.label}
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
                        {paymentInfo.method !== "—" ? `Phương thức: ${paymentInfo.method}` : ""}
                      </div>
                      {paymentInfo.paidAt && (
                        <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
                          {formatDateTime(paymentInfo.paidAt)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px" }}>
                      {ticket.channel === "OFFLINE" ? "Tại quầy" : "Online"}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <div>{formatDateTime(ticket.created_at || ticket.createdAt)}</div>
                      {ticket.updated_at && (
                        <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                          Cập nhật: {formatDateTime(ticket.updated_at)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "14px",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => (e.target.style.background = "#dc2626")}
                        onMouseLeave={(e) => (e.target.style.background = "#ef4444")}
                        title="Xóa vé"
                      >
                        <Trash2 size={16} />
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "16px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ color: "#cbd5f5" }}>
          {total > 0
            ? `Hiển thị ${currentRangeStart}-${currentRangeEnd} trong ${total} vé`
            : "Không có dữ liệu"}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "6px",
              padding: "8px 12px",
              minWidth: "140px",
              height: "40px",
            }}
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / trang
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={gotoPrev}
              disabled={page === 1 || loading}
              style={{
                background: "#1f2937",
                color: "#fff",
                border: "1px solid #374151",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: page === 1 || loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <ChevronLeft size={16} /> Trước
            </button>
            <div style={{ display: "flex", alignItems: "center", color: "#cbd5f5" }}>
              Trang {page}/{Math.max(totalPages, 1)}
            </div>
            <button
              onClick={gotoNext}
              disabled={page >= totalPages || loading}
              style={{
                background: "#1f2937",
                color: "#fff",
                border: "1px solid #374151",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: page >= totalPages || loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Sau <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
