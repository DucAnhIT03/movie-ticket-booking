import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../features/home/pages/Home.jsx";
import Calendar from "../features/showtime/pages/Calendar.jsx";
import Payment from "../features/payment/pages/Payment/Payment";
import PaymentSuccess from "../features/payment/pages/PaymentSuccess/PaymentSuccess";
import PaymentFailure from "../features/payment/pages/PaymentFailure/PaymentFailure";
import MovieInfo from "../features/Movie/components/MovieInfo.jsx";
import MovieDetail from "../features/Movie/pages/MovieDetail.jsx";
import TicketPrice from "../features/Ticket/pages/TicketPrice.jsx";
import ChooseSeat from "../features/Seat/pages/ChooseSeat.jsx";
import News from "../features/News/pages/News.jsx";
import NewsDetail from "../features/News/pages/NewsDetail.jsx";
import Festival from "../features/festival/pages/Festival.jsx";
import Promotions from "../features/promotions/page/Promotions.jsx";
import Events from "../features/events/pages/Events.jsx";
import EventDetail from "../features/events/pages/EventDetail.jsx";
import Login from "../features/auth/pages/Login/Login.jsx";
import Register from "../features/auth/pages/Register/Register.jsx";
import Profile from "../features/auth/pages/Profile/Profile.jsx";
import FestivalDetail from "../features/festival/pages/FestivalDetail.jsx";

function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Trang chủ đầy đủ với Header, Banner, danh sách phim */}
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failure" element={<PaymentFailure />} />
        <Route path="/movie-info" element={<MovieInfo />} />
        <Route path="/ticket-price" element={<TicketPrice />} />
        <Route path="/choose-seat" element={<ChooseSeat />} />
        <Route path="/movie-detail/:id" element={<MovieDetail />} />
        <Route path="/news" element={<News />} />
        <Route path="/news-detail" element={<NewsDetail />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/festival" element={<Festival />} />
        <Route path="/promotion" element={<Promotions />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/festival/:id" element={<FestivalDetail />} /> 

        {/* USER AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
