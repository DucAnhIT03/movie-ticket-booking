import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../shared/layout/Header/Header.jsx";
import Footer from "../../../shared/layout/Footer/Footer.jsx";
import eventService from "../../../services/events/eventService";
import eventRegistrationService from "../../../services/events/eventRegistrationService";
import { events as mockEvents } from "../../../data/filmData";
import "./Events.css";

const FALLBACK_IMG = "/event.jpg";

const STATUS_LABELS = {
  UPCOMING: "Sắp diễn ra",
  ONGOING: "Đang diễn ra",
  COMPLETED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateRange = (start, end) => {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate) return "Đang cập nhật";

  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  const startLabel = startDate.toLocaleDateString("vi-VN", options);

  if (!endDate || startDate.toDateString() === endDate.toDateString()) {
    return startLabel;
  }

  const endLabel = endDate.toLocaleDateString("vi-VN", options);
  return `${startLabel} - ${endLabel}`;
};

const formatTimeRange = (start, end) => {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate) return "";
  const options = { hour: "2-digit", minute: "2-digit" };
  const startLabel = startDate.toLocaleTimeString("vi-VN", options);
  if (!endDate) return startLabel;
  const endLabel = endDate.toLocaleTimeString("vi-VN", options);
  return `${startLabel} - ${endLabel}`;
};

const normalizeEvents = (items = [], { isMock = false } = {}) =>
  items.map((evt) => ({
    id: evt.id,
    title: evt.title,
    description: evt.description,
    content: evt.content,
    image: evt.image,
    location: evt.location || "Trung tâm Chiếu phim Quốc gia",
    start_time: evt.start_time,
    end_time: evt.end_time,
    status: evt.status,
    tag: evt.is_special ? "Sự kiện đặc biệt" : STATUS_LABELS[evt.status] || "Sự kiện",
    isMock,
  }));

