import api from './api';

export const requestService = {
  createRequest: async (requestData) => {
    const response = await api.post('/hospitals/requests', requestData);
    return response.data.data || response.data;
  },

  getHospitalRequests: async (params = {}) => {
    const response = await api.get('/hospitals/requests', { params });
    return response.data.data || response.data;
  },

  getRequestDetails: async (id) => {
    const response = await api.get(`/hospitals/requests/${id}`);
    return response.data.data || response.data;
  },

  cancelRequest: async (id) => {
    const response = await api.put(`/hospitals/requests/${id}/cancel`);
    return response.data.data || response.data;
  },

  getBloodBankRequests: async () => {
    const response = await api.get('/blood-banks/requests');
    return response.data.data || response.data;
  },

  fulfillRequest: async (requestId, units) => {
    const response = await api.post('/blood-banks/inventory/fulfill', {
      requestId,
      units,
    });
    return response.data;
  },
};

