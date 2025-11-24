import { Link } from "react-router-dom";

export default function Header() {
  return (
    <div className="header">
      <div className="menu">
        <img src="/src/assets/logo.png" alt="logo" />
        <nav className="nav">
          <Link to="/">Trang chủ</Link>
          <Link to="#">Lịch chiếu</Link>
          <Link to="#">Tin tức</Link>
          <Link to="#">Khuyến mãi</Link>
          <Link to="/ticket-price">Giá vé</Link>
          <Link to="#">Liên hoan phim</Link>
        </nav>
      </div>

      <div className="btn">
        <button className="register">Đăng kí</button>
        <button className="login">Đăng nhập</button>
      </div>
    </div>
  );
}
