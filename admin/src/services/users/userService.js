import axiosClient from "../axiosClient";

const userService = {
  
  getAllUsers() {
    return axiosClient.get("/users", {
      validateStatus: () => true,
    });
  },


  blockUser(userId) {
    return axiosClient.patch(`/users/${userId}/block`, {}, {
      validateStatus: () => true,
    });
  },

 
  unblockUser(userId) {
    return axiosClient.patch(`/users/${userId}/unblock`, {}, {
      validateStatus: () => true,
    });
  },

  createEmployee(payload) {
    return axiosClient.post("/users/employees", payload, {
      validateStatus: () => true,
    });
  },

  
  assignRole(userId, roleName) {
    return axiosClient.post(`/users/${userId}/roles`, { role: roleName }, {
      validateStatus: () => true,
    });
  },
};

export default userService;

