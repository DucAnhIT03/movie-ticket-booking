import React, { useState, useEffect, useMemo } from "react";
import { Mail, Send, Search, Eye, Filter, X, Upload, Users, FileText } from "lucide-react";
import { toast } from "react-toastify";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import emailService from "../../services/email/emailService";
import userService from "../../services/users/userService";
import uploadService from "../../services/uploads/uploadService";
import "./EmailNotificationManagement.css";

export default function EmailNotificationManagement() {
  const [activeTab, setActiveTab] = useState("send"); 
  const [isLoading, setIsLoading] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(null); 
  
  
  const [formData, setFormData] = useState({
    to: "",
    toType: "single",
    subject: "",
    message: "",
    notificationType: "GENERAL",
  });

  
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [fileEmails, setFileEmails] = useState([]); 
  const [filterCriteria, setFilterCriteria] = useState({
    status: "all", 
  });

  
  const [emailLogs, setEmailLogs] = useState([]);
  const [emailStats, setEmailStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "",
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Nhập nội dung email...",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "tiptap-link",
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: formData.message,
    onUpdate: ({ editor }) => {
      setFormData({ ...formData, message: editor.getHTML() });
    },
  });

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB!");
      return;
    }

    setUploadingImage(true);
    try {
      const response = await uploadService.uploadSingle(file, "emails", "email", "content");
      if (response.status === 200 || response.status === 201) {
        const imageUrl = response.data?.url || response.data?.data?.url || response.data?.secure_url || response.data;
        
        if (imageUrl && editor) {
          editor.chain().focus().setImage({ src: imageUrl }).run();
          toast.success("Đã chèn ảnh thành công!");
        } else {
          toast.error("Không thể lấy URL ảnh!");
        }
      } else {
        toast.error("Upload ảnh thất bại!");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Lỗi khi upload ảnh!");
    } finally {
      setUploadingImage(false);
      // Reset input để có thể chọn cùng file lần nữa
      event.target.value = "";
    }
  };

  // Cập nhật editor khi formData.message thay đổi từ bên ngoài
  useEffect(() => {
    if (editor && formData.message !== editor.getHTML()) {
      editor.commands.setContent(formData.message || "");
    }
  }, [formData.message, editor]);

  const loadUsers = async () => {
    try {
      const res = await userService.getAllUsers();
      if (res.status === 200) {
        setUsers(res.data || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadEmailLogs = async () => {
    setIsLoading(true);
    try {
      const res = await emailService.getEmailLogs({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined,
      });
      if (res.status === 200) {
        setEmailLogs(res.data.items || []);
        setPagination({
          page: res.data.page || 1,
          limit: res.data.limit || 10,
          total: res.data.total || 0,
          totalPages: res.data.totalPages || 0,
        });
      }
    } catch (error) {
      console.error("Error loading email logs:", error);
      toast.error("Lỗi khi tải lịch sử email!");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmailStats = async () => {
    try {
      const res = await emailService.getEmailStats();
      if (res.status === 200) {
        setEmailStats(res.data || emailStats);
      }
    } catch (error) {
      console.error("Error loading email stats:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "send") {
      loadUsers();
    }
  }, [activeTab]);

  
  useEffect(() => {
    if (activeTab === "history") {
      loadEmailLogs();
      loadEmailStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pagination.page, pagination.limit, filters.search, filters.status, filters.type]);

  // Xử lý upload file danh sách email
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "text/plain" && !file.name.endsWith(".txt") && !file.name.endsWith(".csv")) {
      toast.error("Chỉ chấp nhận file .txt hoặc .csv!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const emails = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => {
          
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return line && emailRegex.test(line);
        });

      if (emails.length === 0) {
        toast.error("Không tìm thấy email hợp lệ trong file!");
        return;
      }

      setFileEmails(emails);
      toast.success(`Đã tải ${emails.length} email từ file!`);
    };

    reader.readAsText(file);
    e.target.value = ""; 
  };

 
  const getRecipients = () => {
    switch (formData.toType) {
      case "single":
        return formData.to ? [formData.to] : [];
      case "multiple":
        return selectedUsers
          .map((userId) => {
            const user = users.find((u) => u.id === userId);
            return user?.email;
          })
          .filter(Boolean);
      case "all":
        return users.map((u) => u.email).filter(Boolean);
      case "file":
        return fileEmails;
      case "filter":
        let filteredUsers = users;
        if (filterCriteria.status === "active") {
          filteredUsers = users.filter((u) => u.status === "ACTIVE");
        } else if (filterCriteria.status === "inactive") {
          filteredUsers = users.filter((u) => u.status !== "ACTIVE");
        }
        return filteredUsers.map((u) => u.email).filter(Boolean);
      default:
        return [];
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    
    const recipients = getRecipients();

    if (recipients.length === 0) {
      toast.error("Vui lòng chọn ít nhất một người nhận!");
      return;
    }

    if (!formData.subject) {
      toast.error("Vui lòng nhập tiêu đề!");
      return;
    }

    if (!formData.message) {
      toast.error("Vui lòng nhập nội dung!");
      return;
    }

    // Xác nhận nếu gửi hàng loạt
    if (recipients.length > 10) {
      const confirmed = window.confirm(
        `Bạn sắp gửi email đến ${recipients.length} người nhận. Bạn có chắc chắn muốn tiếp tục?`
      );
      if (!confirmed) return;
    }

    setIsLoading(true);
    setSendingProgress({ total: recipients.length, sent: 0, failed: 0 });

    try {
      // Gửi theo batch nếu số lượng lớn
      const batchSize = 50;
      let sent = 0;
      let failed = 0;

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        try {
          const response = await emailService.sendEmail({
            to: formData.toType === "single" ? formData.to : undefined,
            recipients: formData.toType !== "single" ? batch : undefined,
            subject: formData.subject,
            message: formData.message,
            notificationType: formData.notificationType,
          });

          if (response.status === 200 || response.status === 201) {
            sent += batch.length;
          } else {
            failed += batch.length;
          }
        } catch (error) {
          failed += batch.length;
        }

        setSendingProgress({ total: recipients.length, sent, failed });

        if (i + batchSize < recipients.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      if (failed === 0) {
        toast.success(`Đã gửi thành công ${sent} email!`);
      } else {
        toast.warning(`Đã gửi ${sent} email, ${failed} email thất bại!`);
      }

      setFormData({
        to: "",
        toType: "single",
        subject: "",
        message: "",
        notificationType: "GENERAL",
      });
      if (editor) {
        editor.commands.setContent("");
      }
      setSelectedUsers([]);
      setFileEmails([]);
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Lỗi khi gửi email!");
    } finally {
      setIsLoading(false);
      setSendingProgress(null);
    }
  };

  const handleViewLog = async (logId) => {
    try {
      const res = await emailService.getEmailLogDetail(logId);
      if (res.status === 200) {
        setSelectedLog(res.data);
      }
    } catch (error) {
      console.error("Error loading email log detail:", error);
      toast.error("Lỗi khi tải chi tiết email!");
    }
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  return (
    <div className="email-notification-management">
      <div className="email-header">
        <h1>
          <Mail size={24} /> Quản Lý Email & Thông Báo
        </h1>
      </div>

      {/* Tabs */}
      <div className="email-tabs">
        <button
          className={activeTab === "send" ? "active" : ""}
          onClick={() => setActiveTab("send")}
        >
          <Send size={18} /> Gửi Email/Thông Báo
        </button>
        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => setActiveTab("history")}
        >
          <Eye size={18} /> Lịch Sử Email
        </button>
      </div>

      {/* Tab: Gửi Email */}
      {activeTab === "send" && (
        <div className="email-send-form">
          <form onSubmit={handleSendEmail}>
            <div className="form-group">
              <label>Gửi đến:</label>
              <div className="radio-group bulk-options">
                <label>
                  <input
                    type="radio"
                    value="single"
                    checked={formData.toType === "single"}
                    onChange={(e) =>
                      setFormData({ ...formData, toType: e.target.value })
                    }
                  />
                  <Mail size={16} /> Gửi đến một email cụ thể
                </label>
                <label>
                  <input
                    type="radio"
                    value="multiple"
                    checked={formData.toType === "multiple"}
                    onChange={(e) =>
                      setFormData({ ...formData, toType: e.target.value })
                    }
                  />
                  <Users size={16} /> Chọn nhiều người dùng
                </label>
                <label>
                  <input
                    type="radio"
                    value="all"
                    checked={formData.toType === "all"}
                    onChange={(e) =>
                      setFormData({ ...formData, toType: e.target.value })
                    }
                  />
                  <Users size={16} /> Gửi đến TẤT CẢ người dùng ({users.length} users)
                </label>
                <label>
                  <input
                    type="radio"
                    value="file"
                    checked={formData.toType === "file"}
                    onChange={(e) =>
                      setFormData({ ...formData, toType: e.target.value })
                    }
                  />
                  <FileText size={16} /> Upload file danh sách email
                </label>
                <label>
                  <input
                    type="radio"
                    value="filter"
                    checked={formData.toType === "filter"}
                    onChange={(e) =>
                      setFormData({ ...formData, toType: e.target.value })
                    }
                  />
                  <Filter size={16} /> Gửi theo bộ lọc
                </label>
              </div>
              
              {/* Hiển thị số lượng recipients */}
              {getRecipients().length > 0 && (
                <div className="recipients-count">
                  <strong>Số lượng người nhận: {getRecipients().length}</strong>
                </div>
              )}
            </div>

            {/* Single email */}
            {formData.toType === "single" && (
              <div className="form-group">
                <label>Email người nhận <span style={{ color: "#e53935" }}>*</span></label>
                <input
                  type="email"
                  value={formData.to}
                  onChange={(e) =>
                    setFormData({ ...formData, to: e.target.value })
                  }
                  placeholder="user@example.com"
                  required
                />
              </div>
            )}

            {/* Multiple users selection */}
            {formData.toType === "multiple" && (
              <div className="form-group">
                <label>
                  Chọn người dùng <span style={{ color: "#e53935" }}>*</span>
                  <button
                    type="button"
                    onClick={handleSelectAllUsers}
                    className="select-all-btn"
                  >
                    {selectedUsers.length === users.length
                      ? "Bỏ chọn tất cả"
                      : "Chọn tất cả"}
                  </button>
                </label>
                <div className="users-list">
                  {users.map((user) => (
                    <label key={user.id} className="user-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserToggle(user.id)}
                      />
                      <span>
                        {user.firstName} {user.lastName} ({user.email})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Upload file */}
            {formData.toType === "file" && (
              <div className="form-group">
                <label>
                  Upload file danh sách email <span style={{ color: "#e53935" }}>*</span>
                </label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    id="email-file-input"
                    style={{ display: "none" }}
                  />
                  <label htmlFor="email-file-input" className="file-upload-btn">
                    <Upload size={18} /> Chọn file (.txt hoặc .csv)
                  </label>
                  {fileEmails.length > 0 && (
                    <div className="file-info">
                      <FileText size={16} /> Đã tải {fileEmails.length} email từ file
                      <button
                        type="button"
                        onClick={() => setFileEmails([])}
                        className="clear-file-btn"
                      >
                        <X size={14} /> Xóa
                      </button>
                    </div>
                  )}
                  <small style={{ color: "#aaa", display: "block", marginTop: "8px" }}>
                    Format: Mỗi dòng một email. Ví dụ:<br />
                    user1@example.com<br />
                    user2@example.com
                  </small>
                </div>
              </div>
            )}

            {/* Filter options */}
            {formData.toType === "filter" && (
              <div className="form-group">
                <label>
                  Bộ lọc người dùng <span style={{ color: "#e53935" }}>*</span>
                </label>
                <select
                  value={filterCriteria.status}
                  onChange={(e) =>
                    setFilterCriteria({ ...filterCriteria, status: e.target.value })
                  }
                >
                  <option value="all">Tất cả người dùng</option>
                  <option value="active">Chỉ người dùng active</option>
                  <option value="inactive">Chỉ người dùng inactive</option>
                </select>
                <div className="filter-preview">
                  Sẽ gửi đến:{" "}
                  <strong>
                    {filterCriteria.status === "all"
                      ? users.length
                      : filterCriteria.status === "active"
                      ? users.filter((u) => u.status === "ACTIVE").length
                      : users.filter((u) => u.status !== "ACTIVE").length}
                  </strong>{" "}
                  người dùng
                </div>
              </div>
            )}

            {/* All users - chỉ hiển thị thông tin */}
            {formData.toType === "all" && (
              <div className="form-group">
                <div className="info-box">
                  <Users size={20} />
                  <div>
                    <strong>Gửi đến tất cả {users.length} người dùng trong hệ thống</strong>
                    <p style={{ margin: "5px 0 0 0", color: "#aaa", fontSize: "13px" }}>
                      Email sẽ được gửi đến tất cả người dùng đã đăng ký
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>
                Loại thông báo
              </label>
              <select
                value={formData.notificationType}
                onChange={(e) =>
                  setFormData({ ...formData, notificationType: e.target.value })
                }
              >
                <option value="GENERAL">Thông báo chung</option>
                <option value="PROMOTION">Khuyến mãi</option>
                <option value="EVENT">Sự kiện</option>
                <option value="SYSTEM">Hệ thống</option>
                <option value="NEWS">Tin tức</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Tiêu đề <span style={{ color: "#e53935" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="Nhập tiêu đề email..."
                required
              />
            </div>

            <div className="form-group">
              <label>
                Nội dung <span style={{ color: "#e53935" }}>*</span>
              </label>
              {editor && (
                <div className="tiptap-editor-wrapper">
                  <div className="tiptap-toolbar">
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={editor.isActive("bold") ? "is-active" : ""}
                      title="Bold"
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={editor.isActive("italic") ? "is-active" : ""}
                      title="Italic"
                    >
                      <em>I</em>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleStrike().run()}
                      className={editor.isActive("strike") ? "is-active" : ""}
                      title="Strike"
                    >
                      <s>S</s>
                    </button>
                    <div className="toolbar-divider"></div>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
                      title="Heading 1"
                    >
                      H1
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
                      title="Heading 2"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
                      title="Heading 3"
                    >
                      H3
                    </button>
                    <div className="toolbar-divider"></div>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={editor.isActive("bulletList") ? "is-active" : ""}
                      title="Bullet List"
                    >
                      •
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={editor.isActive("orderedList") ? "is-active" : ""}
                      title="Numbered List"
                    >
                      1.
                    </button>
                    <div className="toolbar-divider"></div>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().setTextAlign("left").run()}
                      className={editor.isActive({ textAlign: "left" }) ? "is-active" : ""}
                      title="Align Left"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().setTextAlign("center").run()}
                      className={editor.isActive({ textAlign: "center" }) ? "is-active" : ""}
                      title="Align Center"
                    >
                      ↔
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().setTextAlign("right").run()}
                      className={editor.isActive({ textAlign: "right" }) ? "is-active" : ""}
                      title="Align Right"
                    >
                      →
                    </button>
                    <div className="toolbar-divider"></div>
                    <button
                      type="button"
                      onClick={() => {
                        const url = window.prompt("Nhập URL:");
                        if (url) {
                          editor.chain().focus().setLink({ href: url }).run();
                        }
                      }}
                      className={editor.isActive("link") ? "is-active" : ""}
                      title="Link"
                    >
                      🔗
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().unsetLink().run()}
                      disabled={!editor.isActive("link")}
                      title="Remove Link"
                    >
                      🔗✕
                    </button>
                    <div className="toolbar-divider"></div>
                    <label
                      className="toolbar-image-button"
                      title="Chèn ảnh"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        style={{ display: "none" }}
                      />
                      {uploadingImage ? "⏳" : "🖼️"}
                    </label>
                  </div>
                  <div className="tiptap-content">
                    <EditorContent editor={editor} />
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar khi đang gửi */}
            {sendingProgress && (
              <div className="sending-progress">
                <div className="progress-header">
                  <span>
                    Đang gửi: {sendingProgress.sent} / {sendingProgress.total}
                  </span>
                  {sendingProgress.failed > 0 && (
                    <span className="failed-count">
                      Thất bại: {sendingProgress.failed}
                    </span>
                  )}
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(sendingProgress.sent / sendingProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="send-btn" disabled={isLoading}>
              <Send size={18} /> {isLoading ? "Đang gửi..." : "Gửi Email"}
            </button>
          </form>
        </div>
      )}

      {/* Tab: Lịch Sử Email */}
      {activeTab === "history" && (
        <div className="email-history">
          {/* Stats */}
          <div className="email-stats">
            <div className="stat-card">
              <h3>Tổng số</h3>
              <p>{emailStats.total}</p>
            </div>
            <div className="stat-card success">
              <h3>Đã gửi</h3>
              <p>{emailStats.sent}</p>
            </div>
            <div className="stat-card error">
              <h3>Thất bại</h3>
              <p>{emailStats.failed}</p>
            </div>
            <div className="stat-card warning">
              <h3>Đang chờ</h3>
              <p>{emailStats.pending}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="email-filters">
            <div className="filter-group">
              <Search size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm theo email, subject..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SENT">Đã gửi</option>
              <option value="PENDING">Đang chờ</option>
              <option value="FAILED">Thất bại</option>
            </select>
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters({ ...filters, type: e.target.value })
              }
            >
              <option value="">Tất cả loại</option>
              <option value="GENERAL">Thông báo chung</option>
              <option value="PROMOTION">Khuyến mãi</option>
              <option value="EVENT">Sự kiện</option>
              <option value="SYSTEM">Hệ thống</option>
            </select>
            {(filters.search || filters.status || filters.type) && (
              <button
                onClick={() => setFilters({ search: "", status: "", type: "" })}
                className="clear-filters-btn"
              >
                <X size={16} /> Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Email Logs Table */}
          <div className="email-logs-table">
            {isLoading ? (
              <div className="loading">Đang tải...</div>
            ) : emailLogs.length === 0 ? (
              <div className="no-data">Chưa có email nào</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Người nhận</th>
                    <th>Tiêu đề</th>
                    <th>Loại</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ wordBreak: "normal" }}>{log.id}</td>
                      <td style={{ wordBreak: "break-all" }}>{log.to || "—"}</td>
                      <td style={{ wordBreak: "break-word", maxWidth: "300px" }} title={log.subject || ""}>
                        {log.subject || "—"}
                      </td>
                      <td style={{ wordBreak: "break-word" }}>{log.type || "N/A"}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            log.status === "SENT"
                              ? "success"
                              : log.status === "FAILED"
                              ? "error"
                              : "warning"
                          }`}
                        >
                          {log.status === "SENT"
                            ? "Đã gửi"
                            : log.status === "FAILED"
                            ? "Thất bại"
                            : "Đang chờ"}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {log.sentAt
                          ? new Date(log.sentAt).toLocaleString("vi-VN")
                          : "N/A"}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => handleViewLog(log.id)}
                          className="view-btn"
                        >
                          <Eye size={16} /> Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                >
                  Trước
                </button>
                <span>
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal xem chi tiết email log */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết Email</h2>
              <button onClick={() => setSelectedLog(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-item">
                <strong>ID:</strong> {selectedLog.id}
              </div>
              <div className="detail-item">
                <strong>Người nhận:</strong> {selectedLog.to}
              </div>
              <div className="detail-item">
                <strong>Tiêu đề:</strong> {selectedLog.subject}
              </div>
              <div className="detail-item">
                <strong>Loại:</strong> {selectedLog.type || "N/A"}
              </div>
              <div className="detail-item">
                <strong>Trạng thái:</strong>{" "}
                <span
                  className={`status-badge ${
                    selectedLog.status === "SENT"
                      ? "success"
                      : selectedLog.status === "FAILED"
                      ? "error"
                      : "warning"
                  }`}
                >
                  {selectedLog.status}
                </span>
              </div>
              {selectedLog.error && (
                <div className="detail-item">
                  <strong>Lỗi:</strong>
                  <div className="error-message">{selectedLog.error}</div>
                </div>
              )}
              <div className="detail-item">
                <strong>Thời gian gửi:</strong>{" "}
                {selectedLog.sentAt
                  ? new Date(selectedLog.sentAt).toLocaleString("vi-VN")
                  : "N/A"}
              </div>
              {selectedLog.metadata && (
                <div className="detail-item">
                  <strong>Metadata:</strong>
                  <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

