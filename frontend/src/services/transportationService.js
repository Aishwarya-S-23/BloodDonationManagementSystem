import api from './api';

export const transportationService = {
  // Create transportation request
  createTransportation: async (transportData) => {
    const response = await api.post('/transportation/create', transportData);
    return response.data;
  },

  // Get transportation details
  getTransportationDetails: async (id) => {
    const response = await api.get(`/transportation/${id}`);
    return response.data;
  },

  // Get transportations with filters
  getTransportations: async (params = {}) => {
    const response = await api.get('/transportation', { params });
    return response.data;
  },

  // Update transportation status
  updateTransportationStatus: async (id, statusData) => {
    const response = await api.put(`/transportation/${id}/status`, statusData);
    return response.data;
  },

  // Log temperature reading
  logTemperature: async (id, temperatureData) => {
    const response = await api.post(`/transportation/${id}/temperature`, temperatureData);
    return response.data;
  },

  // Assign driver
  assignDriver: async (id, driverId) => {
    const response = await api.put(`/transportation/${id}/assign-driver`, { driverId });
    return response.data;
  },

  // Report issue
  reportIssue: async (id, issueData) => {
    const response = await api.post(`/transportation/${id}/issue`, issueData);
    return response.data;
  },
};

export default transportationService;
