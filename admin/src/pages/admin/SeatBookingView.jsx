import React, { useState, useEffect } from "react";
import { Building, Tv, Calendar, RefreshCw, Grid } from "lucide-react";
import { toast } from "react-toastify";
import theaterService from "../../services/theaters/theaterService";
import screenService from "../../services/screens/screenService";
import seatService from "../../services/seats/seatService";
import showtimeService from "../../services/showtimes/showtimeService";

export default function SeatBookingView() {
  const [theaters, setTheaters] = useState([]);
  const [screens, setScreens] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [seats, setSeats] = useState([]);
  const [selectedTheaterId, setSelectedTheaterId] = useState("");
  const [selectedScreenId, setSelectedScreenId] = useState("");
  const [selectedShowtimeId, setSelectedShowtimeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    loadTheaters();
  }, []);

  useEffect(() => {
    if (selectedTheaterId) {
      loadScreens();
    } else {
      setScreens([]);
      setSelectedScreenId("");
    }
  }, [selectedTheaterId]);

  useEffect(() => {
    if (selectedScreenId) {
      loadShowtimes();
    } else {
      setShowtimes([]);
      setSelectedShowtimeId("");
      setSeats([]);
    }
  }, [selectedScreenId]);

  useEffect(() => {
    if (selectedShowtimeId) {
      loadSeats();
      if (autoRefresh) {
        startAutoRefresh();
      }
    } else {
      setSeats([]);
      stopAutoRefresh();
    }
    return () => stopAutoRefresh();
  }, [selectedShowtimeId, autoRefresh]);

  const startAutoRefresh = () => {
    stopAutoRefresh();
    const interval = setInterval(() => {
      loadSeats();
    }, 5000); // Refresh mỗi 5 giây
    setRefreshInterval(interval);
  };

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  };

  const loadTheaters = async () => {
    try {
      const res = await theaterService.getAllTheaters();
      if (res.status === 200) {
        setTheaters(res.data.items || res.data || []);
      }
    } catch (error) {
      console.error("Error loading theaters:", error);
      toast.error("Lỗi khi tải danh sách rạp!");
    }
  };

  const loadScreens = async () => {
    try {
      const res = await screenService.getAllScreens();
      if (res.status === 200) {
        const allScreens = res.data.items || res.data || [];
        const filteredScreens = allScreens.filter(
          (s) => s.theater_id === parseInt(selectedTheaterId, 10)
        );
        setScreens(filteredScreens);
      }
    } catch (error) {
      console.error("Error loading screens:", error);
      toast.error("Lỗi khi tải danh sách phòng!");
    }
  };

  const loadShowtimes = async () => {
    if (!selectedScreenId) return;
    try {
      // Filter trực tiếp trong API call
      const res = await showtimeService.getAllShowtimes({ 
        limit: 1000,
        screenId: parseInt(selectedScreenId, 10)
      });
      if (res.status === 200) {
        const showtimesData = res.data?.items || res.data || [];
        console.log("Loaded showtimes for screen:", selectedScreenId, showtimesData);
        setShowtimes(showtimesData);
        
        if (showtimesData.length === 0) {
          toast.info("Không có suất chiếu nào trong phòng này");
        }
      }
    } catch (error) {
      console.error("Error loading showtimes:", error);
      toast.error("Lỗi khi tải danh sách suất chiếu!");
    }
  };

  const loadSeats = async () => {
    if (!selectedShowtimeId) return;
    setIsLoading(true);
    try {
      const res = await seatService.getSeatsByShowtime(selectedShowtimeId);
      console.log("Seats response:", res);
      if (res.status === 200) {
        const seatsData = res.data || [];
        console.log("Loaded seats:", seatsData.length, seatsData);
        setSeats(seatsData);
        
        if (seatsData.length === 0) {
          toast.warning("Phòng này chưa có sơ đồ ghế. Vui lòng tạo sơ đồ ghế trước!");
        }
      } else {
        toast.error(`Lỗi: ${res.data?.message || "Không thể tải sơ đồ ghế"}`);
      }
    } catch (error) {
      console.error("Error loading seats:", error);
      toast.error(error.response?.data?.message || "Lỗi khi tải sơ đồ ghế!");
    } finally {
      setIsLoading(false);
    }
  };

  // Tính toán layout từ danh sách ghế
  const calculateLayout = () => {
    if (seats.length === 0) return { rows: 0, cols: 0, seatGrid: {} };

    const seatGrid = {};
    let maxRow = 0;
    let maxCol = 0;

    seats.forEach((seat) => {
      const match = seat.seatNumber.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const row = match[1];
        const col = parseInt(match[2], 10);
        seatGrid[`${row}-${col}`] = seat;
        const rowIndex = row.charCodeAt(0) - 65;
        maxRow = Math.max(maxRow, rowIndex);
        maxCol = Math.max(maxCol, col);
      }
    });

    return {
      rows: maxRow + 1,
      cols: maxCol,
      seatGrid,
    };
  };

  const { rows, cols, seatGrid } = calculateLayout();
  const rowsArray = Array.from({ length: rows }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  const getSeatColor = (seat) => {
    if (!seat) return "#2b3448"; // Chưa có ghế
    if (seat.isBooked) return "#d32f2f"; // Đã đặt - màu đỏ
    if (seat.isHidden) return "#ffffff"; // Ghế bị ẩn - màu trắng
    if (seat.type === "VIP") return "#ff9800"; // VIP
    if (seat.type === "SWEETBOX") return "#e91e63"; // Ghế đôi
    return "#2b3448"; // Thường
  };

  const getSeatTextColor = (seat) => {
    if (!seat) return "#888";
    if (seat.isBooked) return "#fff";
    if (seat?.isHidden) return "#333";
    return "#fff";
  };

  return (
    <div style={{ color: "#fff", padding: "20px" }}>
      <h1
        style={{
          fontSize: "26px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Grid size={28} /> Xem Sơ Đồ Ghế Đặt Chỗ
      </h1>

      {/* Bộ lọc */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.3)",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          display: "flex",
          gap: "15px",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#aaa" }}>
            Chọn rạp
          </label>
          <select
            value={selectedTheaterId}
            onChange={(e) => {
              setSelectedTheaterId(e.target.value);
              setSelectedScreenId("");
              setSelectedShowtimeId("");
            }}
            style={{
              width: "100%",
              padding: "10px",
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "6px",
            }}
          >
            <option value="">-- Chọn rạp --</option>
            {theaters.map((theater) => (
              <option key={theater.id} value={theater.id}>
                {theater.name} - {theater.location}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#aaa" }}>
            Chọn phòng chiếu
          </label>
          <select
            value={selectedScreenId}
            onChange={(e) => {
              setSelectedScreenId(e.target.value);
              setSelectedShowtimeId("");
            }}
            disabled={!selectedTheaterId}
            style={{
              width: "100%",
              padding: "10px",
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "6px",
              opacity: selectedTheaterId ? 1 : 0.5,
            }}
          >
            <option value="">-- Chọn phòng --</option>
            {screens.map((screen) => (
              <option key={screen.id} value={screen.id}>
                {screen.name} ({screen.seat_capacity} ghế)
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#aaa" }}>
            Chọn suất chiếu
          </label>
          <select
            value={selectedShowtimeId}
            onChange={(e) => setSelectedShowtimeId(e.target.value)}
            disabled={!selectedScreenId}
            style={{
              width: "100%",
              padding: "10px",
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "6px",
              opacity: selectedScreenId ? 1 : 0.5,
            }}
          >
            <option value="">-- Chọn suất chiếu --</option>
            {showtimes.map((showtime) => {
              const startTime = showtime.startTime || showtime.start_time;
              return (
                <option key={showtime.id} value={showtime.id}>
                  {startTime ? new Date(startTime).toLocaleString("vi-VN") : `Suất chiếu #${showtime.id}`}
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={loadSeats}
            disabled={!selectedShowtimeId || isLoading}
            style={{
              padding: "10px 20px",
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: selectedShowtimeId && !isLoading ? "pointer" : "not-allowed",
              opacity: selectedShowtimeId && !isLoading ? 1 : 0.5,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCw size={18} /> Tải lại
          </button>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: selectedShowtimeId ? "pointer" : "not-allowed",
              opacity: selectedShowtimeId ? 1 : 0.5,
            }}
          >
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => {
                setAutoRefresh(e.target.checked);
                if (!e.target.checked) {
                  stopAutoRefresh();
                }
              }}
              disabled={!selectedShowtimeId}
            />
            <span>Tự động cập nhật (5s)</span>
          </label>
        </div>
      </div>

      {/* Sơ đồ ghế */}
      {selectedShowtimeId && (
        <div
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            padding: "30px",
            borderRadius: "12px",
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>
              Đang tải sơ đồ ghế...
            </div>
          ) : seats.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>
              Chưa có ghế nào trong phòng này
            </div>
          ) : (
            <>
              {/* Màn hình */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "30px",
                  padding: "15px",
                  borderTop: "3px dashed #555",
                  borderBottom: "3px dashed #555",
                }}
              >
                <span style={{ color: "#aaa", fontSize: "18px" }}>Màn hình</span>
              </div>

              {/* Lưới ghế */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                {/* Header cột */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `40px repeat(${cols}, 1fr)`,
                    gap: "8px",
                    width: "100%",
                    maxWidth: "1200px",
                  }}
                >
                  <div></div>
                  {Array.from({ length: cols }, (_, i) => (
                    <div
                      key={i + 1}
                      style={{
                        textAlign: "center",
                        color: "#aaa",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Các hàng ghế */}
                {rowsArray.map((row) => (
                  <div
                    key={row}
                    style={{
                      display: "grid",
                      gridTemplateColumns: `40px repeat(${cols}, 1fr)`,
                      gap: "8px",
                      width: "100%",
                      maxWidth: "1200px",
                    }}
                  >
                    {/* Label hàng */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#aaa",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      {row}
                    </div>

                    {/* Ghế trong hàng */}
                    {Array.from({ length: cols }, (_, colIndex) => {
                      const col = colIndex + 1;
                      const key = `${row}-${col}`;
                      const seat = seatGrid[key];
                      const seatNumber = `${row}${col}`;

                      return (
                        <div
                          key={col}
                          style={{
                            aspectRatio: "1",
                            minWidth: "40px",
                            background: getSeatColor(seat),
                            border: seat?.isBooked
                              ? "2px solid #d32f2f"
                              : seat
                              ? "1px solid rgba(255, 255, 255, 0.3)"
                              : "1px dashed rgba(255, 255, 255, 0.2)",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: getSeatTextColor(seat),
                            opacity: seat?.isHidden ? 0.5 : 1,
                          }}
                          title={
                            seat
                              ? `${seat.seatNumber} - ${seat.type}${seat.isBooked ? " (Đã đặt)" : ""}`
                              : `Chưa có ghế ${seatNumber}`
                          }
                        >
                          {seat?.isBooked ? "X" : seatNumber}
                          {seat && seat.type === "VIP" && !seat.isBooked && (
                            <span
                              style={{
                                position: "absolute",
                                top: "2px",
                                right: "2px",
                                fontSize: "8px",
                                color: "#ffd700",
                              }}
                            >
                              ★
                            </span>
                          )}
                          {seat && seat.type === "SWEETBOX" && !seat.isBooked && (
                            <span
                              style={{
                                position: "absolute",
                                top: "2px",
                                right: "2px",
                                fontSize: "8px",
                                color: "#fff",
                              }}
                            >
                              ❤
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div
                style={{
                  marginTop: "30px",
                  padding: "20px",
                  background: "rgba(0, 0, 0, 0.3)",
                  borderRadius: "12px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      background: "#d32f2f",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    X
                  </div>
                  <span style={{ fontSize: "14px" }}>Đã đặt</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      background: "#2b3448",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px" }}>Ghế thường</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      background: "#ff9800",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px" }}>Ghế VIP</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      background: "#e91e63",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px" }}>Ghế đôi</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      background: "#ffffff",
                      borderRadius: "6px",
                      border: "1px solid rgba(0, 0, 0, 0.2)",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px" }}>Ghế bị ẩn</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

