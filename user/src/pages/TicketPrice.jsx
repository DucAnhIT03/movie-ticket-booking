import React from "react";
import "../styles/style.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

const TicketPrice = () => {
  return (
    <>
      {/* HEADER */}
      <Header />

      {/* MAIN */}
      <section className="ticket-section">
        <h1 className="price">Giá vé</h1>
        <p className="subtitle">(Áp dụng từ ngày 01/06/2023)</p>

        {/* BẢNG GIÁ 2D */}
        <div className="ticket-table">
          <h2>1. GIÁ VÉ XEM PHIM 2D</h2>
          <table>
            <thead>
              <tr>
                <th rowSpan="2">Thời gian</th>
                <th colSpan="3">
                  Từ thứ 2 đến thứ 5
                  <br />
                  <span>From Monday to Thursday</span>
                </th>
                <th colSpan="3">
                  Thứ 6, 7, CN và ngày Lễ
                  <br />
                  <span>Friday, Saturday, Sunday &amp; public holiday</span>
                </th>
              </tr>
              <tr>
                <th>Ghế thường</th>
                <th className="vip">Ghế VIP</th>
                <th className="sweetbox">Ghế đôi</th>
                <th>Ghế thường</th>
                <th className="vip">Ghế VIP</th>
                <th className="sweetbox">Ghế đôi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Trước 12h
                  <br />
                  <span>Before 12PM</span>
                </td>
                <td>55.000đ</td>
                <td className="vip">65.000đ</td>
                <td className="sweetbox">140.000đ</td>
                <td>70.000đ</td>
                <td className="vip">80.000đ</td>
                <td className="sweetbox">170.000đ</td>
              </tr>
              <tr>
                <td>
                  12h - 17h
                  <br />
                  <span>From 12PM to before 5PM</span>
                </td>
                <td>70.000đ</td>
                <td className="vip">75.000đ</td>
                <td className="sweetbox">160.000đ</td>
                <td>80.000đ</td>
                <td className="vip">85.000đ</td>
                <td className="sweetbox">180.000đ</td>
              </tr>
              <tr>
                <td>
                  17h - 23h
                  <br />
                  <span>From 5PM to before 11PM</span>
                </td>
                <td>80.000đ</td>
                <td className="vip">85.000đ</td>
                <td className="sweetbox">180.000đ</td>
                <td>90.000đ</td>
                <td className="vip">95.000đ</td>
                <td className="sweetbox">200.000đ</td>
              </tr>
              <tr>
                <td>
                  Sau 23h
                  <br />
                  <span>After 11PM</span>
                </td>
                <td>65.000đ</td>
                <td className="vip">70.000đ</td>
                <td className="sweetbox">150.000đ</td>
                <td>75.000đ</td>
                <td className="vip">80.000đ</td>
                <td className="sweetbox">170.000đ</td>
              </tr>
            </tbody>
          </table>
          <p className="price-note">
            * Phim dài trên 150 phút phụ thu 10.000đ / vé
          </p>
        </div>

        {/* BẢNG GIÁ 3D */}
        <div className="ticket-table">
          <h2>2. GIÁ VÉ XEM PHIM 3D</h2>
          <table>
            <thead>
              <tr>
                <th rowSpan="2">Thời gian</th>
                <th colSpan="3">
                  Từ thứ 2 đến thứ 5
                  <br />
                  <span>From Monday to Thursday</span>
                </th>
                <th colSpan="3">
                  Thứ 6, 7, CN và ngày Lễ
                  <br />
                  <span>Friday, Saturday, Sunday &amp; public holiday</span>
                </th>
              </tr>
              <tr>
                <th>
                  Ghế thường
                  <br />
                  <span>Standard</span>
                </th>
                <th>
                  Ghế VIP
                  <br />
                  <span className="vip">VIP</span>
                </th>
                <th>
                  Ghế đôi
                  <br />
                  <span className="sweetbox">Sweetbox</span>
                </th>
                <th>
                  Ghế thường
                  <br />
                  <span>Standard</span>
                </th>
                <th>
                  Ghế VIP
                  <br />
                  <span className="vip">VIP</span>
                </th>
                <th>
                  Ghế đôi
                  <br />
                  <span className="sweetbox">Sweetbox</span>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>
                  Trước 12h
                  <br />
                  <span>Before 12PM</span>
                </td>
                <td>60.000đ</td>
                <td className="vip">80.000đ</td>
                <td className="sweetbox">160.000đ</td>
                <td>80.000đ</td>
                <td className="vip">100.000đ</td>
                <td className="sweetbox">200.000đ</td>
              </tr>
              <tr>
                <td>
                  Từ 12:00 đến trước 17:00
                  <br />
                  <span>From 12PM to before 5PM</span>
                </td>
                <td>80.000đ</td>
                <td className="vip">90.000đ</td>
                <td className="sweetbox">180.000đ</td>
                <td>100.000đ</td>
                <td className="vip">110.000đ</td>
                <td className="sweetbox">220.000đ</td>
              </tr>
              <tr>
                <td>
                  Từ 17:00 đến trước 23:00
                  <br />
                  <span>From 5PM to before 11PM</span>
                </td>
                <td>100.000đ</td>
                <td className="vip">110.000đ</td>
                <td className="sweetbox">220.000đ</td>
                <td>130.000đ</td>
                <td className="vip">140.000đ</td>
                <td className="sweetbox">280.000đ</td>
              </tr>
              <tr>
                <td>
                  Từ 23:00
                  <br />
                  <span>From 11PM</span>
                </td>
                <td>100.000đ</td>
                <td className="vip">110.000đ</td>
                <td className="sweetbox">220.000đ</td>
                <td>120.000đ</td>
                <td className="vip">130.000đ</td>
                <td className="sweetbox">260.000đ</td>
              </tr>
            </tbody>
          </table>
          <p className="price-note">
            * Đối với phim có thời lượng từ 150 phút trở lên: phụ thu 10.000 VND
            / vé
          </p>
        </div>

        {/* ƯU ĐÃI & QUY ĐỊNH */}
        <div className="priority">
          <p className="title">
            <strong>
              * Giá vé đối với các đối tượng khán giả ưu tiên (khi trực tiếp sử
              dụng dịch vụ xem phim tại rạp chiếu phim):{" "}
            </strong>
          </p>
          <ul>
            <li>
              Giảm 20% giá vé đối với: Trẻ em (người dưới 16 tuổi), người cao
              tuổi (từ 60 tuổi trở lên), người có công, người có hoàn cảnh đặc
              biệt khó khăn.
            </li>
            <li>Giảm 50% giá vé đối với: Người khuyết tật nặng.</li>
            <li>
              Giảm 100% giá vé đối với: Người khuyết tật đặc biệt nặng, trẻ em
              dưới 0.7m đi kèm với người lớn.
            </li>
          </ul>

          <h3>Điều kiện:</h3>
          <ul>
            <li>Chỉ áp dụng khi mua vé tại quầy (không áp dụng online).</li>
            <li>
              Cần xuất trình giấy tờ chứng minh khi mua vé và trước khi vào
              phòng chiếu. Cụ thể:
            </li>
            <li className="object">
              - Trẻ em: xuất trình “Thẻ học sinh”. Người cao tuổi: “CMND / CCCD”
            </li>
            <li className="object">
              - Người khuyết tật: “Giấy xác nhận khuyết tật”.
            </li>
            <li className="object">
              - Người có công: “Giấy chứng nhận người có công”.
            </li>
          </ul>

          <div className="rules">
            <p>
              <strong>
                * Ưu đãi cho học sinh, sinh viên từ 22 tuổi trở xuống: Đồng
                giá 55.000đ /vé 2D cho tất cả các suất chiếu phim từ Thứ 2 đến
                Thứ 6 (chỉ áp dụng cho hình thức mua vé trực tiếp tại quầy,
                không áp dụng với ghế đôi; Mỗi thẻ được mua 1 vé/ngày và vui
                lòng xuất trình thẻ U22 kèm thẻ HSSV khi mua vé)
              </strong>
            </p>

            <p>
              <strong>
                * Khán giả nghiêm túc thực hiện xem phim đúng độ tuổi theo phân
                loại phim: P, K, T13, T16, T18, C. (Trường hợp vi phạm sẽ xử
                phạt theo Quy định tại Nghị định 128/2022/NĐ-CP ngày
                30/12/2022).
              </strong>
            </p>

            <p>
              <strong>
                * Không bán vé cho trẻ em dưới 13 tuổi đối với phim kết thúc sau
                22h00, và dưới 16 tuổi đối với phim kết thúc sau 23h00.
              </strong>
            </p>

            <p>
              <strong>* Áp dụng giá vé ngày Lễ, Tết cho các ngày:</strong>
            </p>
            <ul>
              <li>
                Tết Nguyên Đán, Tết Dương Lịch, Giỗ Tổ Hùng Vương, 30/4, 1/5,
                2/9.
              </li>
              <li>14/2, 8/3, 24/12.</li>
              <li>Các ngày nghỉ bù trùng vào Thứ 7, CN.</li>
            </ul>

            <p>
              <strong>
                * Không áp dụng ưu đãi khác vào các ngày 20/10, 20/11, Halloween
                31/10, Lễ, Tết, suất chiếu sớm/đặc biệt.
              </strong>
            </p>

            <p>
              <strong>
                * Mua vé tập thể: Phòng Chiếu phim - (024) 35148647.
              </strong>
            </p>
            <p>
              <strong>
                * Thuê phòng tổ chức, quảng cáo: Phòng Dịch vụ - (024) 35142856.
              </strong>
            </p>

            <p className="warning">
              ĐỀ NGHỊ QUÝ KHÁN GIẢ LƯU Ý KHI MUA VÉ XEM PHIM (ĐẶC BIỆT KHI MUA
              VÉ ONLINE). TTCPQG KHÔNG CHẤP NHẬN HOÀN TIỀN HOẶC ĐỔI VÉ ĐÃ THANH
              TOÁN THÀNH CÔNG KHI MUA VÉ ONLINE VÀ VÉ MUA SAI QUY ĐỊNH TẠI QUẦY
              VÉ
            </p>

            <p>
              Rất mong Quý khán giả phối hợp thực hiện. <br />
              Xin trân trọng cảm ơn!
            </p>
          </div>
        </div>

        <br />
        <hr style={{ opacity: 0.1 }} />
        <div className="priority">
          <p className="title">
            <strong>
              * Ticket prices for priority audiences (when directly using cinema
              services at the theater):
            </strong>
          </p>
          <ul>
            <li>
              20% discount for: Children (under 16 years old), senior citizens
              (60 years old and above), people with meritorious services, and
              those with special difficult circumstances.
            </li>
            <li>50% discount for: People with severe disabilities.</li>
            <li>
              100% discount for: People with extremely severe disabilities, and
              children under 0.7m accompanied by adults.
            </li>
          </ul>

          <h3>Conditions:</h3>
          <ul>
            <li>
              Applicable only for purchases at the counter (not applicable
              online).
            </li>
            <li>
              Must present valid identification when purchasing and before
              entering the cinema hall. Specifically:
            </li>
            <li className="object">
              - Children: “Student ID”. Senior citizens: “Citizen ID / National
              ID”.
            </li>
            <li className="object">
              - People with disabilities: “Certificate of Disability”.
            </li>
            <li className="object">
              - People with meritorious services: “Certificate of Recognition”.
            </li>
          </ul>

          <div className="rules">
            <p>
              <strong>
                * Discount for students and youth under 22 years old: Flat price
                of 55,000 VND / 2D ticket for all screenings from Monday to
                Friday (only applicable for direct purchases at the counter, not
                valid for couple seats; each cardholder can buy 1 ticket/day and
                must present both the U22 card and student card when
                purchasing).
              </strong>
            </p>

            <p>
              <strong>
                * Audiences must strictly comply with the age classification for
                movies: P, K, T13, T16, T18, C. (Violations will be penalized
                according to Decree No. 128/2022/NĐ-CP dated December 30, 2022).
              </strong>
            </p>

            <p>
              <strong>
                * Tickets will not be sold to children under 13 for movies
                ending after 10:00 PM, and to children under 16 for movies
                ending after 11:00 PM.
              </strong>
            </p>

            <p>
              <strong>
                * Holiday ticket prices apply on the following days:
              </strong>
            </p>
            <ul>
              <li>
                Lunar New Year, New Year’s Day, Hung Kings’ Commemoration Day,
                April 30th, May 1st, and September 2nd.
              </li>
              <li>February 14th, March 8th, December 24th.</li>
              <li>Compensatory days off that fall on Saturday or Sunday.</li>
            </ul>

            <p>
              <strong>
                * No other promotions are applicable on October 20th, November
                20th, Halloween (October 31st), public holidays, Tet, or
                special/early screenings.
              </strong>
            </p>

            <p>
              <strong>
                * Group booking: Film Screening Department - (024) 35148647.
              </strong>
            </p>
            <p>
              <strong>
                * Venue rental & advertising: Service Department - (024)
                35142856.
              </strong>
            </p>

            <p className="warning">
              PLEASE NOTE WHEN PURCHASING MOVIE TICKETS (ESPECIALLY ONLINE
              PURCHASES). TTCPQG DOES NOT ACCEPT REFUNDS OR EXCHANGES FOR
              SUCCESSFULLY PAID ONLINE TICKETS OR TICKETS PURCHASED INCORRECTLY
              AT THE COUNTER.
            </p>

            <p>
              We sincerely ask for your understanding and cooperation. <br />
              Thank you very much!
            </p>
          </div>
        </div>

        <p className="line">
          ---------------------------------------------------------
        </p>
        {/* KẾT THÚC */}
        <section className="ticket-end">
          <p>
            - Mua vé xem phim tập thể, hợp đồng khoán gọn: <br />
            <strong className="movie-room">
              Phòng Chiếu phim - (024) 35148647
            </strong>
          </p>
          <p>
            - Thuê phòng tổ chức Hội nghị, quảng cáo: <br />
            Phòng Dịch vụ - (024) 35142856
          </p>
          <p>
            <strong>.TTCPQG</strong>
          </p>
        </section>
      </section>

      {/* FOOTER */}
      <Footer />
    </>
  );
};

export default TicketPrice;
