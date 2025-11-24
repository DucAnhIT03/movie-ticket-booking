import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { updateInfo } from "../../../../redux/counterSlice/userSlice";

import { MdEmail } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaCheckSquare, FaRegSquare, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import "./Login.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [check, setCheck] = useState(false);

  const redirectTo = () => navigate("/admin/register");

  const Notification = (e) => {
    e.preventDefault();

    const adminEmail = "admin@gmail.com";
    const adminPassword = "123456";

    if (email !== adminEmail || password !== adminPassword) {
      alert("Sai tài khoản hoặc mật khẩu. Vui lòng thử lại");
      return;
    }

    dispatch(updateInfo({ userEmail: email, password: password }));
    alert(`Welcome, ${email}!`);
    navigate("/");
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
              <h3>Kính Chào Quý Khách!</h3>
              <p>Chúng tôi rất vui được phục vụ quý khách!</p>
            </div>
          </div>

          <div className="switchMode">
            <button className="signIn">Đăng nhập</button>
            <button onClick={redirectTo} className="signUp" style={{ backgroundColor: "white" }}>
              Đăng ký
            </button>
          </div>

          <form onSubmit={Notification}>

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

            {/* Password */}
            <div className="credInput">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="eyeIcon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <FiEye size={22} />
                ) : (
                  <FiEyeOff size={22} />
                )}
              </div>
            </div>

            {/* Remember me */}
            <div className="subInput">
              <div className="remember-me" onClick={() => setCheck(!check)} style={{ cursor: "pointer" }}>
                {check ? <FaCheckSquare size={18} /> : <FaRegSquare size={18} />}
                <p>Ghi nhớ tôi</p>
              </div>

              <Link to="#">Bạn quên mật khẩu?</Link>
            </div>

            <button className="mainLogin" type="submit">Đăng nhập</button>

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
            <p>&copy;copy right by Vhiepp.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
