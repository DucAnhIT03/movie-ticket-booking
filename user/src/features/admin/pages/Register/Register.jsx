import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdEmail } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import "./Register.css";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const redirectTo = () => navigate("/admin/login");

    const Notification = () => {
        if (!email.includes("@")) {
            alert("Please enter a valid email!");
            return;
        }
        if (password.length < 6) {
            alert("Password must be at least 6 characters!");
            return;
        }

        alert("Register Successful!");
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
                        <button onClick={() => redirectTo()} className="signIn" style={{ backgroundColor: "white", color: "gray" }}>Đăng nhập</button>
                        <button className="signUp" style={{ color: "white" }}>Đăng ký</button>
                    </div>

                    <form>
                        <div className="credInput">
                            <input
                                type="email"
                                placeholder="Nhập email"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <MdEmail size={22} style={{ color: "#666" }} />
                        </div>

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


                        <button className="mainLogin" onClick={Notification}>Đăng ký</button>

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
