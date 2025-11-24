import axiosClient from "../axiosClient";

const userService = {
  // Lấy danh sách tất cả người dùng (chỉ admin)
  getAllUsers() {
    return axiosClient.get("/users", {
      validateStatus: () => true,
    });
  },

  // Khóa tài khoản người dùng
  blockUser(userId) {
    return axiosClient.patch(`/users/${userId}/block`, {}, {
      validateStatus: () => true,
    });
  },

  // Mở khóa tài khoản người dùng
  unblockUser(userId) {
    return axiosClient.patch(`/users/${userId}/unblock`, {}, {
      validateStatus: () => true,
    });
  },

  // Gán vai trò cho người dùng
  assignRole(userId, roleName) {
    return axiosClient.post(`/users/${userId}/roles`, { role: roleName }, {
      validateStatus: () => true,
    });
  },
};

export default userService;

