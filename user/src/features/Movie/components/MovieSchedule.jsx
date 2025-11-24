import "./movie_schedule.css";

export default function MovieSchedule({
  dates = [],
  selectedDate,
  onDateSelect,
  showtimes = [],
  showtimesLoading = false,
  onSelectShowtime,
  theaters = [],
  selectedTheaterId = "",
  onSelectTheater,
}) {
  // Format showtimes thành mảng time strings
  const getShowtimeTimes = () => {
    if (!showtimes || showtimes.length === 0) return [];
    
    return showtimes
      .map(st => {
        if (!st.startTime) return null;
        const startTime = new Date(st.startTime);
        if (isNaN(startTime.getTime())) return null;
        
        const hours = String(startTime.getHours()).padStart(2, "0");
        const minutes = String(startTime.getMinutes()).padStart(2, "0");
        return {
          time: `${hours}:${minutes}`,
          id: st.id,
          showtime: st
        };
      })
      .filter(item => item !== null)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const showtimeTimes = getShowtimeTimes();

  const handleTimeClick = (showtimeObj) => {
    if (onSelectShowtime && showtimeObj) {
      onSelectShowtime(showtimeObj.id, showtimeObj.time);
    }
  };

  const theaterSelected = Boolean(selectedTheaterId);

  return (
    <section className="schedule">
      <div className="container">
        <div className="dates">
          {dates.map((dateObj) => {
            const isActive = selectedDate === dateObj.dateStr;
            return (
              <div
                key={dateObj.dateStr}
                className={`date ${isActive ? "active" : ""}`}
                onClick={() => onDateSelect && onDateSelect(dateObj.dateStr)}
                style={{ cursor: "pointer" }}
              >
                <p className="month">Th. {dateObj.month}</p>
                <h3>{dateObj.day}</h3>
                <p className="day">{dateObj.dayName}</p>
              </div>
            );
          })}
        </div>

        <p className="note">
          <strong>Lưu ý:</strong> Khán giả dưới 13 tuổi chỉ chọn suất chiếu kết
          thúc trước 22h và khán giả dưới 16 tuổi chỉ chọn suất chiếu kết thúc
          trước 23h.
        </p>

        <div className="theater-filter">
          <label htmlFor="theater-select">Chọn rạp:</label>
          <select
            id="theater-select"
            value={selectedTheaterId}
            onChange={(e) => onSelectTheater && onSelectTheater(e.target.value)}
          >
            {theaters.length === 0 ? (
              <option value="">Hiện chưa có rạp</option>
            ) : (
              <>
                <option value="">-- Chọn rạp --</option>
                {theaters.map((theater) => (
                  <option key={theater.id} value={theater.id}>
                    {theater.name}
                    {theater.location ? ` - ${theater.location}` : ""}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {showtimesLoading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#ccc" }}>
            <p>Đang tải lịch chiếu...</p>
          </div>
        ) : !theaterSelected ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
            <p>Vui lòng chọn rạp để xem lịch chiếu.</p>
          </div>
        ) : showtimeTimes.length > 0 ? (
          <div className="ticket-times">
            {showtimeTimes.map((showtimeObj) => (
              <button
                key={showtimeObj.id || showtimeObj.time}
                onClick={() => handleTimeClick(showtimeObj)}
              >
                {showtimeObj.time}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
            <p>Chưa có suất chiếu cho rạp này trong ngày này</p>
          </div>
        )}
      </div>
    </section>
  );
}
