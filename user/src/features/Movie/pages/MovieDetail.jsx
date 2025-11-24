import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../../shared/layout/Header/Header";
import Footer from "../../../shared/layout/Footer/Footer";
import MovieInfo from "../components/MovieInfo";
import MovieSchedule from "../components/MovieSchedule";
import "./movie_detail.css";
import movieService from "../../../services/movies/movieService";
import showtimeService from "../../../services/showtimes/showtimeService";

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [availableTheaters, setAvailableTheaters] = useState([]);
  const [selectedTheaterId, setSelectedTheaterId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showtimesLoading, setShowtimesLoading] = useState(false);
  const timezoneOffset = useMemo(() => new Date().getTimezoneOffset(), []);

  // Fetch thông tin phim
  useEffect(() => {
    if (!id) return;

    const fetchMovie = async () => {
      setLoading(true);
      try {
        const response = await movieService.getMovieById(id);
        if (response.status === 200 && response.data) {
          setMovie(response.data);
        } else {
          setError("Không tìm thấy phim");
        }
      } catch (err) {
        console.error("Error fetching movie:", err);
        setError("Lỗi khi tải thông tin phim");
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  // Tạo danh sách 5 ngày kể từ hôm nay
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      dates.push({
        dateStr: `${day}-${month}-${year}`,
        date: date,
        day: day,
        month: month,
        year: year,
        dayName: getDayName(date.getDay())
      });
    }
    
    return dates;
  };

  const getDayName = (dayIndex) => {
    const days = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    return days[dayIndex];
  };

  const dates = getAvailableDates();
  
  // Set ngày mặc định
  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0].dateStr);
    }
  }, []);

  // Convert date từ DD-MM-YYYY sang YYYY-MM-DD
  const convertDateToAPIFormat = (dateStr) => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };

  // Fetch showtimes theo ngày đã chọn
  useEffect(() => {
    if (!selectedDate || !id) return;

    const fetchShowtimes = async () => {
      setShowtimesLoading(true);
      try {
        const apiDate = convertDateToAPIFormat(selectedDate);
        const response = await showtimeService.getByDate(apiDate, timezoneOffset);
        
        if (response.status === 200) {
          const allShowtimes = response.data || [];
          const movieShowtimes = allShowtimes.filter(
            (st) => (st.movieId || st.movie?.id) === parseInt(id)
          );
          setShowtimes(movieShowtimes);

          const theatersMap = new Map();
          movieShowtimes.forEach((st) => {
            const theater =
              st?.screen?.theater || st?.screen?.Theater || st?.theater;
            const theaterId =
              theater?.id ??
              theater?.theaterId ??
              st?.screen?.theaterId ??
              st?.screen?.theater_id;
            if (!theaterId) return;
            if (!theatersMap.has(theaterId)) {
              theatersMap.set(theaterId, {
                id: theaterId,
                name: theater?.name || theater?.Name || "Rạp chưa đặt tên",
                location:
                  theater?.location ||
                  theater?.Location ||
                  st?.screen?.location ||
                  "",
              });
            }
          });
          const theatersList = Array.from(theatersMap.values());
          setAvailableTheaters(theatersList);

          if (
            selectedTheaterId &&
            !theatersList.find(
              (th) => String(th.id) === String(selectedTheaterId),
            )
          ) {
            setSelectedTheaterId("");
          }
        } else {
          setShowtimes([]);
          setAvailableTheaters([]);
          setSelectedTheaterId("");
        }
      } catch (err) {
        console.error("Error fetching showtimes:", err);
        setShowtimes([]);
        setAvailableTheaters([]);
        setSelectedTheaterId("");
      } finally {
        setShowtimesLoading(false);
      }
    };

    fetchShowtimes();
  }, [selectedDate, id, timezoneOffset]);

  const goToChooseSeat = (showtimeId, time) => {
    localStorage.setItem("selectedShowtimeId", showtimeId);
    localStorage.setItem("selectedTime", time);
    localStorage.setItem("selectedDate", selectedDate);
    localStorage.setItem("selectedMovieId", id);
    navigate("/choose-seat");
  };

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ textAlign: "center", padding: "40px", color: "#ccc" }}>
          <p>Đang tải thông tin phim...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !movie) {
    return (
      <>
        <Header />
        <div style={{ textAlign: "center", padding: "40px", color: "#ff6b6b" }}>
          <p>{error || "Không tìm thấy phim"}</p>
        </div>
        <Footer />
      </>
    );
  }

  const filteredShowtimes =
    selectedTheaterId && showtimes?.length
      ? showtimes.filter((st) => {
          const theater =
            st?.screen?.theater || st?.screen?.Theater || st?.theater;
          const theaterId =
            theater?.id ??
            theater?.theaterId ??
            st?.screen?.theaterId ??
            st?.screen?.theater_id;
          return String(theaterId) === String(selectedTheaterId);
        })
      : [];

  return (
    <>
      <Header />
      <MovieInfo movie={movie} />
      <MovieSchedule 
        dates={dates}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        showtimes={filteredShowtimes}
        showtimesLoading={showtimesLoading}
        theaters={availableTheaters}
        selectedTheaterId={selectedTheaterId}
        onSelectTheater={setSelectedTheaterId}
        onSelectShowtime={goToChooseSeat}
      />
      <Footer />
    </>
  );
}
