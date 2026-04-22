import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Keywords API
export const keywordAPI = {
  getAll: () => api.get('/keywords'),
  add: (keyword) => api.post('/keywords', { keyword }),
  delete: (id) => api.delete(`/keywords/${id}`),
};

// Hotspots API
export const hotspotsAPI = {
  getAll: (limit = 50, offset = 0) =>
    api.get('/hotspots', { params: { limit, offset } }),
  search: (keyword) => api.get('/hotspots/search', { params: { keyword } }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (limit = 50, offset = 0) =>
    api.get('/notifications', { params: { limit, offset } }),
  markAsRead: (id) => api.put(`/notifications/${id}`),
};

// Stats API
export const statsAPI = {
  getStats: () => api.get('/stats'),
};

// Health Check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
