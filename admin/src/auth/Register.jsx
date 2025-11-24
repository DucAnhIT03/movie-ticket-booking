import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdEmail } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import authService from "../services/auth/authService";

import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = () => navigate("/login");

  const handleRegister = async (e) => {
    e.preventDefault();

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      password
    };

    const res = await authService.register(payload);

    if (res.status === 400) {
      alert(res.data.message || "Đăng ký thất bại");
      return;
    }

    if (res.status !== 201) {
      alert("Server lỗi, vui lòng thử lại!");
      return;
    }

    alert("Đăng ký thành công!");
    navigate("/admin/login");
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

          <form onSubmit={handleRegister}>
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

            <button className="mainLogin" type="submit">
              Đăng ký
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
