import api from './api';

export const donationService = {
  getBloodBankDonations: async (params = {}) => {
    const response = await api.get('/blood-banks/donations', { params });
    return response.data;
  },

  recordTestResults: async (donationId, testResults) => {
    const response = await api.post(`/blood-banks/donations/${donationId}/test`, {
      testResults,
    });
    return response.data;
  },

  issueBlood: async (donationId) => {
    const response = await api.post(`/blood-banks/donations/${donationId}/issue`);
    return response.data;
  },
};

