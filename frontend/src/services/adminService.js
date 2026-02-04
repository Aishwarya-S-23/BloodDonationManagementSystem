import api from './api';

export const adminService = {
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data.data || response.data;
  },

  getAuditLogs: async (params = {}) => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data.data || response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/admin/statistics');
    return response.data.data || response.data;
  },
  changeUserRole: async (userId, role) => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },
};

