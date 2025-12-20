import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdEmail } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";
import authService from "../services/auth/authService";
import "./Auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  // Steps: 1 email -> 2 OTP -> 3 waiting admin -> 4 reset code + new password
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [requestStatus, setRequestStatus] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  // Polling để kiểm tra trạng thái duyệt của admin
  useEffect(() => {
    let timer;
    const pollStatus = async () => {
      if (!email) return;
      setIsPolling(true);
      try {
        const res = await authService.getResetStatus(email);
        if (res.status === 200) {
          const data = res.data || {};
          setRequestStatus(data.status || null);
          if (data.status === "APPROVED") {
            setMessage("Admin đã duyệt. Vui lòng kiểm tra email để lấy mã khôi phục 8 ký tự.");
            setStep(4);
            setIsPolling(false);
            return;
          }
        }
      } catch (error) {
        console.error("Polling reset status error:", error);
      }
    };

    if (step === 3) {
      pollStatus();
      timer = setInterval(pollStatus, 5000);
    }

    return () => {
      if (timer) clearInterval(timer);
      setIsPolling(false);
    };
  }, [step, email]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("Vui lòng nhập email");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await authService.forgotPassword(email);

      if (res.status !== 200) {
        setMessage(res.data?.message || "Gửi OTP thất bại. Vui lòng kiểm tra lại email hoặc liên hệ admin.");
      } else {
        setMessage("OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.");
        setStep(2);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setMessage("Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length !== 6) {
      setMessage("Vui lòng nhập mã OTP 6 chữ số");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await authService.verifyResetOtp(email, otpCode);

      if (res.status !== 200) {
        setMessage(res.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn");
      } else {
        setMessage("OTP hợp lệ! Yêu cầu của bạn đã được gửi đến admin. Vui lòng chờ admin duyệt và kiểm tra email để nhận mã khôi phục 8 ký tự.");
        setStep(3);
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setMessage("Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetCode.trim() || resetCode.length < 8) {
      setMessage("Vui lòng nhập mã khôi phục 8 ký tự");
      return;
    }
    if (!newPassword.trim() || newPassword.length < 8) {
      setMessage("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await authService.resetWithCode(email, resetCode, newPassword);

      if (res.status !== 200) {
        setMessage(res.data?.message || "Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã khôi phục.");
      } else {
        setMessage("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setMessage("Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginBackground" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div className="loginForm">
        <div className="credentialForm">

          <div className="loginHeader">
            <div className="logo">
              <img src="/logo.png" alt="" />
            </div>

            <div className="Welcome">
              <h3>Quên Mật Khẩu</h3>
              <p>Chức năng này dành cho nhân viên. Chúng tôi sẽ giúp bạn khôi phục tài khoản!</p>
            </div>
          </div>

          {message && (
            <div style={{
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "15px",
              backgroundColor: message.includes("thành công") || message.includes("đã được gửi") || message.includes("hợp lệ")
                ? "#d4edda"
                : "#f8d7da",
              color: message.includes("thành công") || message.includes("đã được gửi") || message.includes("hợp lệ")
                ? "#155724"
                : "#721c24",
              fontSize: "14px",
            }}>
              {message}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              {/* Email */}
              <div className="credInput">
                <input
                  type="email"
                  required
                  placeholder="Nhập email nhân viên"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <MdEmail size={22} style={{ color: "gray" }} />
              </div>

              <button className="mainLogin" type="submit" disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              {/* Email (disabled) */}
              <div className="credInput">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  disabled
                  style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
                />
                <MdEmail size={22} style={{ color: "gray" }} />
              </div>

              {/* OTP */}
              <div className="credInput">
                <input
                  type="text"
                  required
                  placeholder="Nhập mã OTP 6 chữ số"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  disabled={loading}
                />
              </div>

              <button className="mainLogin" type="submit" disabled={loading}>
                {loading ? "Đang xác thực..." : "Xác thực OTP"}
              </button>

              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtpCode("");
                    setMessage("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2d4ef5",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontSize: "14px",
                  }}
                >
                  Gửi lại OTP
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div>
              <div className="credInput" style={{ justifyContent: "center" }}>
                <span style={{ color: "#1f2937", fontWeight: 600 }}>Vui lòng chờ admin duyệt yêu cầu khôi phục mật khẩu...</span>
              </div>
              <div style={{ marginTop: "10px", color: "#6b7280", fontSize: "14px" }}>
                Sau khi admin duyệt, mã 8 ký tự sẽ được gửi vào email của bạn. Trang này sẽ tự cập nhật (tối đa mỗi 5s).
              </div>
              <div style={{ marginTop: "14px", display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="mainLogin"
                  onClick={() => setStep(2)}
                  style={{ background: "#e5e7eb", color: "#111827" }}
                >
                  Quay lại nhập OTP
                </button>
                <button
                  type="button"
                  className="mainLogin"
                  onClick={() => setStep(3)}
                  disabled={isPolling}
                >
                  {isPolling ? "Đang kiểm tra..." : "Kiểm tra ngay"}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <form onSubmit={handleResetPassword}>
              {/* Email (disabled) */}
              <div className="credInput">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  disabled
                  style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
                />
                <MdEmail size={22} style={{ color: "gray" }} />
              </div>

              {/* Reset Code */}
              <div className="credInput">
                <input
                  type="text"
                  required
                  placeholder="Nhập mã khôi phục 8 ký tự (từ email)"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.slice(0, 12))}
                  maxLength={12}
                  disabled={loading}
                />
              </div>

              {/* New Password */}
              <div className="credInput">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  disabled={loading}
                />
                <div className="eyeIcon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <FiEye size={22} />
                  ) : (
                    <FiEyeOff size={22} />
                  )}
                </div>
              </div>

              <button className="mainLogin" type="submit" disabled={loading}>
                {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
              </button>
            </form>
          )}

          <div className="subInput" style={{ marginTop: "20px" }}>
            <Link to="/login">Quay lại đăng nhập</Link>
          </div>

        </div>

        <div className="decoration">
          <div className="copyright">
            <p>&copy; 2025 Gradiator Inc. All rights reserved.</p>
            <p>&copy;copy right by Vhiepp.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

