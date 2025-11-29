import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
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
  const [revenuePeriod, setRevenuePeriod] = useState("day"); 

  const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50"];
  const chartCardStyle = {
    background: "linear-gradient(135deg, #101829 0%, #0b1220 100%)",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    boxShadow: "0 24px 60px rgba(8, 15, 35, 0.45)",
  };

  const headerTitleStyle = { margin: 0, fontSize: "18px", fontWeight: 600 };

  const StatChip = ({ label, value }) => (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "12px",
        padding: "10px 16px",
        display: "flex",
        flexDirection: "column",
        minWidth: "140px",
      }}
    >
      <span style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>
        {label}
      </span>
      <strong style={{ fontSize: "20px", color: "#fff", marginTop: "4px" }}>{value}</strong>
    </div>
  );

  const ChartTooltip = ({ active, payload, label, suffix = " đ" }) => {
    if (!active || !payload || !payload.length) return null;
    const value = payload[0].value || 0;
    return (
      <div
        style={{
          background: "#0f172a",
          padding: "10px 14px",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 10px 25px rgba(15, 23, 42, 0.4)",
          color: "#fff",
          minWidth: "140px",
        }}
      >
        <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>{label}</div>
        <div style={{ fontSize: "20px", fontWeight: 600 }}>
          {value.toLocaleString("vi-VN")}
          {suffix}
        </div>
      </div>
    );
  };

 
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  };

  
  const formatMonth = (monthString) => {
    if (!monthString) return "";
    const [year, month] = monthString.split("-");
    return `T${parseInt(month)}`;
  };

  
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


  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dashboardService.getStats();
        
        if (response.status === 200 && response.data) {
          const data = response.data;
          
     
          setStats({
            totalUsers: data.totals?.users || 0,
            activeUsers: data.totals?.activeUsers || 0,
            newUsersThisMonth: data.totals?.users || 0, 
            totalMovies: data.totals?.movies || 0,
            upcomingShowtimes: data.totals?.showtimesUpcoming || 0,
            totalTickets: data.bookings?.total || 0,
            totalRevenue: data.revenue?.total || 0,
            totalTheaters: data.totals?.theaters || 0,
            totalScreens: data.totals?.screens || 0,
          });

        
          if (data.charts?.revenueDaily) {
            setRevenueByDay(
              data.charts.revenueDaily.map((item) => ({
                date: formatDate(item.date),
                revenue: item.amount,
              }))
            );
          }

          
          if (data.charts?.revenueMonthly) {
            const monthlyData = data.charts.revenueMonthly.map((item) => ({
              month: item.month, 
              monthFormatted: formatMonth(item.month),
              revenue: item.amount,
            }));
            setRevenueByMonth(monthlyData);
            
            
            const yearlyData = calculateRevenueByYearFromMonthly(data.charts.revenueMonthly);
            setRevenueByYear(yearlyData);
          }

        
          if (data.charts?.ticketsDaily) {
            setTicketsByDay(
              data.charts.ticketsDaily.map((item) => ({
                date: formatDate(item.date),
                tickets: item.count,
              }))
            );
          }

        
          if (data.top?.topMoviesByRevenue) {
            setTopMovies(
              data.top.topMoviesByRevenue.map((item) => ({
                name: item.title,
                revenue: item.revenue,
              }))
            );
          }

         
          if (data.top?.topTheatersByRevenue) {
            setTopTheaters(
              data.top.topTheatersByRevenue.map((item) => ({
                name: item.name,
                revenue: item.revenue,
              }))
            );
          }

         
          if (data.revenueByPaymentMethod) {
            const normalized = data.revenueByPaymentMethod.map((item) => ({
              name: (item.method || "Khác").toUpperCase(),
              amount: Number(item.amount) || 0,
            }));
            const totalRevenueByMethod = normalized.reduce((sum, item) => sum + item.amount, 0);
            setPaymentMethods(
              normalized.map((item) => ({
                ...item,
                percent: totalRevenueByMethod > 0 ? Math.round((item.amount / totalRevenueByMethod) * 100) : 0,
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

  const revenueData = getRevenueData();
  const revenueSum = revenueData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const ticketsSum = ticketsByDay.reduce((sum, item) => sum + (item.tickets || 0), 0);

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
        <div style={{ ...chartCardStyle, minHeight: "360px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
            <div>
              <h3 style={headerTitleStyle}>{getRevenueTitle()}</h3>
              <p style={{ color: "#94a3b8", marginTop: "4px" }}>
                Tổng: {revenueSum.toLocaleString("vi-VN")} đ
              </p>
            </div>
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
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {revenuePeriod === "day" ? (
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="10%" stopColor="#5b9bff" stopOpacity={0.6} />
                        <stop offset="90%" stopColor="#0f172a" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="label" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#60a5fa"
                      strokeWidth={3}
                      fill="url(#revenueGradient)"
                      dot={{ r: 4, strokeWidth: 2, stroke: "#1f2937", fill: "#fff" }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={revenueData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f472b6" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#db2777" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="label" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="revenue" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
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
        <div style={{ ...chartCardStyle, minHeight: "350px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <div>
              <h3 style={headerTitleStyle}>Số Lượng Vé Đặt Theo Ngày (30 ngày gần nhất)</h3>
              <p style={{ color: "#94a3b8", marginTop: "4px" }}>Tổng: {ticketsSum.toLocaleString("vi-VN")} vé</p>
            </div>
            <StatChip label="Trung bình/ngày" value={ticketsByDay.length ? `${Math.round(ticketsSum / ticketsByDay.length)} vé` : "0"} />
          </div>
          <div style={{ width: "100%", height: "280px", minHeight: "280px" }}>
            {ticketsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ticketsByDay}>
                  <defs>
                    <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#064e3b" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip content={<ChartTooltip suffix=" vé" />} />
                  <Area
                    type="monotone"
                    dataKey="tickets"
                    stroke="#34d399"
                    fill="url(#ticketGradient)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, stroke: "#064e3b", fill: "#dcfce7" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "50px", color: "#888" }}>
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </div>

        {/* ======== Biểu đồ tròn phương thức thanh toán ======== */}
        <div style={{ ...chartCardStyle, minHeight: "350px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <div>
              <h3 style={headerTitleStyle}>Doanh Thu Theo Phương Thức Thanh Toán</h3>
              <p style={{ color: "#94a3b8", marginTop: "4px" }}>
                Tổng: {paymentMethods.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString("vi-VN")} đ
              </p>
            </div>
          </div>
          <div style={{ width: "100%", height: "280px", minHeight: "280px" }}>
            {paymentMethods.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    dataKey="amount"
                    nameKey="name"
                    outerRadius={100}
                    fill="#8884d8"
                    label={(entry) => `${entry.name}: ${entry.percent}%`}
                  >
                    {paymentMethods.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip
                    formatter={(value, _name, { payload }) => [
                      `${Number(value).toLocaleString("vi-VN")} đ (${payload.percent || 0}%)`,
                      payload.name,
                    ]}
                    contentStyle={{ background: "#0f172a", border: "1px solid #1f2937", color: "#fff" }}
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
