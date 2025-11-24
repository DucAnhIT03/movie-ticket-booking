import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Clock, Calendar } from 'lucide-react';
import './MovieModal.css';

export default function MovieModal({ title, onClose, onSave, initialData, fields, isSaving = false, saveProgress = "" }) {
  const [formData, setFormData] = useState({});
  
  // Lấy danh sách screens và theaters từ fields để lọc
  const getFieldByName = (name) => fields.find(f => f.name === name);
  const theaterField = getFieldByName('theaterIds');
  const screenField = getFieldByName('screenIds');
  
  // Lọc screens dựa trên theaters đã chọn
  const getFilteredScreenOptions = () => {
    if (!screenField || !screenField.options) return [];
    
    const selectedTheaterIds = formData.theaterIds || [];
    
    // Nếu chưa chọn rạp nào, không hiển thị phòng nào
    if (selectedTheaterIds.length === 0) {
      return [];
    }
    
    // Lọc screens thuộc các rạp đã chọn
    return screenField.options.filter(opt => {
      if (opt.theaterId) {
        return selectedTheaterIds.includes(opt.theaterId);
      }
      return false;
    });
  };
  
  // Xóa các screenIds không hợp lệ khi theaterIds thay đổi
  useEffect(() => {
    const selectedTheaterIds = formData.theaterIds || [];
    const selectedScreenIds = formData.screenIds || [];
    
    if (selectedScreenIds.length > 0 && selectedTheaterIds.length > 0) {
      const filteredScreenOptions = getFilteredScreenOptions();
      const validScreenIds = filteredScreenOptions.map(opt => opt.value);
      
      // Lọc ra các screenIds không còn hợp lệ
      const invalidScreenIds = selectedScreenIds.filter(id => !validScreenIds.includes(id));
      
      if (invalidScreenIds.length > 0) {
        setFormData(prev => ({
          ...prev,
          screenIds: selectedScreenIds.filter(id => validScreenIds.includes(id))
        }));
      }
    } else if (selectedTheaterIds.length === 0 && selectedScreenIds.length > 0) {
      // Nếu không chọn rạp nào, xóa tất cả phòng đã chọn
      setFormData(prev => ({
        ...prev,
        screenIds: []
      }));
    }
  }, [formData.theaterIds]);

  useEffect(() => {
    if (initialData) {
      // Chuyển đổi field API → UI
      const mappedData = {
        ...initialData,
        descriptions: initialData.description || initialData.descriptions || "",
        release_date: initialData.releaseDate
          ? initialData.releaseDate.split("T")[0] // lấy yyyy-mm-dd
          : ""
      };
    // Áp dụng giá trị mặc định cho các field chưa có dữ liệu
    fields.forEach(field => {
      if (mappedData[field.name] === undefined) {
        if (field.type === 'multiselect') {
          mappedData[field.name] = Array.isArray(field.defaultValue) ? field.defaultValue : [];
        } else if (field.type === 'showtimes') {
          mappedData[field.name] = field.defaultValue ?? [''];
        } else {
          mappedData[field.name] = field.defaultValue ?? '';
        }
      }
    });
      setFormData(mappedData);
    } else {
      const emptyData = fields.reduce((acc, field) => {
        if (field.type === 'showtimes') {
        acc[field.name] = field.defaultValue ?? [''];
        acc.showtimesByDate = field.defaultValue?.showtimesByDate || {};
        } else if (field.type === 'multiselect') {
        if (field.defaultValue !== undefined) {
          acc[field.name] = Array.isArray(field.defaultValue) ? field.defaultValue : [];
        } else {
          acc[field.name] = [];
        }
        } else {
        acc[field.name] = field.defaultValue ?? '';
        }
        return acc;
      }, {});
    if (!emptyData.showtimesByDate) {
      emptyData.showtimesByDate = {};
    }
      setFormData(emptyData);
    }
  }, [initialData, fields]);

  // Cập nhật showtimesByDate khi start_date hoặc end_date thay đổi
  useEffect(() => {
    const startDate = formData.start_date;
    const endDate = formData.end_date;
    
    if (startDate && endDate && new Date(startDate) <= new Date(endDate)) {
      const dateList = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        dateList.push(dateStr);
      }

      // Cập nhật showtimesByDate, giữ lại các giờ đã chọn cho các ngày còn lại
      const currentShowtimes = formData.showtimesByDate || {};
      const newShowtimes = {};
      
      dateList.forEach(dateStr => {
        // Giữ lại giờ đã chọn nếu ngày vẫn còn trong khoảng, nếu không thì khởi tạo mới
        newShowtimes[dateStr] = currentShowtimes[dateStr] || ['00:00'];
      });

      // Chỉ cập nhật nếu có thay đổi
      const hasChanged = JSON.stringify(newShowtimes) !== JSON.stringify(currentShowtimes);
      if (hasChanged) {
        setFormData(prev => ({
          ...prev,
          showtimesByDate: newShowtimes
        }));
      }
    }
  }, [formData.start_date, formData.end_date]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files.length > 0) {
      // Xử lý file upload
      setFormData((prev) => ({
        ...prev,
        [name]: files[0]
      }));
    } else {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('handleSubmit called', formData);

    try {
      // Validate các field dựa trên fields prop (chỉ validate field có trong form)
      // Kiểm tra xem có field title không (form phim) hay không (form khác)
      const hasTitleField = fields.some(f => f.name === 'title');
      const hasDurationField = fields.some(f => f.name === 'duration');
      const hasReleaseDateField = fields.some(f => f.name === 'release_date');
      const hasFileField = fields.some(f => f.name === 'file');
      
      // Chỉ validate nếu field có trong form
      if (hasTitleField && (!formData.title || formData.title.trim() === '')) {
        alert('Vui lòng nhập tiêu đề phim');
        return;
      }

      if (hasDurationField && (!formData.duration || parseInt(formData.duration, 10) <= 0)) {
        alert('Vui lòng nhập thời lượng phim');
        return;
      }

      if (hasReleaseDateField && !formData.release_date) {
        alert('Vui lòng chọn ngày phát hành');
        return;
      }

      const hasTypeField = fields.some(f => f.name === 'type');
      if (hasTypeField && (!formData.type || `${formData.type}`.trim() === '')) {
        alert('Vui lòng chọn định dạng phim (2D hoặc 3D)');
        return;
      }

      // Validate file upload (chỉ khi thêm mới và có field file)
      if (hasFileField && !initialData && !formData.file) {
        alert('Vui lòng upload ảnh poster');
        return;
      }

      // Validate ngày bắt đầu/kết thúc (nếu có cả 2 field)
      const hasStartDateField = fields.some(f => f.name === 'start_date');
      const hasEndDateField = fields.some(f => f.name === 'end_date');
      if (hasStartDateField && hasEndDateField && formData.start_date && formData.end_date) {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        
        if (endDate < startDate) {
          alert("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu!");
          return;
        }
      }

      // Chuyển showtimesByDate thành mảng giờ chiếu (loại bỏ các giờ trống)
      const allShowtimes = [];
      if (formData.showtimesByDate) {
        Object.entries(formData.showtimesByDate).forEach(([date, times]) => {
          const validTimes = times.filter(t => t && t.trim() !== '');
          if (validTimes.length > 0) {
            allShowtimes.push(...validTimes);
          }
        });
      }

      // Chuyển UI → API - chỉ gửi các field có trong form
      const submitData = {};
      
      // Lấy danh sách tên field từ fields prop
      const fieldNames = fields.map(f => f.name);
      const hasShowtimesField = fields.some(f => f.type === 'showtimes');
      if (hasShowtimesField && !fieldNames.includes('showtimesByDate')) {
        fieldNames.push('showtimesByDate');
      }
      
      // Chỉ thêm các field có trong form vào submitData
      fieldNames.forEach(fieldName => {
        if (formData[fieldName] !== undefined && formData[fieldName] !== null && formData[fieldName] !== '') {
          submitData[fieldName] = formData[fieldName];
        }
      });

      // Đính kèm id để phân biệt thêm mới / chỉnh sửa
      if (initialData?.id !== undefined && initialData?.id !== null) {
        submitData.id = initialData.id;
      }
      
      // Xử lý các field đặc biệt
      if (fieldNames.includes('showtimesByDate')) {
        submitData.showtimes = allShowtimes;
        submitData.showtimesByDate = formData.showtimesByDate || {};
      }
      
      // Xử lý descriptions/description cho form phim
      if (fieldNames.includes('descriptions')) {
        submitData.descriptions = formData.descriptions || '';
        submitData.description = formData.descriptions || '';
      }
      
      // Xử lý file nếu có
      if (formData.file) {
        submitData.file = formData.file;
      }
      
      // Xóa các field undefined để tránh gửi lên server
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      console.log('Submit data:', submitData);

      // Gọi onSave
      onSave(submitData);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('Có lỗi xảy ra khi lưu. Vui lòng thử lại.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          {(() => {
            // Nhóm các field theo row
            const fieldGroups = {};
            fields.forEach(field => {
              const rowKey = field.row || `single-${field.name}`;
              if (!fieldGroups[rowKey]) {
                fieldGroups[rowKey] = [];
              }
              fieldGroups[rowKey].push(field);
            });

            // Render các nhóm
            return Object.entries(fieldGroups).map(([rowKey, rowFields]) => {
              const isRow = rowFields.length > 1;
              return (
                <div key={rowKey} className={isRow ? "form-row" : ""}>
                  {rowFields.map(field => (
            <div className="form-group" key={field.name}>
              <label htmlFor={field.name}>{field.label}</label>

              {field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] ?? ''}
                  onChange={handleChange}
                  required={field.required !== false}
                  rows={5}
                />
              ) : field.type === 'select' && field.options ? (
                <select
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] ?? ''}
                  onChange={handleChange}
                  required={field.required !== false}
                >
                  <option value="">-- Chọn {field.label} --</option>
                  {field.options.map((option) => {
                    // Hỗ trợ cả string và object
                    const optionValue = typeof option === 'string' ? option : option.value;
                    const optionLabel = typeof option === 'string' ? option : (option.label || option.value);
                    return (
                      <option key={optionValue} value={optionValue}>
                        {optionLabel}
                      </option>
                    );
                  })}
                </select>
              ) : field.type === 'multiselect' && field.options ? (() => {
                // Lọc options cho screenIds dựa trên theaterIds đã chọn
                const displayOptions = field.name === 'screenIds' 
                  ? getFilteredScreenOptions()
                  : field.options;
                
                return (
                <div>
                  <div style={{ 
                    display: "flex", 
                    flexWrap: "wrap", 
                    gap: "8px", 
                    marginBottom: "8px",
                    minHeight: "40px",
                    padding: "8px",
                    background: "#2b3448",
                    border: "1px solid #3a465b",
                    borderRadius: "8px"
                  }}>
                    {displayOptions
                      .filter(opt => (formData[field.name] || []).includes(opt.value))
                      .map(opt => (
                        <span
                          key={opt.value}
                          style={{
                            background: "#1976d2",
                            color: "#fff",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          {opt.label}
                          <button
                            type="button"
                            onClick={() => {
                              const current = formData[field.name] || [];
                              setFormData({
                                ...formData,
                                [field.name]: current.filter(v => v !== opt.value)
                              });
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#fff",
                              cursor: "pointer",
                              padding: 0,
                              marginLeft: "4px",
                              fontSize: "16px",
                              lineHeight: 1
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    {(formData[field.name] || []).length === 0 && (
                      <span style={{ color: "#888", fontSize: "13px" }}>
                        {field.name === 'screenIds' 
                          ? (formData.theaterIds && formData.theaterIds.length > 0 
                              ? "Chưa chọn phòng chiếu nào" 
                              : "Vui lòng chọn rạp trước")
                          : field.name === 'theaterIds'
                          ? "Chưa chọn rạp nào"
                          : "Chưa chọn thể loại nào"}
                      </span>
                    )}
                  </div>
                  <select
                    id={`${field.name}_selector`}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (value && !(formData[field.name] || []).includes(value)) {
                        setFormData({
                          ...formData,
                          [field.name]: [...(formData[field.name] || []), value]
                        });
                      }
                      e.target.value = "";
                    }}
                    disabled={field.name === 'screenIds' && (!formData.theaterIds || formData.theaterIds.length === 0)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: field.name === 'screenIds' && (!formData.theaterIds || formData.theaterIds.length === 0) 
                        ? "#1a1f29" 
                        : "#2b3448",
                      border: "1px solid #3a465b",
                      borderRadius: "8px",
                      color: field.name === 'screenIds' && (!formData.theaterIds || formData.theaterIds.length === 0)
                        ? "#666"
                        : "#fff",
                      fontSize: "14px",
                      cursor: field.name === 'screenIds' && (!formData.theaterIds || formData.theaterIds.length === 0)
                        ? "not-allowed"
                        : "pointer",
                      opacity: field.name === 'screenIds' && (!formData.theaterIds || formData.theaterIds.length === 0)
                        ? 0.6
                        : 1
                    }}
                  >
                    <option value="">
                      {field.name === 'screenIds' 
                        ? (formData.theaterIds && formData.theaterIds.length > 0 
                            ? "-- Thêm phòng chiếu --" 
                            : "-- Vui lòng chọn rạp trước --")
                        : field.name === 'theaterIds'
                        ? "-- Thêm rạp --"
                        : "-- Thêm thể loại --"}
                    </option>
                    {displayOptions
                      .filter(opt => !(formData[field.name] || []).includes(opt.value))
                      .map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                </div>
                );
              })() : field.type === 'file' ? (
                <div>
                  <input
                    type="file"
                    id={field.name}
                    name={field.name}
                    accept={field.accept || "image/*"}
                    onChange={handleChange}
                    required={field.required !== false}
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
                  {formData[field.name] && typeof formData[field.name] === 'object' && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ color: "#4caf50", fontSize: "13px", marginBottom: "8px" }}>
                        Đã chọn: {formData[field.name].name}
                      </div>
                      <img 
                        src={URL.createObjectURL(formData[field.name])} 
                        alt="Preview" 
                        style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "8px", objectFit: "cover" }}
                      />
                    </div>
                  )}
                  {formData[field.name] && typeof formData[field.name] === 'string' && !formData[field.name].startsWith('blob:') && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ color: "#888", fontSize: "13px", marginBottom: "8px" }}>
                        Ảnh hiện tại:
                      </div>
                      <img 
                        src={formData[field.name]} 
                        alt="Preview" 
                        style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "8px", objectFit: "cover" }}
                      />
                    </div>
                  )}
                </div>
              ) : field.type === 'showtimes' ? (() => {
                const startDate = formData.start_date;
                const endDate = formData.end_date;
                const hasValidDateRange = startDate && endDate && new Date(startDate) <= new Date(endDate);
                
                // Tính danh sách các ngày trong khoảng
                const dateList = [];
                if (hasValidDateRange) {
                  const start = new Date(startDate);
                  const end = new Date(endDate);
                  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split("T")[0];
                    dateList.push(dateStr);
                  }
                }

                const showtimesByDate = formData.showtimesByDate || {};

                return (
                  <div>
                    {!hasValidDateRange ? (
                      <div style={{
                        padding: "15px",
                        background: "#2b3448",
                        border: "1px solid #3a465b",
                        borderRadius: "8px",
                        color: "#888",
                        fontSize: "13px",
                        textAlign: "center"
                      }}>
                        {!startDate || !endDate 
                          ? "Vui lòng chọn ngày bắt đầu và ngày kết thúc công chiếu trước"
                          : "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu"}
                      </div>
                    ) : (
                      <>
                        <div style={{
                          padding: "10px",
                          background: "#1e3a5f",
                          border: "1px solid #2a4a6f",
                          borderRadius: "8px",
                          marginBottom: "15px",
                          color: "#4fc3f7",
                          fontSize: "13px"
                        }}>
                          <strong>Khoảng thời gian công chiếu:</strong> {new Date(startDate).toLocaleDateString("vi-VN")} - {new Date(endDate).toLocaleDateString("vi-VN")} ({dateList.length} ngày)
                        </div>
                        
                        <div style={{ 
                          display: "flex", 
                          flexDirection: "column", 
                          gap: "20px",
                          marginBottom: "10px"
                        }}>
                          {dateList.map((dateStr) => {
                            const dateObj = new Date(dateStr);
                            const dayName = dateObj.toLocaleDateString("vi-VN", { weekday: "long" });
                            const dateDisplay = dateObj.toLocaleDateString("vi-VN");
                            const times = showtimesByDate[dateStr] || [''];
                            
                            return (
                              <div key={dateStr} style={{
                                padding: "15px",
                                background: "#2b3448",
                                border: "1px solid #3a465b",
                                borderRadius: "8px"
                              }}>
                                <div style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  marginBottom: "12px"
                                }}>
                                  <Calendar size={18} style={{ color: "#4fc3f7" }} />
                                  <strong style={{ color: "#fff", fontSize: "14px" }}>
                                    {dayName}, {dateDisplay}
                                  </strong>
                                </div>
                                
                                <div style={{ 
                                  display: "flex", 
                                  flexDirection: "column", 
                                  gap: "10px",
                                  marginBottom: "10px"
                                }}>
                                  {times.map((time, index) => {
                                    // Parse time string (HH:mm) to hours and minutes
                                    let [hours = "00", minutes = "00"] = time.split(":");
                                    // Xử lý trường hợp hours hoặc minutes là empty string
                                    if (!hours || hours.trim() === "") hours = "00";
                                    if (!minutes || minutes.trim() === "") minutes = "00";
                                    const hourValue = parseInt(hours, 10) || 0;
                                    const minuteValue = parseInt(minutes, 10) || 0;
                                    
                                    return (
                                      <div key={index} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <Clock size={18} style={{ color: "#888", flexShrink: 0 }} />
                                        <div style={{ display: "flex", gap: "5px", flex: 1, alignItems: "center" }}>
                                          <select
                                            value={hourValue}
                                            onChange={(e) => {
                                              const newHour = e.target.value.padStart(2, "0");
                                              const newTime = `${newHour}:${minutes}`;
                                              const newShowtimes = { ...showtimesByDate };
                                              const newTimes = [...times];
                                              newTimes[index] = newTime;
                                              newShowtimes[dateStr] = newTimes;
                                              setFormData({
                                                ...formData,
                                                showtimesByDate: newShowtimes
                                              });
                                            }}
                                            style={{
                                              flex: 1,
                                              padding: "10px",
                                              background: "#1e2634",
                                              border: "1px solid #3a465b",
                                              borderRadius: "8px",
                                              color: "#fff",
                                              fontSize: "14px",
                                              cursor: "pointer"
                                            }}
                                          >
                                            {Array.from({ length: 24 }, (_, i) => (
                                              <option key={i} value={i} style={{ background: "#1e2634" }}>
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
                                              const newShowtimes = { ...showtimesByDate };
                                              const newTimes = [...times];
                                              newTimes[index] = newTime;
                                              newShowtimes[dateStr] = newTimes;
                                              setFormData({
                                                ...formData,
                                                showtimesByDate: newShowtimes
                                              });
                                            }}
                                            style={{
                                              flex: 1,
                                              padding: "10px",
                                              background: "#1e2634",
                                              border: "1px solid #3a465b",
                                              borderRadius: "8px",
                                              color: "#fff",
                                              fontSize: "14px",
                                              cursor: "pointer"
                                            }}
                                          >
                                            {Array.from({ length: 60 }, (_, i) => (
                                              <option key={i} value={i} style={{ background: "#1e2634" }}>
                                                {i.toString().padStart(2, "0")}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        {times.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newShowtimes = { ...showtimesByDate };
                                              const newTimes = times.filter((_, i) => i !== index);
                                              newShowtimes[dateStr] = newTimes.length > 0 ? newTimes : ['00:00'];
                                              setFormData({
                                                ...formData,
                                                showtimesByDate: newShowtimes
                                              });
                                            }}
                                            style={{
                                              background: "#d32f2f",
                                              border: "none",
                                              color: "#fff",
                                              padding: "10px 15px",
                                              borderRadius: "8px",
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              flexShrink: 0
                                            }}
                                            title="Xóa giờ chiếu"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newShowtimes = { ...showtimesByDate };
                                    // Thêm time mới với format đúng "00:00" thay vì empty string
                                    newShowtimes[dateStr] = [...(times || []).filter(t => t && t.trim() !== ''), '00:00'];
                                    setFormData({
                                      ...formData,
                                      showtimesByDate: newShowtimes
                                    });
                                  }}
                                  style={{
                                    background: "#4caf50",
                                    border: "none",
                                    color: "#fff",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    width: "fit-content"
                                  }}
                                >
                                  <PlusCircle size={14} /> Thêm giờ chiếu
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })() : (
                <input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] ?? ''}
                  onChange={handleChange}
                          required={field.required !== false}
                />
              )}
            </div>
          ))}
                </div>
              );
            });
          })()}

          <div className="modal-footer">
            {saveProgress && (
              <div style={{
                width: "100%",
                marginBottom: "10px",
                padding: "10px",
                background: "#1e3a5f",
                border: "1px solid #2a4a6f",
                borderRadius: "8px",
                color: "#4fc3f7",
                fontSize: "13px",
                textAlign: "center"
              }}>
                {saveProgress}
              </div>
            )}
            <button 
              type="button" 
              className="save-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Save button clicked directly');
                handleSubmit(e);
              }}
              disabled={isSaving}
              style={{
                opacity: isSaving ? 0.6 : 1,
                cursor: isSaving ? "not-allowed" : "pointer"
              }}
            >
              {isSaving ? "Đang lưu..." : "Lưu"}
            </button>
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={isSaving}
              style={{
                opacity: isSaving ? 0.6 : 1,
                cursor: isSaving ? "not-allowed" : "pointer"
              }}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
