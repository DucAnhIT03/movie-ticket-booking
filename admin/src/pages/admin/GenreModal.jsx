import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function GenreModal({ title, onClose, onSave, initialData, fields }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
     
      const emptyData = {};
      fields.forEach((field) => {
        emptyData[field.name] = field.defaultValue || "";
      });
      setFormData(emptyData);
    }
  }, [initialData, fields]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    
    for (const field of fields) {
      if (field.required) {
        const value = formData[field.name];
        if (!value || (typeof value === "string" && value.trim() === "")) {
          alert(`Vui lòng nhập ${field.label.toLowerCase()}`);
          return;
        }
      }
    }

    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a1f29",
          color: "#fff",
          borderRadius: "12px",
          padding: "30px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "600" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#aaa",
              cursor: "pointer",
              padding: "5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.name} style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#aaa",
                  fontSize: "14px",
                }}
              >
                {field.label}
                {field.required && <span style={{ color: "#e53935" }}> *</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  required={field.required}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#242b36",
                    color: "#fff",
                    border: "1px solid #333",
                    borderRadius: "6px",
                    fontSize: "14px",
                    minHeight: "100px",
                    resize: "vertical",
                    outline: "none",
                  }}
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  type={field.type || "text"}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  required={field.required}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#242b36",
                    color: "#fff",
                    border: "1px solid #333",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                />
              )}
            </div>
          ))}

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
              marginTop: "30px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                background: "#333",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

