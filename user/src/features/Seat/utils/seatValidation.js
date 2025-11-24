/**
 * Parse seat code thành row và column
 * Ví dụ: "A1" -> {row: "A", col: 1}
 * @param {string} seatCode - Mã ghế (ví dụ: "A1", "B5")
 * @returns {{row: string, col: number} | null}
 */
export const parseSeatCode = (seatCode) => {
  if (!seatCode || typeof seatCode !== 'string') return null;
  
  const match = seatCode.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  
  return {
    row: match[1],
    col: parseInt(match[2], 10)
  };
};

/**
 * Kiểm tra xem có thể chọn ghế mới không dựa trên quy tắc:
 * - Không thể đặt 2 ghế cách nhau 1 ghế (ví dụ: A1 và A3)
 * - Chỉ có thể đặt khi giữa 2 ghế có từ 2 ghế trở lên (ví dụ: A1 và A4)
 * 
 * @param {string[]} selectedSeatKeys - Mảng các seatKey đã chọn (format: "seatId-seatCode")
 * @param {string} newSeatCode - Mã ghế mới muốn chọn
 * @param {Array} allSeats - Mảng 2D chứa tất cả ghế (theo hàng)
 * @returns {{valid: boolean, message: string}}
 */
export const validateSeatSelection = (selectedSeatKeys, newSeatCode, allSeats) => {
  // Nếu chưa có ghế nào được chọn, luôn cho phép
  if (!selectedSeatKeys || selectedSeatKeys.length === 0) {
    return { valid: true, message: '' };
  }

  // Parse ghế mới
  const newSeat = parseSeatCode(newSeatCode);
  if (!newSeat) {
    console.warn('[Seat Validation] Invalid seat code:', newSeatCode);
    return { valid: false, message: 'Mã ghế không hợp lệ' };
  }

  // Debug log
  console.log('[Seat Validation] Validating:', {
    selectedSeatKeys,
    newSeatCode,
    newSeat,
    allSeatsLength: allSeats?.length
  });

  // Tạo flat array của tất cả ghế để kiểm tra ghế có tồn tại không
  const flatSeats = allSeats.flat();
  
  // Lấy tất cả ghế đã chọn và parse
  const selectedSeats = [];
  for (const key of selectedSeatKeys) {
    // Format: "seatId-seatCode" hoặc có thể là "seatId-seatCode-..."
    const firstDashIndex = key.indexOf('-');
    if (firstDashIndex === -1) continue;
    
    const seatCode = key.substring(firstDashIndex + 1);
    const parsed = parseSeatCode(seatCode);
    if (parsed) {
      selectedSeats.push(parsed);
    }
  }

  // Nhóm ghế theo hàng
  const seatsByRow = {};
  
  // Nhóm ghế đã chọn theo hàng
  selectedSeats.forEach(seat => {
    if (!seatsByRow[seat.row]) {
      seatsByRow[seat.row] = [];
    }
    seatsByRow[seat.row].push(seat.col);
  });

  // Thêm ghế mới vào nhóm
  if (!seatsByRow[newSeat.row]) {
    seatsByRow[newSeat.row] = [];
  }
  seatsByRow[newSeat.row].push(newSeat.col);

  // Kiểm tra từng hàng
  for (const row in seatsByRow) {
    const cols = [...new Set(seatsByRow[row])].sort((a, b) => a - b); // Loại bỏ trùng lặp và sắp xếp
    
    // Kiểm tra khoảng cách giữa các ghế liên tiếp
    for (let i = 0; i < cols.length - 1; i++) {
      const currentCol = cols[i];
      const nextCol = cols[i + 1];
      const gap = nextCol - currentCol - 1; // Số ghế trống giữa 2 ghế

      // Nếu khoảng cách = 1 (chỉ có 1 ghế trống), cần kiểm tra kỹ hơn
      if (gap === 1) {
        const seatCode1 = `${row}${currentCol}`;
        const seatCode2 = `${row}${nextCol}`;
        const middleSeatCode = `${row}${currentCol + 1}`;
        
        // Kiểm tra xem ghế ở giữa có tồn tại không
        const middleSeatData = flatSeats.find(s => s.seatCode === middleSeatCode);
        
        // Nếu ghế ở giữa không tồn tại (bị ẩn hoặc không có), cho phép
        if (!middleSeatData) {
          continue;
        }
        
        // Nếu ghế ở giữa đã bị đặt, cho phép (vì không thể chọn ghế đã đặt)
        if (middleSeatData.booked) {
          continue;
        }
        
        // Nếu ghế ở giữa bị ẩn, cho phép
        if (middleSeatData.isHidden) {
          continue;
        }
        
        // Nếu ghế ở giữa tồn tại, chưa bị đặt, và không bị ẩn -> KHÔNG cho phép
        console.log('[Seat Validation] Blocked:', {
          seatCode1,
          seatCode2,
          middleSeatCode,
          middleSeatData
        });
        return {
          valid: false,
          message: 'Bạn vui lòng chọn 2 ghế cạnh nhau hoặc cách nhau ít nhất 2 ghế'
        };
      }
    }
  }

  return { valid: true, message: '' };
};

