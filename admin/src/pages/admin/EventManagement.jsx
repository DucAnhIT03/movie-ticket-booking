import React, { useEffect, useMemo, useState } from "react";
import {
  PlusCircle,
  Search,
  Settings,
  Trash2,
  CalendarDays,
  MapPin,
  Image as ImageIcon,
  Users,
} from "lucide-react";
import eventService from "../../services/events/eventService";
import EventModal from "./EventModal";
import "./EventManagement.css";
import { sortByNewest } from "../../utils/sortUtils";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "UPCOMING", label: "Sắp diễn ra" },
  { value: "ONGOING", label: "Đang diễn ra" },
  { value: "COMPLETED", label: "Đã kết thúc" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const STATUS_STYLES = {
  UPCOMING: { label: "Sắp diễn ra", className: "event-status-upcoming" },
  ONGOING: { label: "Đang diễn ra", className: "event-status-ongoing" },
  COMPLETED: { label: "Đã kết thúc", className: "event-status-completed" },
  CANCELLED: { label: "Đã hủy", className: "event-status-cancelled" },
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function EventManagement() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [specialOnly, setSpecialOnly] = useState(false);
  const [registrationModal, setRegistrationModal] = useState({
    open: false,
    loading: false,
    items: [],
    event: null,
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await eventService.getAll({
        search: searchTerm,
        status: statusFilter,
        is_special: specialOnly ? true : undefined,
        page,
        limit,
      });
      if (response.status === 200) {
        setEvents(sortByNewest(response.data.items || []));
        setTotalPages(response.data.totalPages || 0);
        setTotalItems(response.data.total || 0);
      } else {
        const message =
          response.data?.message || "Không thể tải danh sách sự kiện";
        alert(message);
      }
    } catch (error) {
      console.error("Error loading events:", error);
      alert("Có lỗi xảy ra khi tải danh sách sự kiện");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRegistrations = async (event) => {
    setRegistrationModal({
      open: true,
      loading: true,
      items: [],
      event,
    });
    try {
      const response = await eventService.getRegistrations(event.id);
      if (response.status === 200) {
        setRegistrationModal((prev) => ({
          ...prev,
          loading: false,
          items: response.data || [],
        }));
      } else {
        alert(response.data?.message || "Không thể tải danh sách đăng ký");
        setRegistrationModal((prev) => ({ ...prev, open: false }));
      }
    } catch (error) {
      console.error("Error loading registrations:", error);
      alert("Không thể tải danh sách đăng ký");
      setRegistrationModal((prev) => ({ ...prev, open: false }));
    }
  };

  const handleCloseRegistrations = () => {
    setRegistrationModal({
      open: false,
      loading: false,
      items: [],
      event: null,
    });
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, specialOnly]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (page === 1) {
        loadEvents();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleOpenModal = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setIsModalOpen(false);
  };

  const handleSaveEvent = async (data) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      if (data.description !== null && data.description !== undefined) {
        formData.append("description", data.description);
      }
      if (data.content !== null && data.content !== undefined) {
        formData.append("content", data.content);
      }
      if (data.location !== null && data.location !== undefined) {
        formData.append("location", data.location);
      }
      if (data.status) {
        formData.append("status", data.status);
      }
      if (data.start_time) {
        formData.append("start_time", data.start_time);
      }
      if (data.end_time) {
        formData.append("end_time", data.end_time);
      }
      if (data.image) {
        if (data.image instanceof File) {
          formData.append("file", data.image);
        } else if (typeof data.image === "string") {
          formData.append("image", data.image);
        }
      }
      formData.append("is_special", data.is_special ? "true" : "false");

      let response;
      if (data.id) {
        response = await eventService.update(data.id, formData);
      } else {
        response = await eventService.create(formData);
      }

      if (response.status === 200 || response.status === 201) {
        handleCloseModal();
        if (page !== 1) {
          setPage(1);
        } else {
          loadEvents();
        }
      } else {
        const message =
          response.data?.message || "Không thể lưu thông tin sự kiện";
        alert(message);
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Có lỗi xảy ra khi lưu sự kiện");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    const confirmDelete = window.confirm(
      "Bạn chắc chắn muốn xóa sự kiện này?",
    );
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const response = await eventService.delete(id);
      if (response.status === 200) {
        if (page !== 1) {
          setPage(1);
        } else {
          loadEvents();
        }
      } else {
        const message =
          response.data?.message || "Không thể xóa sự kiện ở thời điểm này";
        alert(message);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Có lỗi xảy ra khi xóa sự kiện");
    } finally {
      setLoading(false);
    }
  };

  const statusSummary = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        const key = event.status || "UNKNOWN";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { UPCOMING: 0, ONGOING: 0, COMPLETED: 0, CANCELLED: 0 },
    );
  }, [events]);

  const specialCount = useMemo(
    () => events.filter((event) => event.is_special).length,
    [events],
  );

  return (
    <div className="event-management">
      <div className="event-management-header">
        <div>
          <h1>Quản lý Sự kiện</h1>
          <p>Theo dõi tiến độ và cập nhật lịch sự kiện toàn hệ thống</p>
        </div>
        <button className="event-add-btn" onClick={() => handleOpenModal(null)}>
          <PlusCircle size={18} /> Tạo sự kiện
        </button>
      </div>

      <div className="event-stat-grid">
        {Object.entries(statusSummary).map(([key, value]) => {
          const style = STATUS_STYLES[key] || { label: key, className: "" };
          return (
            <div key={key} className={`event-stat-card ${style.className}`}>
              <span>{style.label}</span>
              <strong>{value}</strong>
            </div>
          );
        })}
        <div className="event-stat-card event-special-card">
          <span>Sự kiện đặc biệt</span>
          <strong>{specialCount}</strong>
        </div>
      </div>

      <div className="event-filters">
        <div className="event-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, địa điểm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <label className="event-special-filter">
          <input
            type="checkbox"
            checked={specialOnly}
            onChange={(e) => {
              setPage(1);
              setSpecialOnly(e.target.checked);
            }}
          />
          <span>Chỉ sự kiện đặc biệt</span>
        </label>
      </div>

      <div className="event-table-wrapper">
        {loading ? (
          <div className="event-loading">Đang tải dữ liệu...</div>
        ) : events.length === 0 ? (
          <div className="event-empty-state">
            <ImageIcon size={32} />
            <p>Chưa có sự kiện nào</p>
          </div>
        ) : (
          <table className="event-table">
            <thead>
              <tr>
                <th>Poster</th>
                <th>Thông tin</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Đăng ký</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const badge = STATUS_STYLES[event.status] || {
                  label: event.status || "Không xác định",
                  className: "",
                };
                return (
                  <tr key={event.id}>
                    <td>
                      {event.image ? (
                        <img
                          src={event.image}
                          alt={event.title}
                          className="event-thumb"
                          onError={(e) => (e.target.style.display = "none")}
                        />
                      ) : (
                        <div className="event-thumb-placeholder">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </td>
                    <td>
                      <p className="event-title">
                        {event.title}
                        {event.is_special && (
                          <span className="event-special-chip">Đặc biệt</span>
                        )}
                      </p>
                      <div className="event-meta">
                        <MapPin size={14} />
                        <span>{event.location || "Chưa xác định"}</span>
                      </div>
                      <p className="event-registrations">
                        Đã đăng ký: <strong>{event.registrations_count ?? 0}</strong>
                      </p>
                    </td>
                    <td>
                      <div className="event-time-info">
                        <CalendarDays size={14} />
                        <div>
                          <span>Bắt đầu: {formatDate(event.start_time)}</span>
                          <span>Kết thúc: {formatDate(event.end_time)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`event-status ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td>
                      <button
                        className="event-action-btn event-action-registrations"
                        onClick={() => handleViewRegistrations(event)}
                        title="Xem người đăng ký"
                      >
                        <Users size={16} />
                        <span className="event-registration-count">
                          {event.registrations_count ?? 0}
                        </span>
                      </button>
                    </td>
                    <td>
                      <div className="event-action-group">
                        <button
                          className="event-action-btn event-action-edit"
                          onClick={() => handleOpenModal(event)}
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          className="event-action-btn event-action-delete"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="event-pagination">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Trước
          </button>
          <span>
            Trang {page}/{totalPages} • {totalItems} sự kiện
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Sau
          </button>
        </div>
      )}

      {isModalOpen && (
        <EventModal
          title={selectedEvent ? "Cập nhật sự kiện" : "Tạo sự kiện"}
          onClose={handleCloseModal}
          onSave={handleSaveEvent}
          initialData={selectedEvent}
          isSaving={isSaving}
        />
      )}

      {registrationModal.open && (
        <div className="event-modal-overlay" onClick={handleCloseRegistrations}>
          <div className="event-registrations-modal" onClick={(e) => e.stopPropagation()}>
            <div className="event-registrations-header">
              <h2>
                Người đăng ký —{" "}
                {registrationModal.event?.title || "Sự kiện"}
              </h2>
              <button onClick={handleCloseRegistrations}>×</button>
            </div>
            {registrationModal.loading ? (
              <div className="event-registrations-loading">Đang tải...</div>
            ) : registrationModal.items.length === 0 ? (
              <div className="event-registrations-empty">
                Chưa có người đăng ký
              </div>
            ) : (
              <table className="event-registrations-table">
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>Số điện thoại</th>
                    <th>Ghi chú</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {registrationModal.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.full_name}</td>
                      <td>{item.email}</td>
                      <td>{item.phone}</td>
                      <td>{item.note || "-"}</td>
                      <td>
                        {new Date(item.created_at).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


