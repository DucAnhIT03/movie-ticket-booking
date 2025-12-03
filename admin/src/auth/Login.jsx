import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { updateInfo } from "../redux/counterSlice/userSlice";

import { MdEmail } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaCheckSquare, FaRegSquare } from "react-icons/fa";
import authService from "../services/auth/authService";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [check, setCheck] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await authService.login({ email, password });

      if (res.status === 401) {
        alert("Sai tài khoản hoặc mật khẩu!");
        setIsLoading(false);
        return;
      }

      if (res.status !== 200) {
        alert(res.data?.message || "Có lỗi xảy ra, thử lại sau!");
        setIsLoading(false);
        return;
      }

      const { user, accessToken } = res.data;
      const roleList = Array.isArray(user?.roles) ? user.roles : [];
      const isAdmin = roleList.includes("ROLE_ADMIN");
      const isEmployee = roleList.includes("ROLE_EMPLOYEE");

      if (!isAdmin && !isEmployee) {
        alert("Tài khoản của bạn không có quyền truy cập trang quản trị.");
        setIsLoading(false);
        return;
      }

      if (!accessToken) {
        alert("Không nhận được token từ server!");
        setIsLoading(false);
        return;
      }

      
      const userWithTheaterId = {
        ...user,
        theaterId: user.theaterId || user.theater_id || null
      };

      console.log("Login user data:", userWithTheaterId); 

      dispatch(updateInfo({
        token: accessToken,
        profile: userWithTheaterId
      }));

      localStorage.setItem("adminAccessToken", accessToken);
      localStorage.setItem("adminUser", JSON.stringify(userWithTheaterId));
      localStorage.setItem("adminIsLoggedIn", "true");

      alert(`Đăng nhập thành công! Chào ${user.firstName || user.email}!`);

      const targetPath = isEmployee && !isAdmin ? "/admin/seat_booking_view" : "/admin/dashboard";
      navigate(targetPath);
    } catch (error) {
      console.error("Login error:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
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
              <h3>Đăng nhập hệ thống quản trị</h3>
              <p>Vui lòng đăng nhập bằng tài khoản được cấp bởi hệ thống</p>
            </div>
          </div>

          <form onSubmit={handleLogin}>

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

            <button className="mainLogin" type="submit" disabled={isLoading}>
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

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

