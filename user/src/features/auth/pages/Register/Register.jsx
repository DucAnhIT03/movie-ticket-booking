import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdEmail } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import authService from "../../../../services/auth/authService";

import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Nhập thông tin, 2: Nhập OTP
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const redirectTo = () => navigate("/login");

  // Bước 1: Gửi OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!email || !firstName || !lastName || !phone || !password) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsLoading(true);
    const res = await authService.sendOtp(email);

    if (res.status !== 200) {
      alert(res.data.message || "Gửi OTP thất bại. Vui lòng thử lại!");
      setIsLoading(false);
      return;
    }

    alert("Mã OTP đã được gửi đến email của bạn!");
    setStep(2);
    setIsLoading(false);
    
    // Bắt đầu đếm ngược 60 giây
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Gửi lại OTP
  const handleResendOtp = async () => {
    if (countdown > 0) {
      alert(`Vui lòng đợi ${countdown} giây trước khi gửi lại OTP`);
      return;
    }

    setIsLoading(true);
    const res = await authService.sendOtp(email);

    if (res.status !== 200) {
      alert(res.data.message || "Gửi OTP thất bại. Vui lòng thử lại!");
      setIsLoading(false);
      return;
    }

    alert("Mã OTP mới đã được gửi đến email của bạn!");
    setCountdown(60);
    setIsLoading(false);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Bước 2: Xác thực OTP và đăng ký
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!otpCode || otpCode.length !== 6) {
      alert("Vui lòng nhập mã OTP 6 chữ số");
      return;
    }

    setIsLoading(true);

    // Verify OTP trước
    const verifyRes = await authService.verifyOtp(email, otpCode);
    if (verifyRes.status !== 200) {
      alert(verifyRes.data.message || "Mã OTP không hợp lệ hoặc đã hết hạn");
      setIsLoading(false);
      return;
    }

    // Đăng ký với OTP
    const payload = {
      firstName,
      lastName,
      email,
      phone,
      password,
      otpCode
    };

    const res = await authService.register(payload);

    if (res.status === 400) {
      alert(res.data.message || "Đăng ký thất bại");
      setIsLoading(false);
      return;
    }

    if (res.status !== 201) {
      alert("Server lỗi, vui lòng thử lại!");
      setIsLoading(false);
      return;
    }

    // Lưu token nếu có
    if (res.data.accessToken) {
      localStorage.setItem("accessToken", res.data.accessToken);
    }

    alert("Đăng ký thành công!");
    navigate("/login");
  };

  return (
    <div className="loginBackground">
      <div className="loginForm">
        <div className="credentialForm">

          <div className="loginHeader">
            <div className="logo">
              <img src="/logo.png" alt="" />
            </div>

            <div className="Welcome">
              <h3>Kính Chào Quý Khách!</h3>
              <p>Chúng tôi rất vui được phục vụ quý khách!</p>
            </div>
          </div>

          <div className="switchMode">
            <button
              onClick={redirectTo}
              className="signIn"
              style={{ backgroundColor: "white", color: "gray" }}
            >
              Đăng nhập
            </button>
            <button className="signUp" style={{ color: "white" }}>
              Đăng ký
            </button>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOtp}>
              <div className="credInput">
                <input
                  type="text"
                  placeholder="Họ"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="credInput">
                <input
                  type="text"
                  placeholder="Tên"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <div className="credInput">
                <input
                  type="text"
                  placeholder="Số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="credInput">
                <input
                  type="email"
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <MdEmail size={22} style={{ color: "#666" }} />
              </div>  

              <div className="credInput">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div
                  className="eyeIcon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEye size={22} /> : <FiEyeOff size={22} />}
                </div>
              </div>

              <button className="mainLogin" type="submit" disabled={isLoading}>
                {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
              </button>

              <div className="Line">
                <span>OR</span>
              </div>

              <div className="accountLink">
                <div className="apple">
                  <FaApple size={20} />
                  <p>Đăng nhập với Apple</p>
                </div>

                <div className="google">
                  <FcGoogle size={22} />
                  <p>Đăng nhập với Google</p>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: "20px", textAlign: "center" }}>
                <p style={{ color: "#666", fontSize: "14px" }}>
                  Mã OTP đã được gửi đến email: <strong>{email}</strong>
                </p>
              </div>

              <div className="credInput">
                <input
                  type="text"
                  placeholder="Nhập mã OTP (6 chữ số)"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  style={{ textAlign: "center", letterSpacing: "8px", fontSize: "20px", fontWeight: "bold" }}
                />
              </div>

              <div style={{ marginBottom: "15px", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || isLoading}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: countdown > 0 ? "#999" : "#2d4ef5",
                    cursor: countdown > 0 ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    textDecoration: "underline"
                  }}
                >
                  {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã OTP"}
                </button>
              </div>

              <button className="mainLogin" type="submit" disabled={isLoading}>
                {isLoading ? "Đang xử lý..." : "Xác nhận và đăng ký"}
              </button>

              <div style={{ marginTop: "15px", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#2d4ef5",
                    cursor: "pointer",
                    fontSize: "13px",
                    textDecoration: "underline"
                  }}
                >
                  Quay lại
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="decoration">
          <div className="copyright">
            <p>&copy; 2025 Gradiator Inc. All rights reserved.</p>
            <p>&copy;copy right by Hiepquat</p>
          </div>
        </div>
      </div>
    </div>
  );
}
