import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { updateInfo } from "../../../../redux/counterSlice/userSlice";

import { MdEmail } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaCheckSquare, FaRegSquare, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import authService from "../../../../services/auth/authService";

import "./Login.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [check, setCheck] = useState(false);

  const redirectTo = () => navigate("/register");

  const handleLogin = async (e) => {
    e.preventDefault();

    const payload = {
      email,
      password
    };

    const res = await authService.login(payload);

    if (res.status === 401) {
      const errorMessage = res.data?.message || res.data?.error || "Sai tài khoản hoặc mật khẩu. Vui lòng thử lại";
      alert(errorMessage);
      return;
    }

    if (res.status !== 200) {
      alert("Server lỗi, vui lòng thử lại!");
      return;
    }

   
    if (res.data.accessToken) {
      localStorage.setItem("accessToken", res.data.accessToken);
      if (check) {
        localStorage.setItem("userEmail", email);
      }
    }

    if (res.data.user) {
      const userData = {
        userEmail: res.data.user.email,
        user: res.data.user
      };
      dispatch(updateInfo(userData));
      
      localStorage.setItem("infoState", JSON.stringify(userData));
    }

    alert(`Chào mừng, ${res.data.user?.firstName || email}!`);
    navigate("/");
    window.location.reload(); 
  };

  
  const handleGoogleLogin = async () => {
    try {
      
      if (typeof window.google === 'undefined' || !window.google.accounts) {
        alert('Google Sign-In chưa được tải. Vui lòng thử lại sau.');
        return;
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        alert('Google Client ID chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
        return;
      }

      
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            
            const res = await authService.loginWithGoogle(response.credential);
            
            if (res.status === 401) {
              const errorMessage = res.data?.message || "Đăng nhập Google thất bại";
              alert(errorMessage);
              return;
            }

            if (res.status !== 200) {
              alert("Server lỗi, vui lòng thử lại!");
              return;
            }

           
            if (res.data.accessToken) {
              localStorage.setItem("accessToken", res.data.accessToken);
            }

            if (res.data.user) {
              const userData = {
                userEmail: res.data.user.email,
                user: res.data.user
              };
              dispatch(updateInfo(userData));
              localStorage.setItem("infoState", JSON.stringify(userData));
            }

            alert(`Chào mừng, ${res.data.user?.firstName || res.data.user?.email}!`);
            navigate("/");
            window.location.reload();
          } catch (error) {
            console.error('Google login error:', error);
            alert('Đăng nhập Google thất bại. Vui lòng thử lại.');
          }
        }
      });

     
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
       
          window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile',
            callback: async (tokenResponse) => {
              try {
             
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                  headers: {
                    'Authorization': `Bearer ${tokenResponse.access_token}`
                  }
                });
                const userInfo = await userInfoResponse.json();
                
                const res = await authService.loginWithGoogle(tokenResponse.access_token);
                
                if (res.status === 401) {
                  const errorMessage = res.data?.message || "Đăng nhập Google thất bại";
                  alert(errorMessage);
                  return;
                }

                if (res.status !== 200) {
                  alert("Server lỗi, vui lòng thử lại!");
                  return;
                }

                if (res.data.accessToken) {
                  localStorage.setItem("accessToken", res.data.accessToken);
                }

                if (res.data.user) {
                  const userData = {
                    userEmail: res.data.user.email,
                    user: res.data.user
                  };
                  dispatch(updateInfo(userData));
                  localStorage.setItem("infoState", JSON.stringify(userData));
                }

                alert(`Chào mừng, ${res.data.user?.firstName || res.data.user?.email}!`);
                navigate("/");
                window.location.reload();
              } catch (error) {
                console.error('Google login error:', error);
                alert('Đăng nhập Google thất bại. Vui lòng thử lại.');
              }
            }
          }).requestAccessToken();
        }
      });
    } catch (error) {
      console.error('Google Sign-In error:', error);
      alert('Không thể khởi tạo Google Sign-In. Vui lòng kiểm tra cấu hình.');
    }
  };

  const handleAppleLogin = async () => {
    try {
      
      if (typeof window.AppleID === 'undefined') {
        alert('Apple Sign-In chưa được tải. Vui lòng thử lại sau.');
        return;
      }

      window.AppleID.auth.init({
        clientId: import.meta.env.VITE_APPLE_CLIENT_ID || '',
        scope: 'name email',
        redirectURI: window.location.origin,
        usePopup: true,
      });

      window.AppleID.auth.signIn({
        requestedScopes: ['name', 'email'],
      }, async (response) => {
        try {
          if (response.error) {
            alert('Đăng nhập Apple thất bại: ' + response.error);
            return;
          }

          const res = await authService.loginWithApple(
            response.id_token,
            response.user?.user || '',
            response.user?.email || '',
            response.user?.name ? 
              `${response.user.name.firstName || ''} ${response.user.name.lastName || ''}`.trim() : 
              ''
          );

          if (res.status === 401) {
            const errorMessage = res.data?.message || "Đăng nhập Apple thất bại";
            alert(errorMessage);
            return;
          }

          if (res.status !== 200) {
            alert("Server lỗi, vui lòng thử lại!");
            return;
          }

         
          if (res.data.accessToken) {
            localStorage.setItem("accessToken", res.data.accessToken);
          }

          if (res.data.user) {
            const userData = {
              userEmail: res.data.user.email,
              user: res.data.user
            };
            dispatch(updateInfo(userData));
            localStorage.setItem("infoState", JSON.stringify(userData));
          }

          alert(`Chào mừng, ${res.data.user?.firstName || res.data.user?.email}!`);
          navigate("/");
          window.location.reload();
        } catch (error) {
          console.error('Apple login error:', error);
          alert('Đăng nhập Apple thất bại. Vui lòng thử lại.');
        }
      });
    } catch (error) {
      console.error('Apple Sign-In error:', error);
      alert('Không thể khởi tạo Apple Sign-In. Vui lòng kiểm tra cấu hình.');
    }
  };


  useEffect(() => {
    
    const googleScript = document.createElement('script');
    googleScript.src = 'https://accounts.google.com/gsi/client';
    googleScript.async = true;
    googleScript.defer = true;
    document.body.appendChild(googleScript);

    // Load Apple Sign-In
    const appleScript = document.createElement('script');
    appleScript.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    appleScript.async = true;
    document.body.appendChild(appleScript);

    return () => {
      // Cleanup
      if (document.body.contains(googleScript)) {
        document.body.removeChild(googleScript);
      }
      if (document.body.contains(appleScript)) {
        document.body.removeChild(appleScript);
      }
    };
  }, []);

  return (
    <div className="loginBackground login-page" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
            <button className="signIn" style={{ background: '#2d4ef5', color: '#fff' }}>Đăng nhập</button>
            <button onClick={redirectTo} className="signUp" style={{ background: 'transparent', color: '#555' }}>
              Đăng ký
            </button>
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

              <Link to="/forgot-password">Bạn quên mật khẩu?</Link>
            </div>

            <button className="mainLogin" type="submit">Đăng nhập</button>

            <div className="Line">
              <span>OR</span>
            </div>

            <div className="accountLink">
              <div className="apple" onClick={handleAppleLogin} style={{ cursor: 'pointer' }}>
                <FaApple size={20} />
                <p>Đăng nhập với Apple</p>
              </div>

              <div className="google" onClick={handleGoogleLogin} style={{ cursor: 'pointer' }}>
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

