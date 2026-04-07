import api from './api';
import appConfig from '../config/appConfig';

export const authService = {
  async register(data) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  getSocialLoginUrl(provider) {
    return `${appConfig.apiBaseUrl}/auth/oauth/${provider}/start`;
  },

  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  async getMe() {
    const response = await api.get('/users/me');
    return response.data;
  },

  async updateMe(data) {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  async changePassword(data) {
    const response = await api.put('/users/me/password', data);
    return response.data;
  },

  async getMyStats() {
    const response = await api.get('/users/me/stats');
    return response.data;
  },

  async getNotificationPreferences() {
    const response = await api.get('/users/me/notifications');
    return response.data;
  },

  async updateNotificationPreferences(data) {
    const response = await api.put('/users/me/notifications', data);
    return response.data;
  },
};
