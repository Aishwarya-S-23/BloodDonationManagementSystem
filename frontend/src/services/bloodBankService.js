import api from './api';

export const bloodBankService = {
  // Add inventory to blood bank
  addInventory: async (inventoryData) => {
    const response = await api.post('/blood-banks/inventory', inventoryData);
    return response.data;
  },

  // Get blood bank inventory
  getInventory: async (params = {}) => {
    const response = await api.get('/blood-banks/inventory', { params });
    return response.data;
  },

  // Get assigned requests
  getAssignedRequests: async () => {
    const response = await api.get('/blood-banks/requests');
    return response.data;
  },

  // Fulfill request from inventory
  fulfillRequest: async (requestData) => {
    const response = await api.post('/blood-banks/inventory/fulfill', requestData);
    return response.data;
  },

  // Get expiring inventory
  getExpiringInventory: async (days = 7) => {
    const response = await api.get('/blood-banks/inventory/expiring', {
      params: { days }
    });
    return response.data;
  },

  // Get donations for blood bank
  getDonations: async (params = {}) => {
    const response = await api.get('/blood-banks/donations', { params });
    return response.data;
  },

  // Record test results for donation
  recordTestResults: async (donationId, testResults) => {
    const response = await api.post(`/blood-banks/donations/${donationId}/test`, { testResults });
    return response.data;
  },

  // Issue blood from donation
  issueBlood: async (donationId) => {
    const response = await api.post(`/blood-banks/donations/${donationId}/issue`);
    return response.data;
  },

  // Update blood bank profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
};

export default bloodBankService;
