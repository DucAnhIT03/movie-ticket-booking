import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/tkp.css";
import room from "../assets/room.png";
import { FaTimes } from "react-icons/fa";

export default function ChooseSeat() {
  const [selected, setSelected] = useState([]);
  const [showtime, setShowtime] = useState("18:00");
  const seatPrice = 90000;

  useEffect(() => {
    const savedTime = localStorage.getItem("selectedTime");
    if (savedTime) setShowtime(savedTime);
  }, []);

  const toggleSeat = (seat) => {
    setSelected((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]
    );
  };

  const [seats, setSeats] = useState([]);

  useEffect(() => {
    const generatedSeats = [];
    for (let row = 65; row <= 75; row++) {
      const rowSeats = [];
      for (let i = 1; i <= 15; i++) {
        const seatCode = String.fromCharCode(row) + i;
        const booked = Math.random() < 0.1; // giả lập 10% ghế đã đặt
        rowSeats.push({ seatCode, booked });
      }
      generatedSeats.push(rowSeats);
    }
    setSeats(generatedSeats);
  }, []);

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
              kết thúc trước 22h và khán giả dưới 16 tuổi chỉ chọn suất chiếu
              kết thúc trước 23h.
            </p>

            <div className="times">
              {["18:00", "19:35", "20:05", "21:00", "22:10", "23:15"].map(
                (t) => (
                  <button key={t} onClick={() => goToChooseTicket(t)}>
                    {t}
                  </button>
                )
              )}
            </div>
          </div>
        </section>
      </section>
      <section className="seat-section">
        <div className="container">
          <div className="seat-header">
            <p>
              Giờ chiếu: <strong>{showtime}</strong>
            </p>

            <p className="seat-picker">Thời gian chọn ghế: 10:00</p>
          </div>

          <div className="screen">
            <img src={room} alt="room" />
          </div>

          <h2>Phòng chiếu số 2</h2>
          <br />
          <div className="seat-grid">
            {seats.map((row, idx) => (
              <div className="seat-row" key={idx}>
                {row.map(({ seatCode, booked }) => (
                  <button
                    key={seatCode}
                    className={`seat ${booked ? "booked" : "normal"} ${
                      selected.includes(seatCode) ? "selected" : ""
                    }`}
                    onClick={() => !booked && toggleSeat(seatCode)}
                  >
                    {booked ? <FaTimes size={16} /> : seatCode}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="legend">
            <div className="legend-item">
              <span className="seat booked">
                <FaTimes size={16} />
              </span>
              <span>Đã đặt</span>
            </div>
            <div className="legend-item">
              <span className="seat selected"></span>
              <span>Ghế bạn chọn</span>
            </div>
            <div className="legend-item">
              <span className="seat normal"></span>
              <span>Ghế thường</span>
            </div>
            <div className="legend-item">
              <span className="seat vip"></span>
              <span>Ghế VIP</span>
            </div>
            <div className="legend-item">
              <span className="seat double"></span>
              <span>Ghế đôi</span>
            </div>
          </div>

          <div className="summary">
            <div className="aaa">
              <p>
                Ghế đã chọn: <span>{selected.join(", ") || "Chưa chọn"}</span>
              </p>
              <p>
                Tổng tiền:{" "}
                <span>
                  {(selected.length * seatPrice).toLocaleString("vi-VN")}đ
                </span>
              </p>
            </div>
            <div className="actions">
              <button
                className="button btn-outline"
                onClick={() => history.back()}
              >
                Quay lại
              </button>
              <button className="button btn-red">Thanh toán</button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
