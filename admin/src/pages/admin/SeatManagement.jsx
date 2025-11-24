import React, { useState, useEffect } from "react";
import { Building, Tv, PlusCircle, Trash2, Edit2, Save, X, Grid, DollarSign, Eye, EyeOff, CheckSquare, Trash } from "lucide-react";
import { toast } from "react-toastify";
import theaterService from "../../services/theaters/theaterService";
import screenService from "../../services/screens/screenService";
import seatService from "../../services/seats/seatService";
import ticketPriceService from "../../services/ticket-prices/ticketPriceService";

export default function SeatManagement() {
  const [theaters, setTheaters] = useState([]);
  const [screens, setScreens] = useState([]);
  const [seats, setSeats] = useState([]);
  const [selectedTheaterId, setSelectedTheaterId] = useState("");
  const [selectedScreenId, setSelectedScreenId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Grid configuration
  const [rows, setRows] = useState(10); // A-J
  const [cols, setCols] = useState(15); // 1-15
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSeat, setEditingSeat] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]); // Multi-select
  const [seatType, setSeatType] = useState("STANDARD");
  const [isVariable, setIsVariable] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [seatPrice, setSeatPrice] = useState("");
  const [movieType, setMovieType] = useState("2D"); // For price lookup
  const [ticketPrices, setTicketPrices] = useState({}); // Cache prices
  const [selectedScreen, setSelectedScreen] = useState(null); // Store selected screen info

  useEffect(() => {
    loadTheaters();
  }, []);

  // Tính toán rows và cols dựa trên seat_capacity
  const calculateLayout = (capacity) => {
    if (!capacity || capacity <= 0) {
      return { rows: 10, cols: 15 };
    }
    
    // Tỷ lệ phòng chiếu thường là 16:9 hoặc 4:3
    // Ưu tiên layout gần vuông hơn để dễ quản lý
    const aspectRatio = 1.5; // cols/rows ratio
    const estimatedCols = Math.ceil(Math.sqrt(capacity * aspectRatio));
    const estimatedRows = Math.ceil(capacity / estimatedCols);
    
    // Đảm bảo không vượt quá 26 hàng (A-Z)
    const finalRows = Math.min(estimatedRows, 26);
    const finalCols = Math.ceil(capacity / finalRows);
    
    return { rows: finalRows, cols: finalCols };
  };

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
      // Tìm thông tin screen đã chọn
      const screen = screens.find(s => s.id === parseInt(selectedScreenId, 10));
      if (screen) {
        setSelectedScreen(screen);
        // Tự động tính toán layout dựa trên seat_capacity
        const layout = calculateLayout(screen.seat_capacity);
        setRows(layout.rows);
        setCols(layout.cols);
      }
      loadSeats();
    } else {
      setSeats([]);
      setSelectedScreen(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScreenId, screens]);

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
        // Lọc screens theo theater đã chọn
        const filteredScreens = allScreens.filter(s => s.theater_id === parseInt(selectedTheaterId, 10));
        setScreens(filteredScreens);
      }
    } catch (error) {
      console.error("Error loading screens:", error);
      toast.error("Lỗi khi tải danh sách phòng!");
    }
  };

  const loadSeats = async () => {
    if (!selectedScreenId) return;
    setIsLoading(true);
    try {
      const res = await seatService.getSeatsByScreen(selectedScreenId);
      if (res.status === 200) {
        setSeats(res.data || []);
      }
    } catch (error) {
      console.error("Error loading seats:", error);
      toast.error("Lỗi khi tải sơ đồ ghế!");
    } finally {
      setIsLoading(false);
    }
  };

  // Tạo sơ đồ ghế tự động dựa trên seat_capacity
  const generateSeats = async () => {
    if (!selectedScreenId || !selectedScreen) {
      toast.error("Vui lòng chọn phòng chiếu trước!");
      return;
    }

    const capacity = selectedScreen.seat_capacity || 0;
    if (capacity <= 0) {
      toast.error("Phòng chiếu chưa có thông tin số ghế!");
      return;
    }

    // Kiểm tra số ghế hiện có
    const currentSeatCount = seats.length;
    const availableSlots = capacity - currentSeatCount;

    if (availableSlots <= 0) {
      toast.error(`Phòng này đã đủ ${capacity} ghế. Không thể tạo thêm!`);
      return;
    }

    // Sử dụng rows và cols từ input (người dùng tự nhập)
    const totalSeats = rows * cols;
    
    // Đảm bảo không tạo quá số ghế còn lại (availableSlots)
    // Và không vượt quá tổng sức chứa (capacity)
    const actualSeats = Math.min(totalSeats, availableSlots, capacity);
    
    // Kiểm tra nếu vượt quá số ghế còn lại
    if (totalSeats > availableSlots) {
      toast.error(`Bạn đã nhập ${totalSeats} ghế nhưng chỉ còn ${availableSlots} ghế có thể tạo!`);
      return;
    }

    if (actualSeats <= 0) {
      toast.error("Không thể tạo thêm ghế! Phòng đã đủ sức chứa.");
      return;
    }

    if (!window.confirm(
      `Phòng có sức chứa: ${capacity} ghế\n` +
      `Đã có: ${currentSeatCount} ghế\n` +
      `Có thể tạo thêm: ${availableSlots} ghế\n\n` +
      `Bạn có chắc muốn tạo ${actualSeats} ghế?\n` +
      `(Layout: ${rows} hàng x ${cols} cột)`
    )) {
      return;
    }

    setIsLoading(true);
    const seatsToCreate = [];
    const rowsArray = Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i)); // A, B, C, ...
    
    let seatCount = 0;
    rowsArray.forEach(row => {
      for (let col = 1; col <= cols && seatCount < actualSeats; col++) {
        seatsToCreate.push({
          screenId: parseInt(selectedScreenId, 10),
          seatNumber: `${row}${col}`,
          type: "STANDARD",
          isVariable: false,
          isHidden: false
        });
        seatCount++;
      }
    });

    try {
      const results = await seatService.createSeatsBatch(seatsToCreate);
      
      // Xử lý kết quả từ Promise.allSettled
      let successCount = 0;
      let failCount = 0;
      const errorMessages = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const res = result.value;
          // Kiểm tra nếu có error property (từ catch)
          if (res.error) {
            failCount++;
            const errorMsg = res.message || `HTTP ${res.status}` || "Lỗi không xác định";
            if (!errorMessages.includes(errorMsg)) {
              errorMessages.push(errorMsg);
            }
          } else {
            // Kiểm tra HTTP status code
            const httpStatus = res.status;
            if (httpStatus === 201 || httpStatus === 200) {
              successCount++;
            } else {
              failCount++;
              const errorMsg = res.data?.message || `HTTP ${httpStatus}` || "Lỗi không xác định";
              if (!errorMessages.includes(errorMsg)) {
                errorMessages.push(errorMsg);
              }
            }
          }
        } else {
          // Promise.allSettled result bị rejected
          failCount++;
          const errorMsg = result.reason?.message || result.reason || "Lỗi không xác định";
          if (!errorMessages.includes(errorMsg)) {
            errorMessages.push(errorMsg);
          }
        }
      });
      
      if (successCount > 0) {
        toast.success(`Đã tạo ${successCount} ghế thành công!`);
        loadSeats();
        
        // Kiểm tra lại sau khi tạo
        const newTotal = currentSeatCount + successCount;
        if (newTotal >= capacity) {
          toast.info(`Phòng đã đạt sức chứa tối đa: ${capacity} ghế`);
        }
      }
      
      if (failCount > 0) {
        const errorMsg = errorMessages.length > 0 
          ? `: ${errorMessages[0]}${errorMessages.length > 1 ? ` (+${errorMessages.length - 1} lỗi khác)` : ''}`
          : '';
        toast.warning(`${failCount} ghế không thể tạo${errorMsg}`);
      }
      
      if (successCount === 0 && failCount > 0) {
        toast.error(`Không thể tạo ghế nào! ${errorMessages[0] || 'Vui lòng thử lại.'}`);
      }
    } catch (error) {
      console.error("Error creating seats:", error);
      toast.error(error.response?.data?.message || "Lỗi khi tạo ghế!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeatClick = (seat, event) => {
    if (!isEditMode) {
      toast.info("Vui lòng bật chế độ chỉnh sửa trước!");
      return;
    }
    
    // Lấy seatNumber từ seat hoặc từ object được truyền vào
    const seatNumber = seat?.seatNumber;
    if (!seatNumber) {
      console.error("Không tìm thấy seatNumber:", seat);
      return;
    }
    
    const seatId = seat?.id;
    const seatData = seat || { seatNumber: seatNumber, screenId: parseInt(selectedScreenId, 10) };
    
    // Multi-select mặc định (không cần Ctrl)
    // So sánh bằng cả id và seatNumber để đảm bảo match
    const isSelected = selectedSeats.find(s => {
      if (seatId && s.id) {
        return s.id === seatId;
      }
      return s.seatNumber === seatNumber;
    });
    
    if (isSelected) {
      // Bỏ chọn ghế
      const newSelected = selectedSeats.filter(s => {
        if (seatId && s.id) {
          return s.id !== seatId;
        }
        return s.seatNumber !== seatNumber;
      });
      setSelectedSeats(newSelected);
      
      // Nếu còn ghế được chọn, cập nhật editingSeat
      if (newSelected.length > 0) {
        setEditingSeat(newSelected[0]);
        if (newSelected[0].id) {
          setSeatType(newSelected[0].type || "STANDARD");
          setIsVariable(newSelected[0].isVariable || false);
          setIsHidden(newSelected[0].isHidden || false);
          loadSeatPrice(newSelected[0].type || "STANDARD");
        }
      } else {
        setEditingSeat(null);
      }
    } else {
      // Thêm ghế vào danh sách chọn
      const newSelected = [...selectedSeats, seatData];
      setSelectedSeats(newSelected);
      setEditingSeat(seatData);
      
      // Nếu là ghế đã tồn tại, load thông tin
      if (seat && seat.id) {
        setSeatType(seat.type || "STANDARD");
        setIsVariable(seat.isVariable || false);
        setIsHidden(seat.isHidden || false);
        loadSeatPrice(seat.type || "STANDARD");
      } else {
        // Ghế mới - giữ nguyên giá trị hiện tại hoặc reset
        if (selectedSeats.length === 0) {
          setSeatType("STANDARD");
          setIsVariable(false);
          setIsHidden(false);
          loadSeatPrice("STANDARD");
        }
      }
    }
  };

  const loadSeatPrice = async (type) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Thử lấy giá từ 2D trước (mặc định)
      const key = `${type}_2D_${today}`;
      
      if (ticketPrices[key]) {
        setSeatPrice(ticketPrices[key].toString());
        return;
      }

      // Thử lấy giá từ 2D
      const res = await ticketPriceService.getPrice(type, '2D', today);
      if (res.status === 200 && res.data) {
        // Response có thể là số hoặc object
        const price = typeof res.data === 'number' ? res.data : (res.data.price || res.data);
        if (price && !isNaN(price) && price > 0) {
          setTicketPrices({ ...ticketPrices, [key]: price });
          setSeatPrice(price.toString());
          return;
        }
      }
      
      // Nếu không có giá 2D, thử 3D
      const res3D = await ticketPriceService.getPrice(type, '3D', today);
      if (res3D.status === 200 && res3D.data) {
        const price = typeof res3D.data === 'number' ? res3D.data : (res3D.data.price || res3D.data);
        if (price && !isNaN(price) && price > 0) {
          const key3D = `${type}_3D_${today}`;
          setTicketPrices({ ...ticketPrices, [key3D]: price });
          setSeatPrice(price.toString());
          return;
        }
      }
      
      // Nếu không có giá nào, để trống
      setSeatPrice("");
    } catch (error) {
      console.error("Error loading price:", error);
      setSeatPrice("");
    }
  };

  const handleSaveSeat = async () => {
    const seatsToUpdate = selectedSeats.length > 0 ? selectedSeats : (editingSeat ? [editingSeat] : []);
    
    if (seatsToUpdate.length === 0) {
      toast.error("Không có ghế nào được chọn!");
      return;
    }

    if (!selectedScreenId) {
      toast.error("Vui lòng chọn phòng chiếu!");
      return;
    }

    setIsLoading(true);
    try {
      // Lấy theaterId từ screen đã chọn
      const currentScreen = screens.find(s => s.id === parseInt(selectedScreenId, 10));
      const theaterId = currentScreen?.theater_id || null;

      const updatePromises = seatsToUpdate.map(async (seat) => {
        try {
          const updateData = {
            type: seatType,
            isVariable: isVariable,
            isHidden: isHidden
          };

          let seatResult;
          if (seat.id) {
            // Cập nhật ghế đã tồn tại
            seatResult = await seatService.updateSeat(seat.id, updateData);
          } else {
            // Tạo ghế mới
            seatResult = await seatService.createSeat({
              screenId: parseInt(selectedScreenId, 10),
              seatNumber: seat.seatNumber,
              type: seatType,
              isVariable: isVariable,
              isHidden: isHidden
            });
          }

          // Xử lý giá vé: chỉ tạo/cập nhật khi có nhập giá mới
          // Nếu không nhập gì, giá vé giữ nguyên (không thay đổi)
          // Giá vé có hiệu lực từ hôm nay đến 1 năm sau để đảm bảo user luôn thấy giá mới
          // QUAN TRỌNG: Sử dụng seat.type của từng ghế riêng biệt, không dùng seatType chung
          if (seatPrice && seatPrice.trim() !== '' && !isNaN(parseFloat(seatPrice)) && parseFloat(seatPrice) > 0) {
            try {
              const priceValue = parseFloat(seatPrice);
              
              // Lấy ngày hôm nay (chỉ lấy phần date, không có time)
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const todayStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
              
              // Tính ngày kết thúc: 1 năm sau (để giá có hiệu lực lâu dài)
              const endDate = new Date(today);
              endDate.setFullYear(endDate.getFullYear() + 1);
              const endDateStr = endDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
              
              // Lấy loại ghế của ghế hiện tại (ưu tiên seat.type, fallback về seatType)
              const currentSeatType = seat.type || seatType || "STANDARD";
              
              // Tạo giá vé cho cả 2D và 3D, và cho cả ngày thường VÀ cuối tuần
              // để đảm bảo giá áp dụng cho tất cả trường hợp
              const movieTypes = ['2D', '3D'];
              const dayTypes = [false, true]; // false = ngày thường (T2-T5), true = cuối tuần (T6, T7, CN)
              
              let successCount = 0;
              let failCount = 0;
              
              for (const typeMovie of movieTypes) {
                for (const dayType of dayTypes) {
                  const ticketPriceData = {
                    typeSeat: currentSeatType, // Sử dụng loại ghế của ghế hiện tại
                    typeMovie: typeMovie,
                    price: priceValue,
                    dayType: dayType,
                    startTime: "01:00",
                    endTime: "23:59",
                    theaterId: theaterId, // null = áp dụng cho tất cả rạp, có giá trị = áp dụng cho rạp cụ thể
                    startDate: todayStr, // Ngày bắt đầu = hôm nay
                    endDate: endDateStr, // Ngày kết thúc = 1 năm sau (có hiệu lực lâu dài)
                  };

                  // Tạo giá vé mới (có hiệu lực từ hôm nay đến 1 năm sau)
                  try {
                    const priceRes = await ticketPriceService.createTicketPrice(ticketPriceData);
                    if (priceRes.status === 201 || priceRes.status === 200) {
                      successCount++;
                      console.log(`✅ Đã tạo giá vé: ${priceValue} VND cho ${currentSeatType} (ghế ${seat.seatNumber || seat.id}) - ${typeMovie}${theaterId ? ` (Rạp ${theaterId})` : ' (Tất cả rạp)'} - ${dayType ? 'Cuối tuần (T6, T7, CN)' : 'Ngày thường (T2-T5)'} - Có hiệu lực từ ${todayStr} đến ${endDateStr}`);
                    } else {
                      failCount++;
                      console.warn(`⚠️ Không thể tạo giá vé cho ghế ${seat.seatNumber || seat.id}: ${priceRes.status}`, priceRes.data);
                    }
                  } catch (err) {
                    failCount++;
                    console.error(`❌ Lỗi khi tạo giá vé cho ghế ${seat.seatNumber || seat.id} (${currentSeatType} - ${typeMovie} - ${dayType ? 'đặc biệt' : 'thường'}):`, err);
                  }
                }
              }
              
              // Log tổng kết cho từng ghế
              if (successCount > 0) {
                console.log(`✅ Đã tạo ${successCount} giá vé cho ghế ${seat.seatNumber || seat.id} (${currentSeatType})`);
              }
              if (failCount > 0) {
                console.warn(`⚠️ ${failCount} giá vé không thể tạo cho ghế ${seat.seatNumber || seat.id}`);
              }
            } catch (priceError) {
              console.error(`Error saving ticket price for seat ${seat.seatNumber || seat.id}:`, priceError);
              // Không throw error để không ảnh hưởng đến việc lưu ghế
              // Chỉ log warning
              const errorMsg = priceError.response?.data?.message || priceError.message || "Lỗi không xác định";
              console.warn(`Không thể lưu giá vé cho ghế ${seat.seatNumber || seat.id}: ${errorMsg}`);
            }
          } else {
            // Không nhập giá hoặc giá không hợp lệ
            // Giá vé giữ nguyên (không tạo mới, không cập nhật)
            console.log(`Không có giá mới cho ghế ${seat.seatNumber || seat.id}, giữ nguyên giá cũ`);
          }
          
          return { status: 'fulfilled', value: seatResult, seat };
        } catch (error) {
          console.error(`Error updating seat ${seat.seatNumber || seat.id}:`, error);
          return { 
            status: 'rejected', 
            reason: error.response?.data?.message || error.message || "Lỗi không xác định",
            seat 
          };
        }
      });

      const results = await Promise.allSettled(updatePromises);
      
      // Xử lý kết quả từ Promise.allSettled
      let successCount = 0;
      let failCount = 0;
      const errorMessages = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          // result.value là { status: 'fulfilled'/'rejected', value: res, reason: ..., seat: ... }
          const res = result.value;
          if (res.status === 'fulfilled') {
            // Kiểm tra HTTP status code từ response
            const httpStatus = res.value?.status;
            if (httpStatus === 200 || httpStatus === 201) {
              successCount++;
            } else {
              failCount++;
              const errorMsg = res.value?.data?.message || `HTTP ${httpStatus}` || "Lỗi không xác định";
              if (!errorMessages.includes(errorMsg)) {
                errorMessages.push(errorMsg);
              }
            }
          } else {
            // res.status === 'rejected'
            failCount++;
            const errorMsg = res.reason || "Lỗi không xác định";
            if (!errorMessages.includes(errorMsg)) {
              errorMessages.push(errorMsg);
            }
          }
        } else {
          // Promise.allSettled result bị rejected (không nên xảy ra vì đã catch trong map)
          failCount++;
          const errorMsg = result.reason?.message || result.reason || "Lỗi không xác định";
          if (!errorMessages.includes(errorMsg)) {
            errorMessages.push(errorMsg);
          }
        }
      });
      
      if (successCount > 0) {
        if (failCount > 0) {
          toast.warning(
            `Đã cập nhật ${successCount}/${seatsToUpdate.length} ghế thành công. ` +
            `${failCount} ghế gặp lỗi.`
          );
        } else {
          toast.success(`Đã cập nhật ${successCount} ghế thành công!`);
        }
        setEditingSeat(null);
        setSelectedSeats([]);
        loadSeats();
      } else {
        const errorMsg = errorMessages.length > 0 ? errorMessages[0] : "Lỗi không xác định";
        toast.error(`Lỗi khi cập nhật ghế! ${errorMsg}`);
      }
    } catch (error) {
      console.error("Error saving seats:", error);
      toast.error(error.response?.data?.message || "Lỗi khi lưu ghế!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSeat = async (seatId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ghế này không?")) {
      return;
    }

    try {
      const res = await seatService.deleteSeat(seatId);
      if (res.status === 200) {
        toast.success("Xóa ghế thành công!");
        loadSeats();
      } else {
        toast.error(res.data?.message || "Không thể xóa ghế (có thể đã được đặt)");
      }
    } catch (error) {
      console.error("Error deleting seat:", error);
      toast.error(error.response?.data?.message || "Lỗi khi xóa ghế!");
    }
  };

  // Xóa toàn bộ sơ đồ ghế của phòng
  const handleDeleteAllSeats = async () => {
    if (!selectedScreenId || !selectedScreen) {
      toast.error("Vui lòng chọn phòng chiếu trước!");
      return;
    }

    if (seats.length === 0) {
      toast.info("Phòng này chưa có ghế nào để xóa!");
      return;
    }

    // Kiểm tra ghế đã được đặt
    const bookedSeats = seats.filter(seat => seat.bookingSeats && seat.bookingSeats.length > 0);
    const availableSeats = seats.filter(seat => !seat.bookingSeats || seat.bookingSeats.length === 0);

    if (bookedSeats.length > 0 && availableSeats.length > 0) {
      // Có cả ghế đã đặt và chưa đặt
      const choice = window.confirm(
        `Phòng có ${seats.length} ghế:\n` +
        `- ${bookedSeats.length} ghế đã được đặt (không thể xóa)\n` +
        `- ${availableSeats.length} ghế chưa được đặt (có thể xóa)\n\n` +
        `Bạn có muốn xóa ${availableSeats.length} ghế chưa được đặt không?`
      );
      
      if (!choice) return;

      setIsLoading(true);
      try {
        const deletePromises = availableSeats.map(seat => seatService.deleteSeat(seat.id));
        const results = await Promise.all(deletePromises);
        const successCount = results.filter(r => r.status === 200).length;
        const failCount = results.length - successCount;

        if (successCount > 0) {
          toast.success(`Đã xóa ${successCount} ghế thành công!`);
          loadSeats();
        }
        if (failCount > 0) {
          toast.warning(`${failCount} ghế không thể xóa`);
        }
      } catch (error) {
        console.error("Error deleting seats:", error);
        toast.error("Lỗi khi xóa ghế!");
      } finally {
        setIsLoading(false);
      }
    } else if (bookedSeats.length > 0) {
      // Tất cả ghế đã được đặt
      toast.error(`Không thể xóa! Tất cả ${bookedSeats.length} ghế đã được đặt.`);
    } else {
      // Tất cả ghế chưa được đặt - xóa hết
      if (!window.confirm(
        `Bạn có chắc chắn muốn xóa toàn bộ ${seats.length} ghế của phòng này không?\n\n` +
        `Hành động này không thể hoàn tác!`
      )) {
        return;
      }

      setIsLoading(true);
      try {
        const deletePromises = seats.map(seat => seatService.deleteSeat(seat.id));
        const results = await Promise.all(deletePromises);
        const successCount = results.filter(r => r.status === 200).length;
        const failCount = results.length - successCount;

        if (successCount > 0) {
          toast.success(`Đã xóa ${successCount} ghế thành công!`);
          loadSeats();
        }
        if (failCount > 0) {
          toast.warning(`${failCount} ghế không thể xóa`);
        }
      } catch (error) {
        console.error("Error deleting seats:", error);
        toast.error("Lỗi khi xóa ghế!");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Parse seat number để lấy row và col
  const parseSeatNumber = (seatNumber) => {
    const match = seatNumber.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      return { row: match[1], col: parseInt(match[2], 10) };
    }
    return null;
  };

  // Tạo grid từ seats
  const createSeatGrid = () => {
    const grid = {};
    seats.forEach(seat => {
      const parsed = parseSeatNumber(seat.seatNumber);
      if (parsed) {
        const key = `${parsed.row}-${parsed.col}`;
        grid[key] = seat;
      }
    });
    return grid;
  };

  const seatGrid = createSeatGrid();
  const rowsArray = Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i));

  // Kiểm tra ghế đã được đặt
  const isSeatBooked = (seat) => {
    return seat?.bookingSeats && seat.bookingSeats.length > 0;
  };

  // Kiểm tra ghế có được chọn không
  const isSeatSelected = (seat, seatNumber) => {
    if (selectedSeats.length === 0) return false;
    
    const currentSeatNumber = String(seat?.seatNumber || seatNumber || "");
    const currentSeatId = seat?.id;
    
    if (!currentSeatNumber) return false;
    
    return selectedSeats.some(s => {
      // So sánh bằng ID nếu cả hai đều có ID
      if (currentSeatId && s.id) {
        return s.id === currentSeatId;
      }
      // So sánh bằng seatNumber
      const sNumber = String(s.seatNumber || "");
      return sNumber === currentSeatNumber;
    });
  };

  // Kiểm tra ghế có đang được chỉnh sửa không
  const isSeatEditing = (seat, seatNumber) => {
    if (!editingSeat) return false;
    
    const currentSeatNumber = String(seat?.seatNumber || seatNumber || "");
    const currentSeatId = seat?.id;
    const editingId = editingSeat.id;
    const editingNumber = String(editingSeat.seatNumber || "");
    
    if (!currentSeatNumber && !currentSeatId) return false;
    
    // So sánh bằng ID nếu cả hai đều có ID
    if (currentSeatId && editingId) {
      return currentSeatId === editingId;
    }
    // So sánh bằng seatNumber
    return currentSeatNumber === editingNumber;
  };

  // Lấy màu cho từng loại ghế
  const getSeatColor = (seat) => {
    if (!seat) return "#2b3448"; // Chưa có ghế
    if (seat.isHidden) return "#ffffff"; // Ghế bị ẩn - màu trắng
    if (isSeatBooked(seat)) return "#d32f2f"; // Đã đặt
    if (seat.type === "VIP") return "#ff9800"; // VIP
    if (seat.type === "SWEETBOX") return "#e91e63"; // Ghế đôi
    return "#2b3448"; // Thường
  };

  const getSeatTextColor = (seat) => {
    if (!seat) return "#888";
    if (seat?.isHidden) return "#333"; // Màu chữ tối trên nền trắng
    if (isSeatBooked(seat)) return "#fff";
    return "#fff";
  };

  return (
    <div style={{ color: "#fff" }}>
      <h1
        style={{
          fontSize: "26px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Grid /> Quản Lý Ghế Ngồi
      </h1>

      {/* Selectors */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{
          display: "flex",
          gap: "15px",
          flexWrap: "wrap",
          marginBottom: "15px"
        }}>
          <div style={{ flex: "1", minWidth: "200px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
              Chọn rạp
            </label>
            <select
              value={selectedTheaterId}
              onChange={(e) => {
                setSelectedTheaterId(e.target.value);
                setSelectedScreenId("");
                setSeats([]);
              }}
              style={{
                width: "100%",
                padding: "8px 10px",
                background: "#1a1f29",
                border: "1px solid #333",
                borderRadius: "5px",
                color: "#fff",
                fontSize: "14px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="" style={{ background: "#1a1f29" }}>-- Chọn rạp --</option>
              {theaters.map(theater => (
                <option key={theater.id} value={theater.id} style={{ background: "#1a1f29" }}>
                  {theater.name} - {theater.location}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: "1", minWidth: "200px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
              Chọn phòng chiếu
            </label>
            <select
              value={selectedScreenId}
              onChange={(e) => setSelectedScreenId(e.target.value)}
              disabled={!selectedTheaterId}
              style={{
                width: "100%",
                padding: "8px 10px",
                background: !selectedTheaterId ? "#0f1419" : "#1a1f29",
                border: "1px solid #333",
                borderRadius: "5px",
                color: !selectedTheaterId ? "#666" : "#fff",
                fontSize: "14px",
                cursor: !selectedTheaterId ? "not-allowed" : "pointer",
                outline: "none",
                opacity: !selectedTheaterId ? 0.6 : 1
              }}
            >
              <option value="" style={{ background: "#1a1f29" }}>
                {selectedTheaterId ? "-- Chọn phòng --" : "-- Vui lòng chọn rạp trước --"}
              </option>
              {screens.map(screen => (
                <option key={screen.id} value={screen.id} style={{ background: "#1a1f29" }}>
                  {screen.name} ({screen.seat_capacity} ghế)
                </option>
              ))}
            </select>
          </div>

          {selectedScreen && (
            <>
              <div style={{ flex: "1", minWidth: "200px" }}>
                <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                  Cấu hình lưới
                </label>
                <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                  <input
                    type="number"
                    placeholder="Số hàng"
                    value={rows}
                    onChange={(e) => {
                      const newRows = Math.max(1, Math.min(26, parseInt(e.target.value, 10) || 1));
                      setRows(newRows);
                    }}
                    min="1"
                    max="26"
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      background: "#1a1f29",
                      border: "1px solid #333",
                      borderRadius: "5px",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Số cột"
                    value={cols}
                    onChange={(e) => {
                      const newCols = Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1));
                      setCols(newCols);
                    }}
                    min="1"
                    max="50"
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      background: "#1a1f29",
                      border: "1px solid #333",
                      borderRadius: "5px",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ 
                  padding: "8px",
                  background: "#1a1f29",
                  border: "1px solid #333",
                  borderRadius: "5px",
                  fontSize: "12px",
                  color: rows * cols > (selectedScreen.seat_capacity - seats.length) ? "#ff9800" : "#fff"
                }}>
                  Tổng: {rows * cols} vị trí | Còn lại: {Math.max(0, selectedScreen.seat_capacity - seats.length)} ghế
                </div>
              </div>
              <div style={{ flex: "1", minWidth: "200px" }}>
                <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                  Thông tin phòng
                </label>
                <div style={{ 
                  padding: "10px",
                  background: "#1a1f29",
                  border: "1px solid #333",
                  borderRadius: "5px",
                  color: "#fff",
                  fontSize: "14px"
                }}>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>Sức chứa:</strong> {selectedScreen.seat_capacity} ghế
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>Đã có:</strong> {seats.length} ghế
                  </div>
                  <div>
                    <strong>Còn lại:</strong> {Math.max(0, selectedScreen.seat_capacity - seats.length)} ghế
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {selectedScreenId && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={generateSeats}
              disabled={isLoading || (selectedScreen && seats.length >= selectedScreen.seat_capacity)}
              style={{
                background: (selectedScreen && seats.length >= selectedScreen.seat_capacity) 
                  ? "#666"
                  : "#4caf50",
                border: "none",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: "6px",
                cursor: (isLoading || (selectedScreen && seats.length >= selectedScreen.seat_capacity)) ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                opacity: (isLoading || (selectedScreen && seats.length >= selectedScreen.seat_capacity)) ? 0.6 : 1,
              }}
              title={selectedScreen && seats.length >= selectedScreen.seat_capacity ? "Phòng đã đạt sức chứa tối đa" : ""}
            >
              <PlusCircle size={18} /> 
              {selectedScreen && seats.length >= selectedScreen.seat_capacity 
                ? `Đã đủ ${selectedScreen.seat_capacity} ghế` 
                : `Tạo sơ đồ ghế (${rows}×${cols})`}
            </button>
            {seats.length > 0 && (
              <button
                onClick={handleDeleteAllSeats}
                disabled={isLoading}
                style={{
                  background: "#d32f2f",
                  border: "none",
                  color: "#fff",
                  padding: "10px 18px",
                  borderRadius: "6px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: isLoading ? 0.6 : 1,
                }}
                title="Xóa toàn bộ sơ đồ ghế của phòng này"
              >
                <Trash size={18} /> Xóa sơ đồ ({seats.length} ghế)
              </button>
            )}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              style={{
                background: isEditMode ? "#1976d2" : "#666",
                border: "none",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {isEditMode ? "Tắt chỉnh sửa" : "Bật chỉnh sửa"}
            </button>
          </div>
        )}
      </div>

      {/* Seat Grid */}
      {selectedScreenId ? (
        isLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
            Đang tải sơ đồ ghế...
          </div>
        ) : (
          <div style={{
            background: "#1a1f29",
            padding: "20px",
            borderRadius: "5px",
            border: "1px solid #333",
            marginTop: "20px"
          }}>
            {/* Screen indicator */}
            <div style={{
              textAlign: "center",
              marginBottom: "20px",
              padding: "10px",
              background: "#242b36",
              borderRadius: "5px",
              border: "1px solid #333"
            }}>
              <div style={{ fontSize: "16px", fontWeight: "500", color: "#fff" }}>
                Màn hình
              </div>
            </div>

            {/* Seat grid */}
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "8px",
              alignItems: "center"
            }}>
              {/* Column headers */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: `40px repeat(${cols}, 1fr)`,
                gap: "8px",
                width: "100%",
                maxWidth: "1200px"
              }}>
                <div></div>
                {Array.from({ length: cols }, (_, i) => (
                  <div key={i} style={{ 
                    textAlign: "center", 
                    color: "#4fc3f7", 
                    fontWeight: "600",
                    fontSize: "12px"
                  }}>
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {rowsArray.map((row, rowIndex) => (
                <div key={row} style={{ 
                  display: "grid", 
                  gridTemplateColumns: `40px repeat(${cols}, 1fr)`,
                  gap: "8px",
                  width: "100%",
                  maxWidth: "1200px"
                }}>
                  {/* Row label */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    color: "#4fc3f7", 
                    fontWeight: "600",
                    fontSize: "14px"
                  }}>
                    {row}
                  </div>

                  {/* Seats */}
                  {Array.from({ length: cols }, (_, colIndex) => {
                    const col = colIndex + 1;
                    const key = `${row}-${col}`;
                    const seat = seatGrid[key];
                    const seatNumber = `${row}${col}`;
                    const isBooked = seat && isSeatBooked(seat);
                    const isSelected = isSeatSelected(seat, seatNumber);
                    const isEditing = isSeatEditing(seat, seatNumber);
                    const isHighlighted = isSelected || isEditing;

                    return (
                      <div
                        key={col}
                        onClick={(e) => {
                          const seatToClick = seat || { seatNumber, screenId: parseInt(selectedScreenId, 10) };
                          handleSeatClick(seatToClick, e);
                        }}
                        style={{
                          aspectRatio: "1",
                          minWidth: "40px",
                          background: isHighlighted ? "#1976d2" : getSeatColor(seat),
                          border: isHighlighted
                            ? "2px solid #fff"
                            : isBooked 
                            ? "2px solid #d32f2f"
                            : seat 
                            ? "1px solid #333"
                            : "1px dashed #333",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: isEditMode ? "pointer" : "default",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: getSeatTextColor(seat),
                          position: "relative",
                          opacity: seat?.isHidden ? 0.5 : 1,
                        }}
                        title={seat ? `${seat.seatNumber} - ${seat.type}${isBooked ? " (Đã đặt)" : ""}` : `Chưa có ghế ${seatNumber}`}
                      >
                        {isBooked ? "X" : seatNumber}
                        {seat && seat.type === "VIP" && (
                          <span style={{ 
                            position: "absolute", 
                            top: "2px", 
                            right: "2px", 
                            fontSize: "8px",
                            color: "#ffd700"
                          }}>★</span>
                        )}
                        {seat && seat.type === "SWEETBOX" && (
                          <span style={{ 
                            position: "absolute", 
                            top: "2px", 
                            right: "2px", 
                            fontSize: "8px",
                            color: "#fff"
                          }}>❤</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{
              marginTop: "20px",
              padding: "15px",
              background: "#242b36",
              borderRadius: "5px",
              display: "flex",
              flexWrap: "wrap",
              gap: "15px",
              justifyContent: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", background: "#d32f2f", borderRadius: "4px", border: "1px solid #d32f2f" }}></div>
                <span style={{ fontSize: "14px" }}>Đã đặt</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", background: "#2b3448", borderRadius: "4px", border: "1px solid #333" }}></div>
                <span style={{ fontSize: "14px" }}>Ghế thường</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", background: "#ff9800", borderRadius: "4px", border: "1px solid #333" }}></div>
                <span style={{ fontSize: "14px" }}>Ghế VIP</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", background: "#e91e63", borderRadius: "4px", border: "1px solid #333" }}></div>
                <span style={{ fontSize: "14px" }}>Ghế đôi</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", background: "#ffffff", borderRadius: "4px", border: "1px solid #333" }}></div>
                <span style={{ fontSize: "14px" }}>Ghế bị ẩn</span>
              </div>
              {isEditMode && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 10px", background: "#1a1f29", borderRadius: "4px" }}>
                  <CheckSquare size={16} />
                  <span style={{ fontSize: "12px" }}>Click để chọn nhiều ghế</span>
                </div>
              )}
            </div>

            {/* Edit panel */}
            {isEditMode && (editingSeat || selectedSeats.length > 0) && (
              <div style={{
                marginTop: "20px",
                padding: "15px",
                background: "#242b36",
                borderRadius: "5px",
                border: "1px solid #333"
              }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: "15px"
                }}>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    {selectedSeats.length > 1 ? (
                      <>
                        <CheckSquare size={18} />
                        Đang chọn {selectedSeats.length} ghế
                      </>
                    ) : editingSeat ? (
                      editingSeat.id ? `Chỉnh sửa ghế: ${editingSeat.seatNumber}` : `Tạo ghế mới: ${editingSeat.seatNumber}`
                    ) : (
                      `Chọn ${selectedSeats.length} ghế`
                    )}
                  </h3>
                  <button
                    onClick={() => {
                      setEditingSeat(null);
                      setSelectedSeats([]);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      padding: "5px"
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px", marginBottom: "15px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                      Loại ghế
                    </label>
                    <select
                      value={seatType}
                      onChange={(e) => {
                        setSeatType(e.target.value);
                        loadSeatPrice(e.target.value);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "#1a1f29",
                        border: "1px solid #333",
                        borderRadius: "5px",
                        color: "#fff",
                        fontSize: "14px",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option value="STANDARD" style={{ background: "#1a1f29" }}>Thường</option>
                      <option value="VIP" style={{ background: "#1a1f29" }}>VIP</option>
                      <option value="SWEETBOX" style={{ background: "#1a1f29" }}>Ghế đôi</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                      Giá ghế (VND)
                    </label>
                    <input
                      type="number"
                      value={seatPrice}
                      onChange={(e) => setSeatPrice(e.target.value)}
                      placeholder="Nhập giá..."
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "#1a1f29",
                        border: "1px solid #333",
                        borderRadius: "5px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                      <input
                        type="checkbox"
                        checked={isVariable}
                        onChange={(e) => setIsVariable(e.target.checked)}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      Ghế có thể thay đổi
                    </label>
                  </div>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "#fff", fontSize: "14px" }}>
                      <input
                        type="checkbox"
                        checked={isHidden}
                        onChange={(e) => setIsHidden(e.target.checked)}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      Ẩn ghế
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={handleSaveSeat}
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      background: "#1976d2",
                      border: "none",
                      color: "#fff",
                      padding: "8px 16px",
                      borderRadius: "5px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      opacity: isLoading ? 0.6 : 1,
                    }}
                  >
                    <Save size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                    {editingSeat?.id ? "Lưu thay đổi" : "Tạo ghế"}
                  </button>
                  {editingSeat?.id && (
                    <button
                      onClick={() => handleDeleteSeat(editingSeat.id)}
                      disabled={isLoading}
                      style={{
                        background: "#d32f2f",
                        border: "none",
                        color: "#fff",
                        padding: "8px 16px",
                        borderRadius: "5px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        opacity: isLoading ? 0.6 : 1,
                      }}
                    >
                      <Trash2 size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                      Xóa ghế
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
          Vui lòng chọn rạp và phòng chiếu
        </div>
      )}
    </div>
  );
}

