import api from './api';

export const adminService = {
  async getStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  async getUsers(page = 1, pageSize = 20) {
    const response = await api.get(`/admin/users?page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  async createUser(data) {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  async updateUser(id, data) {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  async getModelInfo() {
    const response = await api.get('/admin/model');
    return response.data;
  },

  async getAnalyses(page = 1, pageSize = 20, search = '') {
    const response = await api.get(`/admin/analyses?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`);
    return response.data;
  },

  async getAnalytics() {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  async getServerStatus() {
    const response = await api.get('/admin/server');
    return response.data;
  },

  async getSettings() {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  async updateSettings(data) {
    const response = await api.put('/admin/settings', data);
    return response.data;
  },
};
