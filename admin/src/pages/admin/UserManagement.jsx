import React, { useState, useEffect } from "react";
import { Search, User, Lock, Unlock } from "lucide-react";
import { toast } from "react-toastify";
import userService from "../../services/users/userService";

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Lấy dữ liệu từ API
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getAllUsers();
      if (res.status === 200) {
        setUsers(res.data || []);
      } else if (res.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      } else if (res.status === 403) {
        toast.error("Bạn không có quyền truy cập!");
      } else {
        toast.error(res.data?.message || "Lỗi khi tải danh sách người dùng");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Lỗi kết nối đến server!");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Khóa tài khoản
  const handleBlockUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn khóa tài khoản này không?")) {
      return;
    }

    try {
      const res = await userService.blockUser(userId);
      if (res.status === 200) {
        toast.success("Đã khóa tài khoản thành công!");
        loadUsers(); // Reload danh sách
      } else if (res.status === 400) {
        toast.warning(res.data?.message || "Tài khoản đã bị khóa");
      } else if (res.status === 404) {
        toast.error("Không tìm thấy người dùng");
      } else {
        toast.error(res.data?.message || "Lỗi khi khóa tài khoản");
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Lỗi kết nối đến server!");
    }
  };

  // ✅ Mở khóa tài khoản
  const handleUnblockUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn mở khóa tài khoản này không?")) {
      return;
    }

    try {
      const res = await userService.unblockUser(userId);
      if (res.status === 200) {
        toast.success("Đã mở khóa tài khoản thành công!");
        loadUsers(); // Reload danh sách
      } else if (res.status === 400) {
        toast.warning(res.data?.message || "Tài khoản đã được mở khóa");
      } else if (res.status === 404) {
        toast.error("Không tìm thấy người dùng");
      } else {
        toast.error(res.data?.message || "Lỗi khi mở khóa tài khoản");
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error("Lỗi kết nối đến server!");
    }
  };

  // ✅ Lọc user
  const filtered = users.filter(
    (u) =>
      (u.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.lastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone || "").includes(searchTerm)
  );

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
        <User /> Quản Lý Người Dùng
      </h1>

      {/* Thanh tìm kiếm */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "15px",
        }}
      >
        <div style={{ position: "relative" }}>
          <Search
            style={{
              position: "absolute",
              left: "10px",
              top: "8px",
              color: "#aaa",
            }}
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "#1a1f29",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "5px",
              padding: "8px 10px 8px 35px",
              width: "280px",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
          Đang tải dữ liệu...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
          {searchTerm ? "Không tìm thấy người dùng nào" : "Chưa có người dùng nào"}
        </div>
      ) : (
        /* Bảng danh sách user */
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#1a1f29",
            color: "#fff",
            tableLayout: "fixed",
          }}
        >
          <thead style={{ background: "#242b36" }}>
            <tr>
              <th style={{ padding: "10px", textAlign: "center", width: "10%" }}>Họ</th>
              <th style={{ padding: "10px", textAlign: "center", width: "10%" }}>Tên</th>
              <th style={{ padding: "10px", textAlign: "center", width: "25%" }}>Email</th>
              <th style={{ padding: "10px", textAlign: "center", width: "10%" }}>Phone</th>
              <th style={{ padding: "10px", textAlign: "center", width: "8%" }}>Avatar</th>
              <th style={{ padding: "10px", textAlign: "center", width: "8%" }}>Vai trò</th>
              <th style={{ padding: "10px", textAlign: "center", width: "8%" }}>Status</th>
              <th style={{ padding: "10px", textAlign: "center", width: "11%" }}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #2a303d" }}>
                <td style={{ padding: "10px", textAlign: "center", wordWrap: "break-word" }}>{u.lastName || "—"}</td>
                <td style={{ padding: "10px", textAlign: "center", wordWrap: "break-word" }}>{u.firstName || "—"}</td>
                <td style={{ 
                  padding: "10px", 
                  textAlign: "center",
                  wordWrap: "break-word",
                  wordBreak: "break-all",
                  overflowWrap: "break-word"
                }}>
                  {u.email || "—"}
                </td>
                <td style={{ padding: "10px", textAlign: "center", wordWrap: "break-word" }}>{u.phone || "—"}</td>
                <td style={{ padding: "10px", textAlign: "center" }}>
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt="avatar"
                      style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td style={{ padding: "10px", textAlign: "center" }}>
                  {u.roles && u.roles.length > 0 ? (
                    <span style={{ 
                      background: u.roles.includes("ROLE_ADMIN") ? "#e53935" : "#1976d2",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "11px"
                    }}>
                      {u.roles.includes("ROLE_ADMIN") ? "ADMIN" : "USER"}
                    </span>
                  ) : "—"}
                </td>
                <td style={{ padding: "10px", textAlign: "center" }}>
                  <span style={{
                    background: u.status === "ACTIVE" ? "#4caf50" : "#d32f2f",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    color: "#fff"
                  }}>
                    {u.status === "ACTIVE" ? "ACTIVE" : "BLOCKED"}
                  </span>
                </td>

                <td style={{ padding: "10px", textAlign: "center" }}>
                  {u.status === "ACTIVE" ? (
                    <button
                      onClick={() => handleBlockUser(u.id)}
                      style={{
                        background: "#d32f2f",
                        border: "none",
                        borderRadius: "5px",
                        padding: "6px 10px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Khóa tài khoản"
                    >
                      <Lock size={16} color="#fff" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnblockUser(u.id)}
                      style={{
                        background: "#4caf50",
                        border: "none",
                        borderRadius: "5px",
                        padding: "6px 10px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Mở khóa tài khoản"
                    >
                      <Unlock size={16} color="#fff" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    </div>
  );
}
