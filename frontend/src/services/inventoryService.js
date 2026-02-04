import api from './api';

export const inventoryService = {
  getInventory: async (params = {}) => {
    const response = await api.get('/blood-banks/inventory', { params });
    return response.data.data || response.data;
  },

  getExpiringInventory: async (thresholdDays = 7) => {
    const response = await api.get('/blood-banks/inventory/expiring', {
      params: { thresholdDays },
    });
    return response.data.data || response.data;
  },

  markExpired: async () => {
    const response = await api.post('/blood-banks/inventory/mark-expired');
    return response.data;
  },
};

