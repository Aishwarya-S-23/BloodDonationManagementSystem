import api from './api';

export const collegeService = {
  getEscalatedRequests: async () => {
    const response = await api.get('/colleges/requests');
    return response.data;
  },

  mobilizeDonors: async (requestId) => {
    const response = await api.post('/colleges/donors/mobilize', { requestId });
    return response.data;
  },
};

