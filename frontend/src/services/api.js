import axios from 'axios';
import { getRetryAfter } from '../utils/retryHandler';
import requestQueue from '../utils/requestQueue';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'; // Revert to port 5000

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store original axios instance for retry
api.defaults.axiosInstance = api;

// Request interceptor - Add JWT token and queue requests
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Queue non-critical requests (GET requests can be queued)
    // Critical requests (POST, PUT, DELETE) bypass queue for better UX
    const isCritical = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase());
    const shouldQueue = !isCritical && !config.__skipQueue;
    
    if (shouldQueue) {
      // Wait for queue to process, then return config
      await requestQueue.enqueue(() => Promise.resolve(), config.__priority || 0);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    
    // Handle 401 errors (authentication)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Handle 429 errors (rate limiting) with retry
    if (error.response?.status === 429) {
      // Don't retry if already retried or retry disabled
      if (config.__retryDisabled || config.__retryCount >= 3) {
        const retryAfter = getRetryAfter(error);
        const message = retryAfter 
          ? `Too many requests. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`
          : error.response?.data?.message || 'Too many requests. Please try again later.';
        
        error.userMessage = message;
        return Promise.reject(error);
      }
      
      // Retry with exponential backoff
      config.__retryCount = (config.__retryCount || 0) + 1;
      
      const retryAfter = getRetryAfter(error);
      const delay = retryAfter || Math.min(1000 * Math.pow(2, config.__retryCount - 1), 30000);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the request
      return api.request(config);
    }
    
    // Handle network errors (no response) with retry
    if (!error.response && !config.__retryDisabled) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      
      if (config.__retryCount <= 3) {
        const delay = Math.min(1000 * Math.pow(2, config.__retryCount - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return api.request(config);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

