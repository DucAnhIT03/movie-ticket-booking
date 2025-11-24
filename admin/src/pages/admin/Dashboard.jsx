import React, { useEffect, useState } from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";
import dashboardService from "../../services/dashboard/dashboardService";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    totalMovies: 0,
    upcomingShowtimes: 0,
    totalTickets: 0,
    totalRevenue: 0,
    totalTheaters: 0,
    totalScreens: 0,
  });

  const [revenueByDay, setRevenueByDay] = useState([]);
  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [revenueByYear, setRevenueByYear] = useState([]);
  const [ticketsByDay, setTicketsByDay] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [topTheaters, setTopTheaters] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [revenuePeriod, setRevenuePeriod] = useState("day"); // "day", "month", "year"

  const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50"];

  // Format date từ YYYY-MM-DD sang DD/MM
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  };

  // Format month từ YYYY-MM sang T1, T2,...
  const formatMonth = (monthString) => {
    if (!monthString) return "";
    const [year, month] = monthString.split("-");
    return `T${parseInt(month)}`;
  };

  // Tính doanh thu theo năm từ dữ liệu tháng
  const calculateRevenueByYearFromMonthly = (monthlyData) => {
    const yearMap = {};
    monthlyData.forEach((item) => {
      const year = item.month.split("-")[0];
      if (!yearMap[year]) {
        yearMap[year] = 0;
      }
      yearMap[year] += item.amount;
    });
    return Object.keys(yearMap)
      .sort()
      .map((year) => ({
        year: year,
        revenue: yearMap[year],
      }));
  };

  // Lấy dữ liệu doanh thu theo period đã chọn
  const getRevenueData = () => {
    switch (revenuePeriod) {
      case "day":
        return revenueByDay.map((item) => ({ label: item.date, revenue: item.revenue }));
      case "month":
        return revenueByMonth.map((item) => ({ label: item.monthFormatted, revenue: item.revenue }));
      case "year":
        return revenueByYear.map((item) => ({ label: item.year, revenue: item.revenue }));
      default:
        return [];
    }
  };

  // Lấy title theo period
  const getRevenueTitle = () => {
    switch (revenuePeriod) {
      case "day":
        return "Doanh Thu Theo Ngày (30 ngày gần nhất)";
      case "month":
        return "Doanh Thu Theo Tháng (12 tháng gần nhất)";
      case "year":
        return "Doanh Thu Theo Năm";
      default:
        return "Doanh Thu";
    }
  };

  // Load dữ liệu từ API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dashboardService.getStats();
        
        if (response.status === 200 && response.data) {
          const data = response.data;
          
          // Cập nhật stats tổng quan
          setStats({
            totalUsers: data.totals?.users || 0,
            activeUsers: data.totals?.activeUsers || 0,
            newUsersThisMonth: data.totals?.users || 0, // Tạm thời, sẽ tính sau
            totalMovies: data.totals?.movies || 0,
            upcomingShowtimes: data.totals?.showtimesUpcoming || 0,
            totalTickets: data.bookings?.total || 0,
            totalRevenue: data.revenue?.total || 0,
            totalTheaters: data.totals?.theaters || 0,
            totalScreens: data.totals?.screens || 0,
          });

          // Format dữ liệu biểu đồ doanh thu theo ngày
          if (data.charts?.revenueDaily) {
            setRevenueByDay(
              data.charts.revenueDaily.map((item) => ({
                date: formatDate(item.date),
                revenue: item.amount,
              }))
            );
          }

          // Format dữ liệu biểu đồ doanh thu theo tháng
          if (data.charts?.revenueMonthly) {
            const monthlyData = data.charts.revenueMonthly.map((item) => ({
              month: item.month, // Giữ nguyên YYYY-MM để tính năm
              monthFormatted: formatMonth(item.month),
              revenue: item.amount,
            }));
            setRevenueByMonth(monthlyData);
            
            // Tính doanh thu theo năm từ dữ liệu tháng
            const yearlyData = calculateRevenueByYearFromMonthly(data.charts.revenueMonthly);
            setRevenueByYear(yearlyData);
          }

          // Format dữ liệu biểu đồ vé theo ngày
          if (data.charts?.ticketsDaily) {
            setTicketsByDay(
              data.charts.ticketsDaily.map((item) => ({
                date: formatDate(item.date),
                tickets: item.count,
              }))
            );
          }

          // Top phim
          if (data.top?.topMoviesByRevenue) {
            setTopMovies(
              data.top.topMoviesByRevenue.map((item) => ({
                name: item.title,
                revenue: item.revenue,
              }))
            );
          }

          // Top rạp
          if (data.top?.topTheatersByRevenue) {
            setTopTheaters(
              data.top.topTheatersByRevenue.map((item) => ({
                name: item.name,
                revenue: item.revenue,
              }))
            );
          }

          // Phương thức thanh toán
          if (data.revenueByPaymentMethod) {
            const total = data.revenueByPaymentMethod.reduce(
              (sum, item) => sum + item.amount,
              0
            );
            setPaymentMethods(
              data.revenueByPaymentMethod.map((item) => ({
                name: item.method,
                value: total > 0 ? Math.round((item.amount / total) * 100) : 0,
              }))
            );
          }
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        alert("Có lỗi xảy ra khi tải dữ liệu dashboard!");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container" style={{ color: "#fff", padding: "20px", textAlign: "center" }}>
        <h2>Đang tải dữ liệu...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ color: "#fff", padding: "20px" }}>
      <h1 style={{ fontSize: "30px", fontWeight: "600", marginBottom: "20px" }}>
        Dashboard Tổng Quan
      </h1>

      {/* ======== Tổng quan hệ thống ======== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        {[
          { label: "Tổng người dùng", value: stats.totalUsers.toLocaleString() },
          { label: "Người dùng active", value: stats.activeUsers.toLocaleString() },
          { label: "Phim đang chiếu", value: stats.totalMovies },
          { label: "Lịch chiếu sắp tới", value: stats.upcomingShowtimes },
          { label: "Tổng vé đã đặt", value: stats.totalTickets.toLocaleString() },
          { label: "Tổng doanh thu", value: stats.totalRevenue.toLocaleString() + " đ" },
          { label: "Số rạp", value: stats.totalTheaters },
          { label: "Số phòng chiếu", value: stats.totalScreens },
        ].map((card, i) => (
          <div
            key={i}
            style={{
              background: "#1a1f29",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center",
              border: "1px solid #2a303d",
            }}
          >
            <h3 style={{ fontSize: "14px", marginBottom: "10px", color: "#aaa" }}>{card.label}</h3>
            <p style={{ fontSize: "26px", fontWeight: "700", color: "#fff" }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
        {/* ======== Biểu đồ doanh thu với tùy chọn ngày/tháng/năm ======== */}
        <div
          style={{
            background: "#1a1f29",
            padding: "20px",
            borderRadius: "10px",
            height: "350px",
            minHeight: "350px",
            width: "100%",
            border: "1px solid #2a303d",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0 }}>{getRevenueTitle()}</h3>
            <select
              value={revenuePeriod}
              onChange={(e) => setRevenuePeriod(e.target.value)}
              style={{
                background: "#242b36",
                color: "#fff",
                border: "1px solid #2a303d",
                borderRadius: "5px",
                padding: "8px 15px",
                fontSize: "14px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="day">Theo Ngày</option>
              <option value="month">Theo Tháng</option>
              <option value="year">Theo Năm</option>
            </select>
          </div>
          <div style={{ width: "100%", height: "280px", minHeight: "280px" }}>
            {getRevenueData().length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {revenuePeriod === "day" ? (
                  <LineChart data={getRevenueData()}>
                    <XAxis dataKey="label" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      formatter={(value) => value.toLocaleString() + " đ"}
                      contentStyle={{ background: "#1a1f29", border: "1px solid #2a303d", color: "#fff" }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#36A2EB" strokeWidth={3} />
                  </LineChart>
                ) : (
                  <BarChart data={getRevenueData()}>
                    <XAxis dataKey="label" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      formatter={(value) => value.toLocaleString() + " đ"}
                      contentStyle={{ background: "#1a1f29", border: "1px solid #2a303d", color: "#fff" }}
                    />
                    <Bar dataKey="revenue" fill={revenuePeriod === "month" ? "#FF6384" : "#4CAF50"} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "50px", color: "#888" }}>
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginTop: "20px" }}>
        {/* ======== Biểu đồ số vé theo ngày ======== */}
        <div
          style={{
            background: "#1a1f29",
            padding: "20px",
            borderRadius: "10px",
            height: "350px",
            minHeight: "350px",
            width: "100%",
          }}
        >
          <h3 style={{ marginBottom: "15px" }}>Số Lượng Vé Đặt Theo Ngày (30 ngày gần nhất)</h3>
          <div style={{ width: "100%", height: "280px", minHeight: "280px" }}>
            {ticketsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ticketsByDay}>
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    formatter={(value) => value + " vé"}
                    contentStyle={{ background: "#1a1f29", border: "1px solid #2a303d", color: "#fff" }}
                  />
                  <Line type="monotone" dataKey="tickets" stroke="#4CAF50" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "50px", color: "#888" }}>
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </div>

        {/* ======== Biểu đồ tròn phương thức thanh toán ======== */}
        <div
          style={{
            background: "#1a1f29",
            padding: "20px",
            borderRadius: "10px",
            height: "350px",
            minHeight: "350px",
            width: "100%",
          }}
        >
          <h3 style={{ marginBottom: "15px" }}>Doanh Thu Theo Phương Thức Thanh Toán</h3>
          <div style={{ width: "100%", height: "280px", minHeight: "280px" }}>
            {paymentMethods.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    fill="#8884d8"
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                  >
                    {paymentMethods.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip 
                    formatter={(value) => value + "%"}
                    contentStyle={{ background: "#1a1f29", border: "1px solid #2a303d", color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "50px", color: "#888" }}>
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======== Top phim / Top rạp ======== */}
      <div style={{ marginTop: "30px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={{ background: "#1a1f29", padding: "20px", borderRadius: "10px", border: "1px solid #2a303d" }}>
          <h3 style={{ marginBottom: "15px" }}>Top Phim Có Doanh Thu Cao Nhất</h3>
          {topMovies.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {topMovies.map((m, i) => (
                <li key={i} style={{ margin: "12px 0", padding: "10px", background: "#242b36", borderRadius: "5px" }}>
                  <strong style={{ color: "#fff" }}>{i + 1}. {m.name}</strong>
                  <div style={{ color: "#4CAF50", marginTop: "5px" }}>
                    {m.revenue.toLocaleString()} đ
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
              Chưa có dữ liệu
            </div>
          )}
        </div>

        <div style={{ background: "#1a1f29", padding: "20px", borderRadius: "10px", border: "1px solid #2a303d" }}>
          <h3 style={{ marginBottom: "15px" }}>Top Rạp Có Doanh Thu Cao Nhất</h3>
          {topTheaters.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {topTheaters.map((t, i) => (
                <li key={i} style={{ margin: "12px 0", padding: "10px", background: "#242b36", borderRadius: "5px" }}>
                  <strong style={{ color: "#fff" }}>{i + 1}. {t.name}</strong>
                  <div style={{ color: "#4CAF50", marginTop: "5px" }}>
                    {t.revenue.toLocaleString()} đ
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
