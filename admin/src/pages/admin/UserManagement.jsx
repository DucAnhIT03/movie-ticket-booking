import React, { useState, useEffect, useMemo } from "react";
import { Search, User, Lock, Unlock, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { toast } from "react-toastify";
import userService from "../../services/users/userService";
import theaterService from "../../services/theaters/theaterService";
import passwordResetService from "../../services/auth/passwordResetService";

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [employeeForm, setEmployeeForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    accountType: "employee",
  });
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [theaters, setTheaters] = useState([]);
  const [assigningTheater, setAssigningTheater] = useState(null);
  const [selectedTheaterForUser, setSelectedTheaterForUser] = useState({});
  const [resetRequests, setResetRequests] = useState([]);
  const [isLoadingResets, setIsLoadingResets] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [resetStatusFilter, setResetStatusFilter] = useState("PENDING");
  const [resetPage, setResetPage] = useState(1);
  const RESET_PAGE_SIZE = 5;

  
  useEffect(() => {
    loadUsers();
    loadTheaters();
    loadResetRequests("PENDING");
  }, []);

  const loadTheaters = async () => {
    try {
      const res = await theaterService.getAllTheaters();
      if (res.status === 200) {
        setTheaters(res.data.items || res.data || []);
      }
    } catch (error) {
      console.error("Error loading theaters:", error);
    }
  };

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

  const loadResetRequests = async (status = resetStatusFilter) => {
    setResetPage(1);
    setIsLoadingResets(true);
    try {
      const res = await passwordResetService.list(status === "ALL" ? "" : status);
      if (res.status === 200) {
        setResetRequests(res.data || []);
      } else if (res.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      } else {
        toast.error(res.data?.message || "Không thể tải yêu cầu khôi phục mật khẩu");
      }
    } catch (error) {
      console.error("Error loading reset requests:", error);
      toast.error("Lỗi kết nối đến server!");
    } finally {
      setIsLoadingResets(false);
    }
  };

  const handleEmployeeInputChange = (field, value) => {
    setEmployeeForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      accountType: "employee",
    });
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    const { firstName, email, password, accountType } = employeeForm;
    const normalizedEmail = (email || "").trim();
    const isValidEmail = (value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test((value || "").trim());

    if (!firstName.trim() || !normalizedEmail || !password.trim()) {
      const accountTypeText = accountType === "admin" ? "admin" : "nhân viên";
      toast.warning(`Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu cho ${accountTypeText}!`);
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      toast.warning("Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: name@gmail.com).");
      return;
    }

    setIsCreatingEmployee(true);
    try {
      const payload = {
        firstName: employeeForm.firstName.trim(),
        lastName: employeeForm.lastName.trim() || undefined,
        email: normalizedEmail,
        phone: employeeForm.phone.trim() || undefined,
        password: employeeForm.password,
      };
      
     
      const res = await userService.createEmployee(payload);
      if (res.status === 201 || res.status === 200) {
        const userId = res.data?.id;
        const accountTypeText = accountType === "admin" ? "admin" : "nhân viên";
        
        
        if (accountType === "admin" && userId) {
          try {
            const roleRes = await userService.assignRole(userId, "ROLE_ADMIN");
            if (roleRes.status === 200 || roleRes.status === 201) {
              toast.success(`Đã tạo tài khoản ${accountTypeText} mới!`);
            } else {
              toast.warning(`Đã tạo tài khoản nhưng không thể gán quyền admin. Vui lòng gán quyền thủ công.`);
            }
          } catch (roleError) {
            console.error("Error assigning admin role:", roleError);
            toast.warning(`Đã tạo tài khoản nhưng không thể gán quyền admin. Vui lòng gán quyền thủ công.`);
          }
        } else {
          toast.success(`Đã tạo tài khoản ${accountTypeText} mới!`);
        }
        
        resetEmployeeForm();
        loadUsers();
      } else if (res.status === 400) {
        toast.warning(res.data?.message || "Thông tin chưa hợp lệ");
      } else {
        toast.error(res.data?.message || "Không thể tạo tài khoản");
      }
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error("Lỗi kết nối đến server!");
    } finally {
      setIsCreatingEmployee(false);
    }
  };

 
  const handleBlockUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn khóa tài khoản này không?")) {
      return;
    }

    try {
      const res = await userService.blockUser(userId);
      if (res.status === 200) {
        toast.success("Đã khóa tài khoản thành công!");
        loadUsers(); 
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

  
  const handleUnblockUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn mở khóa tài khoản này không?")) {
      return;
    }

    try {
      const res = await userService.unblockUser(userId);
      if (res.status === 200) {
        toast.success("Đã mở khóa tài khoản thành công!");
        loadUsers(); 
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

  const handleApproveReset = async (id) => {
    if (!window.confirm("Gửi mã khôi phục 8 ký tự đến email nhân viên?")) {
      return;
    }
    setApprovingId(id);
    try {
      const res = await passwordResetService.approve(id);
      if (res.status === 200) {
        toast.success("Đã gửi mã khôi phục tới nhân viên");
        loadResetRequests();
      } else {
        toast.error(res.data?.message || "Không thể gửi mã khôi phục");
      }
    } catch (error) {
      console.error("Error approving reset:", error);
      toast.error("Lỗi kết nối đến server!");
    } finally {
      setApprovingId(null);
    }
  };

  const handleAssignTheater = async (userId, theaterId) => {
    setAssigningTheater(userId);
    try {
      const res = await userService.assignTheater(userId, theaterId || null);
      if (res.status === 200) {
        toast.success(res.data?.message || "Gán rạp thành công!");
        loadUsers();
        setSelectedTheaterForUser({ ...selectedTheaterForUser, [userId]: null });
      } else if (res.status === 400) {
        toast.error(res.data?.message || "Chỉ có thể gán rạp cho nhân viên");
      } else if (res.status === 404) {
        toast.error("Không tìm thấy người dùng");
      } else {
        toast.error(res.data?.message || "Lỗi khi gán rạp");
      }
    } catch (error) {
      console.error("Error assigning theater:", error);
      toast.error("Lỗi kết nối đến server!");
    } finally {
      setAssigningTheater(null);
    }
  };

  const getTheaterName = (theaterId) => {
    if (!theaterId) return "—";
    const theater = theaters.find(t => t.id === theaterId);
    return theater ? theater.name : "—";
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("vi-VN");
  };

  
  const filtered = useMemo(() => {
    return users.filter((u) => {
      
      const matchesSearch =
        (u.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.lastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone || "").includes(searchTerm);

      
      const matchesRole = !filterRole || (u.roles && u.roles.includes(filterRole));

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const currentRangeStart = (page - 1) * limit + 1;
  const currentRangeEnd = Math.min(total, page * limit);
  const paginatedUsers = filtered.slice((page - 1) * limit, page * limit);

  
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterRole]);

  const renderRoleBadge = (roles = []) => {
    if (roles.includes("ROLE_ADMIN")) {
      return { label: "ADMIN", color: "#e53935" };
    }
    if (roles.includes("ROLE_EMPLOYEE")) {
      return { label: "STAFF", color: "#ffa000" };
    }
    return { label: "USER", color: "#1976d2" };
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
        <User /> Quản Lý Người Dùng
      </h1>

      <div
        style={{
          background: "rgba(0,0,0,0.3)",
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "20px",
          overflow: "hidden",           // tránh tràn
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#cbd5f5" }}>
            <Clock size={18} />
            <div>
              <div style={{ fontWeight: 600 }}>Yêu cầu khôi phục mật khẩu nhân viên</div>
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                Nhân viên nhập đúng OTP sẽ tạo yêu cầu. Admin bấm "Gửi mã" để cấp mã 8 ký tự qua email.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={resetStatusFilter}
              onChange={(e) => {
                const value = e.target.value;
                setResetStatusFilter(value);
                loadResetRequests(value);
              }}
              style={{
                background: "#1a1f29",
                color: "#fff",
                border: "1px solid #333",
                borderRadius: "6px",
                padding: "8px 10px",
                minWidth: "160px",
                cursor: "pointer",
              }}
            >
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã gửi mã</option>
              <option value="COMPLETED">Đã đặt lại</option>
              <option value="ALL">Tất cả</option>
            </select>
            <button
              onClick={() => loadResetRequests()}
              style={{
                background: "#1f2937",
                color: "#fff",
                border: "1px solid #374151",
                borderRadius: "6px",
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <RefreshCw size={16} /> Làm mới
            </button>
          </div>
        </div>

        <div style={{ marginTop: "12px", overflowX: "auto" }}>
          {isLoadingResets ? (
            <div style={{ color: "#cbd5f5" }}>Đang tải yêu cầu...</div>
          ) : resetRequests.length === 0 ? (
            <div style={{ color: "#94a3b8" }}>Chưa có yêu cầu khôi phục nào</div>
          ) : (
            <>
            <table
              style={{
                width: "100%",
                minWidth: "800px",       // đảm bảo bảng không bóp méo
                borderCollapse: "collapse",
                background: "#111827",
                color: "#fff",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <thead style={{ background: "#1f2937" }}>
                <tr>
                  <th style={{ padding: "10px", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Trạng thái</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Mã khôi phục</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Hết hạn</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Tạo lúc</th>
                  <th style={{ padding: "10px", textAlign: "center" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {resetRequests
                  .slice((resetPage - 1) * RESET_PAGE_SIZE, resetPage * RESET_PAGE_SIZE)
                  .map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #1f2937" }}>
                    <td
                      style={{
                        padding: "10px",
                        wordBreak: "break-all",
                        overflowWrap: "anywhere",
                        maxWidth: "260px",
                      }}
                    >
                      {item.email}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span
                        style={{
                          background:
                            item.status === "PENDING"
                              ? "#f59e0b"
                              : item.status === "APPROVED"
                                ? "#3b82f6"
                                : "#22c55e",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>{item.resetCode || "—"}</td>
                    <td style={{ padding: "10px" }}>{item.expiresAt ? formatDateTime(item.expiresAt) : "—"}</td>
                    <td style={{ padding: "10px" }}>{formatDateTime(item.createdAt)}</td>
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      {item.status === "PENDING" ? (
                        <button
                          onClick={() => handleApproveReset(item.id)}
                          disabled={approvingId === item.id}
                          style={{
                            background: approvingId === item.id ? "#4b5563" : "#10b981",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            cursor: approvingId === item.id ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            gap: "6px",
                            alignItems: "center",
                          }}
                        >
                          <CheckCircle size={16} />
                          {approvingId === item.id ? "Đang gửi..." : "Gửi mã"}
                        </button>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: "13px" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", color: "#cbd5f5" }}>
              <div>
                {`Hiển thị ${Math.min((resetPage - 1) * RESET_PAGE_SIZE + 1, resetRequests.length)}-${Math.min(resetPage * RESET_PAGE_SIZE, resetRequests.length)} trong ${resetRequests.length} yêu cầu`}
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => setResetPage((p) => Math.max(1, p - 1))}
                  disabled={resetPage === 1}
                  style={{
                    background: "#1f2937",
                    color: "#fff",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    cursor: resetPage === 1 ? "not-allowed" : "pointer",
                    opacity: resetPage === 1 ? 0.5 : 1,
                  }}
                >
                  Trước
                </button>
                <span>Trang {resetPage}/{Math.max(1, Math.ceil(resetRequests.length / RESET_PAGE_SIZE))}</span>
                <button
                  onClick={() => setResetPage((p) => Math.min(Math.ceil(resetRequests.length / RESET_PAGE_SIZE), p + 1))}
                  disabled={resetPage >= Math.ceil(resetRequests.length / RESET_PAGE_SIZE)}
                  style={{
                    background: "#1f2937",
                    color: "#fff",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    cursor: resetPage >= Math.ceil(resetRequests.length / RESET_PAGE_SIZE) ? "not-allowed" : "pointer",
                    opacity: resetPage >= Math.ceil(resetRequests.length / RESET_PAGE_SIZE) ? 0.5 : 1,
                  }}
                >
                  Sau
                </button>
              </div>
            </div>
            </>
          )}
        </div>
      </div>

      {/* Form tạo tài khoản */}
      <div
        style={{
          background: "rgba(0,0,0,0.3)",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginBottom: "15px", fontSize: "20px" }}>
          {employeeForm.accountType === "admin" ? "Tạo tài khoản admin" : "Tạo tài khoản nhân viên"}
        </h2>
        <form onSubmit={handleCreateEmployee}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#cbd5f5" }}>
              Loại tài khoản:
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="radio"
                  value="employee"
                  checked={employeeForm.accountType === "employee"}
                  onChange={(e) => handleEmployeeInputChange("accountType", e.target.value)}
                  style={{ cursor: "pointer" }}
                />
                <span>Nhân viên</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                <input
                  type="radio"
                  value="admin"
                  checked={employeeForm.accountType === "admin"}
                  onChange={(e) => handleEmployeeInputChange("accountType", e.target.value)}
                  style={{ cursor: "pointer" }}
                />
                <span>Admin</span>
              </label>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Họ"
              value={employeeForm.firstName}
              onChange={(e) => handleEmployeeInputChange("firstName", e.target.value)}
              style={{
                padding: "10px",
                background: "#1a1f29",
                color: "#fff",
                border: "1px solid #333",
                borderRadius: "6px",
                flex: "1",
                minWidth: "120px",
                height: "42px",
                boxSizing: "border-box",
              }}
              required
            />
            <input
              type="text"
              placeholder="Tên"
              value={employeeForm.lastName}
              onChange={(e) => handleEmployeeInputChange("lastName", e.target.value)}
              style={{
                padding: "10px",
                background: "#1a1f29",
                color: "#fff",
                border: "1px solid #333",
                borderRadius: "6px",
                flex: "1",
                minWidth: "120px",
                height: "42px",
                boxSizing: "border-box",
              }}
            />
            <input
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="Email"
              value={employeeForm.email}
              onChange={(e) => handleEmployeeInputChange("email", e.target.value)}
              style={{
                padding: "10px",
                background: "#1a1f29",
                color: "#fff",
                border: "1px solid #333",
                borderRadius: "6px",
                flex: "1",
                minWidth: "150px",
                height: "42px",
                boxSizing: "border-box",
              }}
              required
            />
            <input
              type="tel"
              placeholder="Số điện thoại"
              value={employeeForm.phone}
              onChange={(e) => handleEmployeeInputChange("phone", e.target.value)}
              style={{
                padding: "10px",
                background: "#1a1f29",
                color: "#fff",
                border: "1px solid #333",
                borderRadius: "6px",
                flex: "1",
                minWidth: "140px",
                height: "42px",
                boxSizing: "border-box",
              }}
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={employeeForm.password}
              onChange={(e) => handleEmployeeInputChange("password", e.target.value)}
              style={{
                padding: "10px",
                background: "#1a1f29",
                color: "#fff",
                border: "1px solid #333",
                borderRadius: "6px",
                flex: "1",
                minWidth: "120px",
                height: "42px",
                boxSizing: "border-box",
              }}
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={isCreatingEmployee}
              style={{
                padding: "10px 20px",
                background: isCreatingEmployee 
                  ? "#555" 
                  : employeeForm.accountType === "admin" 
                    ? "#d32f2f" 
                    : "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: isCreatingEmployee ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                height: "42px",
                boxSizing: "border-box",
              }}
            >
              {isCreatingEmployee 
                ? "Đang tạo..." 
                : employeeForm.accountType === "admin" 
                  ? "Tạo tài khoản admin" 
                  : "Tạo tài khoản nhân viên"}
            </button>
          </div>
        </form>
      </div>

      {/* Thanh tìm kiếm và filter */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "15px",
          gap: "10px",
          flexWrap: "wrap",
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
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{
            background: "#1a1f29",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: "5px",
            padding: "8px 12px",
            minWidth: "160px",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="" style={{ background: "#1a1f29" }}>Tất cả vai trò</option>
          <option value="ROLE_ADMIN" style={{ background: "#1a1f29" }}>ADMIN</option>
          <option value="ROLE_EMPLOYEE" style={{ background: "#1a1f29" }}>STAFF</option>
          <option value="ROLE_USER" style={{ background: "#1a1f29" }}>USER</option>
        </select>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
          Đang tải dữ liệu...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#fff" }}>
          {searchTerm || filterRole ? "Không tìm thấy người dùng nào" : "Chưa có người dùng nào"}
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
              <th style={{ padding: "10px", textAlign: "center", width: "7%" }}>Họ</th>
              <th style={{ padding: "10px", textAlign: "center", width: "7%" }}>Tên</th>
              <th style={{ padding: "10px", textAlign: "center", width: "18%" }}>Email</th>
              <th style={{ padding: "10px", textAlign: "center", width: "7%" }}>Phone</th>
              <th style={{ padding: "10px", textAlign: "center", width: "6%" }}>Avatar</th>
              <th style={{ padding: "10px", textAlign: "center", width: "6%" }}>Vai trò</th>
              <th style={{ padding: "10px", textAlign: "center", width: "15%" }}>Rạp được gán</th>
              <th style={{ padding: "10px", textAlign: "center", width: "6%" }}>Status</th>
              <th style={{ padding: "10px", textAlign: "center", width: "18%" }}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.map((u) => {
              const roleBadge = u.roles && u.roles.length > 0 ? renderRoleBadge(u.roles) : null;
              return (
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
                  {roleBadge ? (
                    <span
                      style={{
                        background: roleBadge.color,
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                      }}
                    >
                      {roleBadge.label}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={{ padding: "10px", textAlign: "center" }}>
                  {u.roles && u.roles.includes("ROLE_EMPLOYEE") ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "#cbd5f5", marginBottom: "2px" }}>
                        {getTheaterName(u.theaterId)}
                      </span>
                      <select
                        value={selectedTheaterForUser[u.id] !== undefined ? selectedTheaterForUser[u.id] : (u.theaterId || "")}
                        onChange={(e) => {
                          const newTheaterId = e.target.value ? parseInt(e.target.value, 10) : null;
                          setSelectedTheaterForUser({ ...selectedTheaterForUser, [u.id]: newTheaterId });
                          handleAssignTheater(u.id, newTheaterId);
                        }}
                        disabled={assigningTheater === u.id}
                        style={{
                          background: "#1a1f29",
                          color: "#fff",
                          border: "1px solid #333",
                          borderRadius: "4px",
                          padding: "6px 8px",
                          fontSize: "12px",
                          cursor: assigningTheater === u.id ? "not-allowed" : "pointer",
                          minWidth: "160px",
                          width: "100%",
                          maxWidth: "200px",
                        }}
                      >
                        <option value="">-- Chọn rạp --</option>
                        {theaters.map((theater) => (
                          <option key={theater.id} value={theater.id}>
                            {theater.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    "—"
                  )}
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
                  <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
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
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Phân trang */}
      {!isLoading && filtered.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ color: "#cbd5f5" }}>
            {total > 0
              ? `Hiển thị ${currentRangeStart}-${currentRangeEnd} trong ${total} người dùng`
              : "Không có dữ liệu"}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              style={{
                background: "#1a1f29",
                color: "#fff",
                border: "1px solid #333",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} / trang
                </option>
              ))}
            </select>
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1 || isLoading}
              style={{
                background: "#1f2937",
                color: "#fff",
                border: "1px solid #374151",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: page === 1 || isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                opacity: page === 1 || isLoading ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={16} /> Trước
            </button>
            <div style={{ display: "flex", alignItems: "center", color: "#cbd5f5" }}>
              Trang {page}/{Math.max(totalPages, 1)}
            </div>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || isLoading}
              style={{
                background: "#1f2937",
                color: "#fff",
                border: "1px solid #374151",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: page >= totalPages || isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                opacity: page >= totalPages || isLoading ? 0.5 : 1,
              }}
            >
              Sau <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
