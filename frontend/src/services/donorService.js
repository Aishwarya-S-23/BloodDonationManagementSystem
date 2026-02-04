import api from './api';

export const donorService = {
  getProfile: async () => {
    const response = await api.get('/donors/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/donors/profile', profileData);
    return response.data;
  },

  getAppointments: async (params = {}) => {
    const response = await api.get('/donors/appointments', { params });
    return response.data;
  },

  confirmAppointment: async (id) => {
    const response = await api.post(`/donors/appointments/${id}/confirm`);
    return response.data;
  },

  checkEligibility: async () => {
    const response = await api.get('/donors/eligibility');
    return response.data;
  },

  // New donor response methods
  getDonationRequests: async (params = {}) => {
    const response = await api.get('/donors/requests', { params });
    return response.data;
  },

  respondToRequest: async (requestId, response, reason = '') => {
    const responseData = await api.post(`/donors/requests/${requestId}/respond`, {
      response, // 'accept' or 'decline'
      reason
    });
    return responseData.data;
  },

  getNotifications: async (params = {}) => {
    const response = await api.get('/donors/notifications', { params });
    return response.data;
  },

  markNotificationRead: async (notificationId) => {
    const response = await api.put(`/donors/notifications/${notificationId}/read`);
    return response.data;
  },

  getDonationHistory: async (params = {}) => {
    const response = await api.get('/donors/history', { params });
    return response.data;
  },

  updateAvailability: async (availability) => {
    const response = await api.put('/donors/availability', { availability });
    return response.data;
  },
};

