import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css"

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    navigate("/admin/login");
  };

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav">
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </nav>
      <div className="admin-content">
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p>1,234</p>
          </div>
          <div className="stat-card">
            <h3>Total Movies</h3>
            <p>50</p>
          </div>
          <div className="stat-card">
            <h3>Bookings</h3>
            <p>789</p>
          </div>
        </div>
      </div>
    </div>
  );
}