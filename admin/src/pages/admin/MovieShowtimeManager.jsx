import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Calendar, Clock, Edit2, X } from "lucide-react";
import { toast } from "react-toastify";
import screenService from "../../services/screens/screenService";
import showtimeService from "../../services/showtimes/showtimeService";

export default function MovieShowtimeManager({ movieId, movieDuration = 120, onClose }) {
  const [screens, setScreens] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state cho showtime mới
  const [selectedScreenId, setSelectedScreenId] = useState("");
  const [showDate, setShowDate] = useState("");
  const [showTimes, setShowTimes] = useState([""]); // Mảng các giờ chiếu trong ngày
  
  // State cho edit mode
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [editScreenId, setEditScreenId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  useEffect(() => {
    if (movieId) {
      loadScreens();
      loadShowtimes();
    }
  }, [movieId]);

  const loadScreens = async () => {
    try {
      const res = await screenService.getAllScreens();
      if (res.status === 200) {
        setScreens(res.data.items || res.data || []);
      }
    } catch (error) {
      console.error("Error loading screens:", error);
    }
  };

  const loadShowtimes = async () => {
    if (!movieId) return;
    setIsLoading(true);
    try {
      const res = await showtimeService.getShowtimesByMovie(movieId);
      if (res.status === 200) {
        setShowtimes(res.data || []);
      }
    } catch (error) {
      console.error("Error loading showtimes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTimeSlot = () => {
    setShowTimes([...showTimes, ""]);
  };

  const handleRemoveTimeSlot = (index) => {
    setShowTimes(showTimes.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index, value) => {
    const newTimes = [...showTimes];
    newTimes[index] = value;
    setShowTimes(newTimes);
  };

  const handleSaveShowtimes = async () => {
    if (!selectedScreenId || !showDate) {
      toast.error("Vui lòng chọn phòng chiếu và ngày!");
      return;
    }

    const validTimes = showTimes.filter(t => t.trim() !== "");
    if (validTimes.length === 0) {
      toast.error("Vui lòng nhập ít nhất một giờ chiếu!");
      return;
    }

    // Validate và chuẩn hóa format thời gian
    const normalizedTimes = [];
    for (const time of validTimes) {
      // Đảm bảo time có format HH:mm (không có :00 ở cuối)
      let timeStr = time.trim();
      
      // Nếu time không có dấu :, bỏ qua
      if (!timeStr.includes(':')) {
        toast.error(`Giờ chiếu không hợp lệ: ${timeStr}`);
        return;
      }
      
      // Nếu time đã có format HH:mm:00, chỉ lấy HH:mm
      if (timeStr.split(':').length > 2) {
        const parts = timeStr.split(':');
        timeStr = `${parts[0]}:${parts[1]}`;
      }
      
      // Validate format HH:mm (0-23h, 0-59 phút)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(timeStr)) {
        toast.error(`Giờ chiếu không hợp lệ: ${timeStr}. Vui lòng nhập format HH:mm (ví dụ: 00:01, 14:30)`);
        return;
      }
      
      // Đảm bảo format đúng HH:mm (2 chữ số cho giờ và phút)
      const [hours, minutes] = timeStr.split(':');
      const normalizedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      normalizedTimes.push(normalizedTime);
    }

    // Validate: Kiểm tra thời gian bắt đầu phải trong tương lai (ít nhất 1 giờ)
    const now = new Date();
    const minStartTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 giờ từ bây giờ
    
    for (const time of normalizedTimes) {
      try {
        // Tạo Date theo local timezone để đảm bảo thời gian hiển thị đúng
        const [hours, minutes] = time.split(':');
        const [year, month, day] = showDate.split('-');
        
        const startDateTime = new Date(
          parseInt(year, 10),
          parseInt(month, 10) - 1, // Month is 0-indexed
          parseInt(day, 10),
          parseInt(hours, 10),
          parseInt(minutes, 10),
          0,
          0
        );
        
        // Kiểm tra Date có hợp lệ không
        if (isNaN(startDateTime.getTime())) {
          toast.error(`Không thể tạo thời gian từ: ${showDate} ${time}`);
          return;
        }
        
        if (startDateTime < minStartTime) {
          toast.error(`Giờ chiếu ${time} phải ít nhất 1 giờ từ bây giờ!`);
          return;
        }
      } catch (error) {
        toast.error(`Lỗi khi xử lý giờ chiếu ${time}: ${error.message}`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const durationMinutes = movieDuration || 120; // Sử dụng duration của phim hoặc mặc định 120 phút
      const promises = normalizedTimes.map(time => {
        try {
          // Tạo Date theo local timezone để đảm bảo thời gian hiển thị đúng
          // Format: YYYY-MM-DDTHH:mm:00 (local time, không có Z)
          const [hours, minutes] = time.split(':');
          const [year, month, day] = showDate.split('-');
          
          // Tạo Date object theo local timezone (không dùng UTC)
          // Sử dụng constructor Date(year, month, day, hour, minute) - sẽ tạo theo local timezone
          const startDateTime = new Date(
            parseInt(year, 10),
            parseInt(month, 10) - 1, // Month is 0-indexed
            parseInt(day, 10),
            parseInt(hours, 10),
            parseInt(minutes, 10),
            0,
            0
          );
          
          // Kiểm tra Date có hợp lệ không
          if (isNaN(startDateTime.getTime())) {
            throw new Error(`Invalid date: ${showDate} ${time}`);
          }
          
          const endDateTime = new Date(startDateTime.getTime() + (durationMinutes * 60 * 1000));
          
          // Kiểm tra endDateTime có hợp lệ không
          if (isNaN(endDateTime.getTime())) {
            throw new Error(`Invalid endTime`);
          }

          return showtimeService.createShowtime({
            movieId: movieId,
            screenId: parseInt(selectedScreenId, 10),
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
          });
        } catch (error) {
          console.error(`Lỗi khi tạo suất chiếu cho ${showDate} ${time}:`, error);
          throw error;
        }
      });

      const results = await Promise.allSettled(promises);
      const errors = [];
      const successes = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const response = result.value;
          if (response?.status === 201 || response?.status === 200) {
            successes.push(normalizedTimes[index]);
          } else {
            const errorMsg = response?.data?.message || response?.message || "Lỗi không xác định";
            errors.push(`${normalizedTimes[index]}: ${errorMsg}`);
          }
        } else {
          // Promise bị reject
          const errorMsg = result.reason?.message || result.reason?.toString() || "Lỗi không xác định";
          errors.push(`${normalizedTimes[index]}: ${errorMsg}`);
        }
      });
      
      if (errors.length > 0) {
        toast.error(`Không thể tạo ${errors.length} suất chiếu:\n${errors.join('\n')}`, {
          autoClose: 5000
        });
      }
      
      if (successes.length > 0) {
        toast.success(`Đã tạo ${successes.length} suất chiếu thành công!`);
        setShowDate("");
        setShowTimes([""]);
        setSelectedScreenId("");
        loadShowtimes();
      }
    } catch (error) {
      console.error("Error creating showtimes:", error);
      toast.error(error.response?.data?.message || "Lỗi khi tạo suất chiếu!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditShowtime = (showtime) => {
    setEditingShowtime(showtime);
    setEditScreenId(showtime.screenId.toString());
    const startDate = new Date(showtime.startTime);
    setEditDate(startDate.toISOString().split("T")[0]);
    setEditTime(startDate.toTimeString().slice(0, 5)); // HH:mm format
  };

  const handleCancelEdit = () => {
    setEditingShowtime(null);
    setEditScreenId("");
    setEditDate("");
    setEditTime("");
  };

  const handleUpdateShowtime = async () => {
    if (!editScreenId || !editDate || !editTime) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    // Validate và chuẩn hóa format thời gian
    let timeStr = editTime.trim();
    
    // Đảm bảo time có format HH:mm
    if (!timeStr.includes(':')) {
      toast.error(`Giờ chiếu không hợp lệ: ${timeStr}`);
      return;
    }
    
    // Nếu time đã có format HH:mm:00, chỉ lấy HH:mm
    if (timeStr.split(':').length > 2) {
      const parts = timeStr.split(':');
      timeStr = `${parts[0]}:${parts[1]}`;
    }
    
    // Validate format HH:mm
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(timeStr)) {
      toast.error(`Giờ chiếu không hợp lệ: ${timeStr}. Vui lòng nhập format HH:mm`);
      return;
    }
    
    // Đảm bảo format đúng HH:mm (2 chữ số cho giờ và phút)
    const [hours, minutes] = timeStr.split(':');
    const normalizedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    
    // Tạo Date theo local timezone để đảm bảo thời gian hiển thị đúng
    const [year, month, day] = editDate.split('-');
    const startDateTime = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1, // Month is 0-indexed
      parseInt(day, 10),
      parseInt(normalizedTime.split(':')[0], 10),
      parseInt(normalizedTime.split(':')[1], 10),
      0,
      0
    );
    
    // Kiểm tra Date có hợp lệ không
    if (isNaN(startDateTime.getTime())) {
      toast.error(`Không thể tạo thời gian từ: ${editDate} ${normalizedTime}`);
      return;
    }

    // Validate: Kiểm tra thời gian bắt đầu phải trong tương lai (ít nhất 1 giờ)
    const now = new Date();
    const minStartTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 giờ từ bây giờ
    
    if (startDateTime < minStartTime) {
      toast.error("Thời gian bắt đầu phải ít nhất 1 giờ từ bây giờ!");
      return;
    }

    setIsLoading(true);
    try {
      const endDateTime = new Date(startDateTime.getTime() + (movieDuration * 60 * 1000));
      
      // Kiểm tra endDateTime có hợp lệ không
      if (isNaN(endDateTime.getTime())) {
        toast.error("Không thể tạo thời gian kết thúc!");
        return;
      }

      const res = await showtimeService.updateShowtime(editingShowtime.id, {
        screenId: parseInt(editScreenId, 10),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });

      if (res.status === 200) {
        toast.success("Cập nhật suất chiếu thành công!");
        handleCancelEdit();
        loadShowtimes();
      } else {
        const errorMsg = res.data?.message || "Lỗi khi cập nhật suất chiếu!";
        toast.error(errorMsg, { autoClose: 5000 });
      }
    } catch (error) {
      console.error("Error updating showtime:", error);
      const errorMsg = error.response?.data?.message || "Lỗi khi cập nhật suất chiếu!";
      toast.error(errorMsg, { autoClose: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShowtime = async (showtimeId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa suất chiếu này không?")) {
      return;
    }

    try {
      const res = await showtimeService.deleteShowtime(showtimeId);
      if (res.status === 200) {
        toast.success("Xóa suất chiếu thành công!");
        loadShowtimes();
      } else {
        toast.error(res.data?.message || "Không thể xóa suất chiếu (có thể đã có booking)");
      }
    } catch (error) {
      console.error("Error deleting showtime:", error);
      toast.error("Lỗi khi xóa suất chiếu!");
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "—";
    }
  };

  const getScreenName = (screenId) => {
    const screen = screens.find(s => s.id === screenId);
    return screen ? screen.name : `ID: ${screenId}`;
  };

  return (
    <div style={{ 
      background: "#1a1f29", 
      padding: "20px", 
      borderRadius: "12px", 
      marginTop: "20px",
      border: "1px solid rgba(255, 255, 255, 0.1)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ color: "#fff", fontSize: "18px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={20} /> Quản lý suất chiếu
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Đóng
        </button>
      </div>

      {/* Form thêm suất chiếu */}
      <div style={{ 
        background: "#242b36", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "20px" 
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
              Phòng chiếu
            </label>
            <select
              value={selectedScreenId}
              onChange={(e) => setSelectedScreenId(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#2b3448",
                border: "1px solid #3a465b",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px"
              }}
            >
              <option value="">-- Chọn phòng chiếu --</option>
              {screens.map(screen => (
                <option key={screen.id} value={screen.id}>
                  {screen.name} ({screen.seat_capacity} ghế)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
              Ngày chiếu
            </label>
            <input
              type="date"
              value={showDate}
              onChange={(e) => setShowDate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#2b3448",
                border: "1px solid #3a465b",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px"
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
            Giờ chiếu (có thể thêm nhiều giờ trong 1 ngày)
          </label>
          {showTimes.map((time, index) => {
            // Parse time string (HH:mm) to hours and minutes
            const [hours = "00", minutes = "00"] = time.split(":");
            const hourValue = parseInt(hours, 10) || 0;
            const minuteValue = parseInt(minutes, 10) || 0;
            
            return (
              <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "5px", flex: 1, alignItems: "center" }}>
                  <select
                    value={hourValue}
                    onChange={(e) => {
                      const newHour = e.target.value.padStart(2, "0");
                      const newTime = `${newHour}:${minutes}`;
                      handleTimeChange(index, newTime);
                    }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      background: "#2b3448",
                      border: "1px solid #3a465b",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i} style={{ background: "#2b3448" }}>
                        {i.toString().padStart(2, "0")}h
                      </option>
                    ))}
                  </select>
                  <span style={{ color: "#fff", fontSize: "14px" }}>:</span>
                  <select
                    value={minuteValue}
                    onChange={(e) => {
                      const newMinute = e.target.value.padStart(2, "0");
                      const newTime = `${hours}:${newMinute}`;
                      handleTimeChange(index, newTime);
                    }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      background: "#2b3448",
                      border: "1px solid #3a465b",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i} style={{ background: "#2b3448" }}>
                        {i.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>
                {showTimes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTimeSlot(index)}
                    style={{
                      background: "#d32f2f",
                      border: "none",
                      color: "#fff",
                      padding: "10px 15px",
                      borderRadius: "8px",
                      cursor: "pointer"
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={handleAddTimeSlot}
            style={{
              background: "#1976d2",
              border: "none",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <PlusCircle size={16} /> Thêm giờ chiếu
          </button>
        </div>

        <button
          onClick={handleSaveShowtimes}
          disabled={isLoading}
          style={{
            marginTop: "15px",
            width: "100%",
            background: "#4caf50",
            border: "none",
            color: "#fff",
            padding: "12px",
            borderRadius: "8px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "15px",
            fontWeight: "600",
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? "Đang tạo..." : "Tạo suất chiếu"}
        </button>
      </div>

      {/* Danh sách suất chiếu */}
      <div>
        <h4 style={{ color: "#fff", fontSize: "16px", marginBottom: "15px" }}>
          Danh sách suất chiếu ({showtimes.length})
        </h4>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#fff" }}>Đang tải...</div>
        ) : showtimes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>Chưa có suất chiếu nào</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {showtimes.map((st) => (
              editingShowtime?.id === st.id ? (
                // Edit mode
                <div
                  key={st.id}
                  style={{
                    background: "#2a3441",
                    padding: "15px",
                    borderRadius: "8px",
                    border: "2px solid #1976d2"
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                        Phòng chiếu
                      </label>
                      <select
                        value={editScreenId}
                        onChange={(e) => setEditScreenId(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          background: "#2b3448",
                          border: "1px solid #3a465b",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "14px"
                        }}
                      >
                        {screens.map(screen => (
                          <option key={screen.id} value={screen.id}>
                            {screen.name} ({screen.seat_capacity} ghế)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                        Ngày chiếu
                      </label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          background: "#2b3448",
                          border: "1px solid #3a465b",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "14px"
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                      Giờ chiếu
                    </label>
                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      {(() => {
                        const [hours = "00", minutes = "00"] = editTime.split(":");
                        const hourValue = parseInt(hours, 10) || 0;
                        const minuteValue = parseInt(minutes, 10) || 0;
                        
                        return (
                          <>
                            <select
                              value={hourValue}
                              onChange={(e) => {
                                const newHour = e.target.value.padStart(2, "0");
                                setEditTime(`${newHour}:${minutes}`);
                              }}
                              style={{
                                flex: 1,
                                padding: "10px",
                                background: "#2b3448",
                                border: "1px solid #3a465b",
                                borderRadius: "8px",
                                color: "#fff",
                                fontSize: "14px",
                                cursor: "pointer"
                              }}
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i} style={{ background: "#2b3448" }}>
                                  {i.toString().padStart(2, "0")}h
                                </option>
                              ))}
                            </select>
                            <span style={{ color: "#fff", fontSize: "14px" }}>:</span>
                            <select
                              value={minuteValue}
                              onChange={(e) => {
                                const newMinute = e.target.value.padStart(2, "0");
                                setEditTime(`${hours}:${newMinute}`);
                              }}
                              style={{
                                flex: 1,
                                padding: "10px",
                                background: "#2b3448",
                                border: "1px solid #3a465b",
                                borderRadius: "8px",
                                color: "#fff",
                                fontSize: "14px",
                                cursor: "pointer"
                              }}
                            >
                              {Array.from({ length: 60 }, (_, i) => (
                                <option key={i} value={i} style={{ background: "#2b3448" }}>
                                  {i.toString().padStart(2, "0")}
                                </option>
                              ))}
                            </select>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={handleUpdateShowtime}
                      disabled={isLoading}
                      style={{
                        flex: 1,
                        background: "#4caf50",
                        border: "none",
                        color: "#fff",
                        padding: "10px",
                        borderRadius: "8px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        opacity: isLoading ? 0.6 : 1
                      }}
                    >
                      {isLoading ? "Đang cập nhật..." : "Lưu thay đổi"}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                      style={{
                        background: "#666",
                        border: "none",
                        color: "#fff",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        opacity: isLoading ? 0.6 : 1
                      }}
                    >
                      <X size={16} style={{ display: "inline", marginRight: "4px" }} />
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div
                  key={st.id}
                  style={{
                    background: "#242b36",
                    padding: "15px",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", marginBottom: "5px", fontWeight: "500", fontSize: "15px" }}>
                      {getScreenName(st.screenId)}
                    </div>
                    <div style={{ color: "#aaa", fontSize: "13px", display: "flex", gap: "15px", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={14} /> 
                        {formatDateTime(st.startTime)}
                      </span>
                      <span>→</span>
                      <span>{formatDateTime(st.endTime)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleEditShowtime(st)}
                      style={{
                        background: "#1976d2",
                        border: "none",
                        color: "#fff",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      title="Sửa suất chiếu"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteShowtime(st.id)}
                      style={{
                        background: "#d32f2f",
                        border: "none",
                        color: "#fff",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        cursor: "pointer"
                      }}
                      title="Xóa suất chiếu"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