export default function Events() {
  const navigate = useNavigate();
  const [apiEvents, setApiEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registerModal, setRegisterModal] = useState({
    open: false,
    submitting: false,
    event: null,
    form: { full_name: "", email: "", phone: "", note: "" },
    errors: {},
    success: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await eventService.getAll({ page: 1, limit: 50 });
        if (!isMounted) return;
        if (response.status === 200) {
          const items = Array.isArray(response.data?.items)
            ? response.data.items
            : response.data?.data || [];
          const normalized = normalizeEvents(items, { isMock: false }).sort((a, b) => {
            const timeA = toDate(a.start_time)?.getTime() ?? Number.MAX_VALUE;
            const timeB = toDate(b.start_time)?.getTime() ?? Number.MAX_VALUE;
            return timeA - timeB;
          });
          setApiEvents(normalized);
        } else {
          setError(response.data?.message || "Không thể tải danh sách sự kiện");
          setApiEvents([]);
        }
      } catch (err) {
        console.error("Error fetching events:", err);
        if (isMounted) {
          setError("Không thể tải danh sách sự kiện. Vui lòng thử lại sau.");
          setApiEvents([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayEvents =
    apiEvents.length > 0
      ? apiEvents
      : normalizeEvents(mockEvents, { isMock: true });

  const usingMockData = apiEvents.length === 0;

  const highlight = useMemo(() => {
    if (displayEvents.length === 0) return null;
    const ongoing = displayEvents.find((evt) => evt.status === "ONGOING");
    return ongoing || displayEvents[0];
  }, [displayEvents]);

  const handleOpenRegister = (event) => {
    if (!event?.id || event.isMock) {
      alert("Chức năng đăng ký chỉ áp dụng cho sự kiện chính thức.");
      return;
    }
    setRegisterModal({
      open: true,
      submitting: false,
      event,
      success: "",
      errors: {},
      form: { full_name: "", email: "", phone: "", note: "" },
    });
  };

  const handleCloseRegister = () => {
    setRegisterModal({
      open: false,
      submitting: false,
      event: null,
      form: { full_name: "", email: "", phone: "", note: "" },
      errors: {},
      success: "",
    });
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterModal((prev) => ({
      ...prev,
      form: { ...prev.form, [name]: value },
    }));
  };

  const validateRegisterForm = (form) => {
    const errors = {};
    if (!form.full_name.trim()) {
      errors.full_name = "Vui lòng nhập họ tên";
    }
    if (!form.email.trim()) {
      errors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Email không hợp lệ";
    }
    if (!form.phone.trim()) {
      errors.phone = "Vui lòng nhập số điện thoại";
    }
    return errors;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerModal.event?.id) return;
    const errors = validateRegisterForm(registerModal.form);
    if (Object.keys(errors).length > 0) {
      setRegisterModal((prev) => ({ ...prev, errors }));
      return;
    }
    try {
      setRegisterModal((prev) => ({ ...prev, submitting: true, errors: {}, success: "" }));
      const response = await eventRegistrationService.register(registerModal.event.id, {
        full_name: registerModal.form.full_name.trim(),
        email: registerModal.form.email.trim(),
        phone: registerModal.form.phone.trim(),
        note: registerModal.form.note?.trim() || null,
      });
      if (response.status === 201 || response.status === 200) {
        setRegisterModal((prev) => ({
          ...prev,
          submitting: false,
          success: "Đăng ký thành công! Chúng tôi sẽ liên hệ sớm nhất.",
          form: { full_name: "", email: "", phone: "", note: "" },
        }));
      } else {
        const message = response.data?.message || "Không thể đăng ký vào thời điểm này.";
        setRegisterModal((prev) => ({
          ...prev,
          submitting: false,
          errors: { submit: message },
        }));
      }
    } catch (err) {
      console.error("Error register event:", err);
      setRegisterModal((prev) => ({
        ...prev,
        submitting: false,
        errors: { submit: "Đăng ký thất bại, vui lòng thử lại sau." },
      }));
    }
  };

  return (
    <div className="events-page">
      <Header />

      <main className="events-content">
        <section className="events-hero">
          <div className="events-hero__text">
            <p className="eyebrow">Sự kiện nổi bật</p>
            <h1>Không gian kết nối cộng đồng yêu điện ảnh</h1>
            <p className="subtitle">
              Cập nhật nhanh các hoạt động, workshop và chương trình ưu đãi đang diễn ra tại
              Trung tâm Chiếu phim Quốc gia. Các sự kiện đều hoàn toàn miễn phí vé tham gia.
            </p>
            <div className="hero-actions">
              <button
                type="button"
                className="hero-cta"
                onClick={() => navigate("/festival")}
              >
                Khám phá lễ hội phim
              </button>
              <button
                type="button"
                className="hero-ghost"
                onClick={() => {
                  const list = document.getElementById("events-list");
                  list?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Xem danh sách sự kiện
              </button>
            </div>
          </div>
          {highlight && (
            <div className="events-hero__card">
              <img
                src={highlight.image || highlight.img || FALLBACK_IMG}
                alt={highlight.title}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMG;
                }}
              />
              <div className="events-hero__info">
                <span className="pill">{highlight.tag}</span>
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
                <div className="info-row">
                  <span>{formatDateRange(highlight.start_time, highlight.end_time)}</span>
                  <span>{formatTimeRange(highlight.start_time, highlight.end_time)}</span>
                </div>
                <p className="info-location">{highlight.location}</p>
              </div>
            </div>
          )}
        </section>

        <section className="events-grid" id="events-list">
          {loading && apiEvents.length === 0 && (
            <div className="events-empty">Đang tải danh sách sự kiện...</div>
          )}

          {!loading && error && apiEvents.length === 0 && (
            <div className="events-empty">
              <p>{error}</p>
              <p>Hiển thị dữ liệu mô phỏng để bạn tham khảo.</p>
            </div>
          )}

          {displayEvents.map((event) => (
            <article className="event-card" key={event.id}>
              <div className="event-card__image">
                <img
                  src={event.image || event.img || FALLBACK_IMG}
                  alt={event.title}
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMG;
                  }}
                />
                <span className="pill">{event.tag}</span>
              </div>
              <div className="event-card__content">
                <p className="event-card__date">
                  {formatDateRange(event.start_time, event.end_time)}
                  {event.start_time && (
                    <>
                      {" "}
                      • {formatTimeRange(event.start_time, event.end_time)}
                    </>
                  )}
                </p>
                <h3>{event.title}</h3>
                <p className="event-card__desc">{event.description}</p>
                <div className="event-card__meta">
                  <span>{event.location}</span>
                </div>
                <div className="event-card__actions">
                  {!event.isMock && (
                    <button
                      type="button"
                      className="event-card__cta"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      Xem chi tiết
                    </button>
                  )}
                  <button
                    type="button"
                    className="event-card__cta event-card__cta--primary"
                    onClick={() => handleOpenRegister(event)}
                  >
                    Đăng ký tham dự
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <Footer />

      {registerModal.open && (
        <div className="event-register-overlay" onClick={handleCloseRegister}>
          <div className="event-register-modal" onClick={(e) => e.stopPropagation()}>
            <div className="event-register-header">
              <h2>Đăng ký tham dự — {registerModal.event?.title}</h2>
              <button onClick={handleCloseRegister}>×</button>
            </div>
            <form className="event-register-form" onSubmit={handleRegisterSubmit}>
              <label>
                Họ và tên *
                <input
                  type="text"
                  name="full_name"
                  value={registerModal.form.full_name}
                  onChange={handleRegisterChange}
                  required
                  disabled={registerModal.submitting}
                />
                {registerModal.errors.full_name && (
                  <span className="event-register-error">
                    {registerModal.errors.full_name}
                  </span>
                )}
              </label>
              <label>
                Email *
                <input
                  type="email"
                  name="email"
                  value={registerModal.form.email}
                  onChange={handleRegisterChange}
                  required
                  disabled={registerModal.submitting}
                />
                {registerModal.errors.email && (
                  <span className="event-register-error">
                    {registerModal.errors.email}
                  </span>
                )}
              </label>
              <label>
                Số điện thoại *
                <input
                  type="tel"
                  name="phone"
                  value={registerModal.form.phone}
                  onChange={handleRegisterChange}
                  required
                  disabled={registerModal.submitting}
                />
                {registerModal.errors.phone && (
                  <span className="event-register-error">
                    {registerModal.errors.phone}
                  </span>
                )}
              </label>
              <label>
                Ghi chú
                <textarea
                  name="note"
                  value={registerModal.form.note}
                  onChange={handleRegisterChange}
                  rows={4}
                  disabled={registerModal.submitting}
                />
              </label>
              {registerModal.errors.submit && (
                <div className="event-register-error">{registerModal.errors.submit}</div>
              )}
              {registerModal.success && (
                <div className="event-register-success">{registerModal.success}</div>
              )}
              <button
                type="submit"
                className="event-register-submit"
                disabled={registerModal.submitting}
              >
                {registerModal.submitting ? "Đang xử lý..." : "Gửi đăng ký"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


