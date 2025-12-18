import api from './Api';

export const adminService = {
  async getStats() {
    const { data } = await api.get('/admin/stats');
    return data?.data;
  },

  async getAllUsers(params = {}) {
    const { data } = await api.get('/admin/users', { params });
    return data?.data;
  },

  async changeUserRole(userId, role) {
    const { data } = await api.put(`/admin/users/${userId}/role`, { role });
    return data?.data;
  },

  async deleteUser(userId) {
    const { data } = await api.delete(`/admin/users/${userId}`);
    return data;
  }
};


