import axios from 'axios';

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cryptotrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('cryptotrack_token');
      window.location.href = '/login';
    }
    
    // Network error
    if (!error.response) {
      return Promise.reject({
        message: 'Network error - please check your connection',
        status: 'NETWORK_ERROR',
      });
    }
    
    // Server error with custom message
    const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
    
    return Promise.reject({
      message: errorMessage,
      status: error.response.status,
      response: error.response,
    });
  }
);

// Set auth token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('cryptotrack_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('cryptotrack_token');
  }
};

// Auth service
export const authService = {
  // Set auth token
  setAuthToken,

  // Login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  // Register
  register: async (email, password, confirmPassword) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      confirmPassword,
    });
    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAuthToken(null);
    }
  },

  // Get current user
  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },

  // Update profile
  updateProfile: async (profileData) => {
    return await api.put('/auth/profile', profileData);
  },

  // Change password
  changePassword: async (currentPassword, newPassword, confirmNewPassword) => {
    return await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
  },
};

export default api;