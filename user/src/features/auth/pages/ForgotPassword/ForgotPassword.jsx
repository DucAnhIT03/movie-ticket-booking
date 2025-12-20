import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdEmail } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";
import authService from "../../../../services/auth/authService";
import "./ForgotPassword.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [requestId, setRequestId] = useState(null);
  const [infoMessage, setInfoMessage] = useState("");
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP, 3: nhập mã 8 ký tự + mật khẩu mới
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setInfoMessage("");
    setRequestId(null);
    setResetCode("");

    const res = await authService.forgotPassword(email);

    if (res.status !== 200) {
      alert(res.data?.message || "Gửi OTP thất bại");
    } else {
      alert("OTP đã được gửi đến email của bạn");
      setStep(2);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await authService.verifyResetOtp(email, otpCode);

    if (res.status !== 200) {
      alert(res.data?.message || "OTP không hợp lệ hoặc đã hết hạn");
    } else {
      const reqId = res.data?.requestId;
      setRequestId(reqId || null);
      setInfoMessage("OTP hợp lệ. Vui lòng chờ admin xác nhận để nhận mã 8 ký tự qua email.");
      setStep(3);
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await authService.resetWithCode(email, resetCode, newPassword);

    if (res.status !== 200) {
      alert(res.data?.message || "Đặt lại mật khẩu thất bại");
    } else {
      alert("Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.");
      navigate("/login");
    }
    setLoading(false);
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
              <p>Chúng tôi sẽ giúp bạn khôi phục tài khoản!</p>
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              {/* Email */}
              <div className="credInput">
                <input
                  type="email"
                  required
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              {/* Email */}
              <div className="credInput">
                <input
                  type="email"
                  required
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                />
                <MdEmail size={22} style={{ color: "gray" }} />
              </div>

              {/* OTP 6 số */}
              <div className="credInput">
                <input
                  type="text"
                  required
                  placeholder="Nhập mã OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                />
              </div>

              {infoMessage && (
                <div style={{ color: "#10b981", fontSize: "14px", marginBottom: "8px" }}>
                  {infoMessage}
                </div>
              )}

              <button className="mainLogin" type="submit" disabled={loading}>
                {loading ? "Đang xác thực..." : "Xác thực OTP"}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              {/* Email */}
              <div className="credInput">
                <input
                  type="email"
                  required
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                />
                <MdEmail size={22} style={{ color: "gray" }} />
              </div>

              <div style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "10px" }}>
                Mã 8 ký tự sẽ được gửi khi admin xác nhận yêu cầu{requestId ? ` (Mã yêu cầu #${requestId})` : ""}.
              </div>

              {/* Mã khôi phục 8 ký tự */}
              <div className="credInput">
                <input
                  type="text"
                  required
                  placeholder="Nhập mã 8 ký tự từ email"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  minLength={8}
                  maxLength={12}
                />
              </div>

              {/* Mật khẩu mới */}
              <div className="credInput">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
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

          <div className="subInput">
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