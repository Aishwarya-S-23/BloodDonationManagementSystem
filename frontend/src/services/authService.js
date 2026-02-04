import api from './api';

// Auth service for handling authentication API calls
class AuthService {
  // Register a new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Auth service - register error:', error);
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Auth service - login error:', error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Auth service - logout error:', error);
      throw error;
    }
  }

  // Get current user profile
  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Auth service - getProfile error:', error);
      throw error;
    }
  }

  // Verify token
  async verifyToken() {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      console.error('Auth service - verifyToken error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Auth service - updateProfile error:', error);
      throw error;
    }
  }

  // Check if user is authenticated (client-side check)
  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Get stored user data
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('token');
  }

  // Clear stored auth data
  clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export const authService = new AuthService();
export default authService;
