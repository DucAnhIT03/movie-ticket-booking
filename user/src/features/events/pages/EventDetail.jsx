import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../../shared/layout/Header/Header.jsx";
import Footer from "../../../shared/layout/Footer/Footer.jsx";
import eventService from "../../../services/events/eventService";
import eventRegistrationService from "../../../services/events/eventRegistrationService";
import "./EventDetail.css";

const FALLBACK_IMG = "/event.jpg";

const STATUS_TEXT = {
  UPCOMING: "Sắp diễn ra",
  ONGOING: "Đang diễn ra",
  COMPLETED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
};

const formatDate = (value, options) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("vi-VN", options);
};

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registerModal, setRegisterModal] = useState({
    open: false,
    submitting: false,
    form: { full_name: "", email: "", phone: "", note: "" },
    errors: {},
    success: "",
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await eventService.getById(id);
        if (response.status === 200) {
          setEvent(response.data);
          setError("");
        } else {
          setError(response.data?.message || "Không tìm thấy sự kiện");
        }
      } catch (err) {
        console.error("Error loading event detail:", err);
        setError("Không thể tải sự kiện. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  const handleOpenRegister = () => {
    if (!event?.id) return;
    setRegisterModal({
      open: true,
      submitting: false,
      form: { full_name: "", email: "", phone: "", note: "" },
      errors: {},
      success: "",
    });
  };

  const handleCloseRegister = () => {
    setRegisterModal({
      open: false,
      submitting: false,
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

  const validateForm = () => {
    const errors = {};
    const { full_name, email, phone } = registerModal.form;
    if (!full_name.trim()) errors.full_name = "Vui lòng nhập họ tên";
    if (!email.trim()) errors.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Email không hợp lệ";
    if (!phone.trim()) errors.phone = "Vui lòng nhập số điện thoại";
    return errors;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length) {
      setRegisterModal((prev) => ({ ...prev, errors }));
      return;
    }
    try {
      setRegisterModal((prev) => ({ ...prev, submitting: true, errors: {}, success: "" }));
      const response = await eventRegistrationService.register(event.id, {
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
        setRegisterModal((prev) => ({
          ...prev,
          submitting: false,
          errors: { submit: response.data?.message || "Không thể đăng ký." },
        }));
      }
    } catch (err) {
      console.error("Register error:", err);
      setRegisterModal((prev) => ({
        ...prev,
        submitting: false,
        errors: { submit: "Đăng ký thất bại, vui lòng thử lại." },
      }));
    }
  };

  return (
    <div className="event-detail-page">
      <Header />
      <main className="event-detail-content">
        {loading ? (
          <div className="event-detail-state">Đang tải...</div>
        ) : error ? (
          <div className="event-detail-state">{error}</div>
        ) : event ? (
          <>
            <button className="event-detail-back" onClick={() => navigate(-1)}>
              ← Quay lại
            </button>
            <section className="event-detail-hero">
              <div className="event-detail-cover">
                <img
                  src={event.image || FALLBACK_IMG}
                  alt={event.title}
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMG;
                  }}
                />
              </div>
              <div className="event-detail-hero__info">
                <span className="pill">
                  {event.is_special ? "Sự kiện đặc biệt" : STATUS_TEXT[event.status]}
                </span>
                <h1>{event.title}</h1>
                <p className="event-detail-times">
                  {formatDate(event.start_time, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                  {" - "}
                  {formatDate(event.end_time, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                  <br />
                  {formatDate(event.start_time, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" - "}
                  {formatDate(event.end_time, { hour: "2-digit", minute: "2-digit" })}
                </p>
                {event.location && <p className="event-detail-location">{event.location}</p>}
                <div className="event-detail-actions">
                  <button className="event-detail-register" onClick={handleOpenRegister}>
                    Đăng ký tham dự
                  </button>
                </div>
              </div>
            </section>

            <section className="event-detail-article">
              <h2>Nội dung sự kiện</h2>
              {event.content ? (
                <div
                  className="event-detail-article__body"
                  dangerouslySetInnerHTML={{ __html: event.content }}
                />
              ) : (
                <p>Đang cập nhật bài viết chi tiết.</p>
              )}
            </section>
          </>
        ) : null}
      </main>
      <Footer />

      {registerModal.open && (
        <div className="event-register-overlay" onClick={handleCloseRegister}>
          <div className="event-register-modal" onClick={(e) => e.stopPropagation()}>
            <div className="event-register-header">
              <h2>Đăng ký tham dự — {event?.title}</h2>
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


