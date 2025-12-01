/**
 
 * @param {string} seatCode
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
 
 * 
 * @param {string[]} selectedSeatKeys 
 * @param {string} newSeatCode 
 * @param {Array} allSeats 
 * @returns {{valid: boolean, message: string}}
 */
export const validateSeatSelection = (selectedSeatKeys, newSeatCode, allSeats) => {

  if (!selectedSeatKeys || selectedSeatKeys.length === 0) {
    return { valid: true, message: '' };
  }

 
  const newSeat = parseSeatCode(newSeatCode);
  if (!newSeat) {
    console.warn('[Seat Validation] Invalid seat code:', newSeatCode);
    return { valid: false, message: 'Mã ghế không hợp lệ' };
  }

  
  console.log('[Seat Validation] Validating:', {
    selectedSeatKeys,
    newSeatCode,
    newSeat,
    allSeatsLength: allSeats?.length
  });

  
  const flatSeats = allSeats.flat();
  
 
  const selectedSeats = [];
  for (const key of selectedSeatKeys) {
    
    const firstDashIndex = key.indexOf('-');
    if (firstDashIndex === -1) continue;
    
    const seatCode = key.substring(firstDashIndex + 1);
    const parsed = parseSeatCode(seatCode);
    if (parsed) {
      selectedSeats.push(parsed);
    }
  }

  
  const seatsByRow = {};
  

  selectedSeats.forEach(seat => {
    if (!seatsByRow[seat.row]) {
      seatsByRow[seat.row] = [];
    }
    seatsByRow[seat.row].push(seat.col);
  });


  if (!seatsByRow[newSeat.row]) {
    seatsByRow[newSeat.row] = [];
  }
  seatsByRow[newSeat.row].push(newSeat.col);

  
  for (const row in seatsByRow) {
    const cols = [...new Set(seatsByRow[row])].sort((a, b) => a - b);
    
    
    for (let i = 0; i < cols.length - 1; i++) {
      const currentCol = cols[i];
      const nextCol = cols[i + 1];
      const gap = nextCol - currentCol - 1; 

      
      if (gap === 1) {
        const seatCode1 = `${row}${currentCol}`;
        const seatCode2 = `${row}${nextCol}`;
        const middleSeatCode = `${row}${currentCol + 1}`;
        
        
        const middleSeatData = flatSeats.find(s => s.seatCode === middleSeatCode);
        
        
        if (!middleSeatData) {
          continue;
        }
        
        
        if (middleSeatData.booked) {
          continue;
        }
        
       
        if (middleSeatData.isHidden) {
          continue;
        }
        
        
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

