export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-links">
          <a href="#">Chính sách</a>
          <a href="#">Lịch chiếu</a>
          <a href="#">Tin tức</a>
          <a href="#">Giá vé</a>
          <a href="#">Hỏi đáp</a>
          <a href="#">Liên hệ</a>
        </div>

        <div className="social-icons">
          <img src="./src/assets/fb.png" alt="Facebook" />
          <img src="./src/assets/zalo.png" alt="Zalo" />
          <img src="./src/assets/ytb.png" alt="YouTube" />
          <img
            src="./src/assets/ggpl.png"alt="Google Play"
            className="store"
          />
          <img
            src="./src/assets/as.png"
            alt="App Store"
            className="store"
          />
          <img src="./src/assets/logoBCT.png" alt="Đã thông báo Bộ Công Thương" className="gov" />
        </div>

        <div className="footer-info">
          <p>
            Cơ quan chủ quản: BỘ VĂN HÓA, THỂ THAO VÀ DU LỊCH
          </p>
          <p>Bản quyền thuộc Trung tâm Chiếu phim Quốc gia.</p>
          <p>
            Giấy phép số: 224/GP-TTĐT ngày 31/8/2010 - Chịu trách nhiệm:{" "}
            Vũ Đức Tùng – Giám đốc.
          </p>
          <p>
            Địa chỉ: 87 Láng Hạ, Quận Ba Đình, Tp. Hà Nội - Điện thoại:{" "}
            024.35141791
          </p>
          <p>© 2023 By NCC - All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}