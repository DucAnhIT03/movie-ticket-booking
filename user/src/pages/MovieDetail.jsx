import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

export default function MovieDetail() {
  const navigate = useNavigate();

  const goToChooseTicket = (time) => {
    localStorage.setItem("selectedTime", time);
    navigate("/choose-seat");
  };

  return (
    <>
      <Header />
      <section className="hero">
        <div className="overlay"></div>
        <div className="container hero-content">
          <div className="poster">
            <img
              src="/src/assets/cuoixuyenbiengioi.png"
              alt="Cười Xuyên Biên Giới"
            />
          </div>
          <div className="movie-info">
            <h1>
              CƯỜI XUYÊN BIÊN GIỚI - T13 <span className="tag">2D</span>
            </h1>
            <p className="meta">
              Hài &nbsp; | &nbsp; Hàn Quốc &nbsp; | &nbsp; 113 phút
              &nbsp;&nbsp;&nbsp; Đạo diễn: <strong>KIM Chang-ju</strong>
            </p>
            <p className="cast">
              Diễn viên: Ryu Seung-ryong, Jin Sun-kyu, Igor Rafael PEDROSO, Luan
              B RUM DE ABREU E LIMA, JB João Batista GOMES DE OLIVEIRA, Yeom
              Hye-ran và Go Kyoung-pyo, Lee Soon-won
            </p>
            <p>Khởi chiếu: 15/11/2024</p>
            <p className="desc">
              Cười Xuyên Biên Giới kể về hành trình của Jin-bong (Ryu
              Seung-ryong) - cựu vô địch bắn cung quốc gia, sau khi nghỉ hưu,
              anh đã trở thành một nhân viên văn phòng bình thường. Đứng trước
              nguy cơ bị sa thải, Jin-bong phải nhận một nhiệm vụ bất khả thi là
              bay đến nửa kia của trái đất trong nỗ lực tuyệt vọng để sinh tồn.
            </p>
            <p className="rating">
              <span className="highlight">
                Kiểm duyệt: T13 - PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI XEM TỪ ĐỦ 13 TUỔI
                TRỞ LÊN (13+)
              </span>
            </p>
            <div className="actions">
              <button className="button btn-outline">Chi tiết nội dung</button>
              <button className="button btn-yellow">Xem trailer</button>
            </div>
          </div>
        </div>
      </section>

      <section className="schedule">
        <div className="container">
          <div className="dates">
            <div className="date active">
              <p className="month">Th. 11</p>
              <h3>13</h3>
              <p className="day">Thứ tư</p>
            </div>
            <div className="date">
              <p className="month">Th. 11</p>
              <h3>14</h3>
              <p className="day">Thứ năm</p>
            </div>
          </div>

          <p className="note">
            <strong>Lưu ý:</strong> Khán giả dưới 13 tuổi chỉ chọn suất chiếu
            kết thúc trước 22h và khán giả dưới 16 tuổi chỉ chọn suất chiếu kết
            thúc trước 23h.
          </p>

          <div className="times">
            {["18:00", "19:35", "20:05", "21:00", "22:10", "23:15"].map((t) => (
              <button key={t} onClick={() => goToChooseTicket(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
