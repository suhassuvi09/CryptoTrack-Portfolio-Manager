import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
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
    // Only redirect to login if 401 and not from login/register endpoints
    if (error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/register')) {
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
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      console.log('Login response:', response); // Debug log

      // Handle different response formats
      if (response.data) {
        return {
          token: response.data.token || response.token,
          user: response.data.user || response.user,
        };
      }

      return response;
    } catch (error) {
      console.error('Login service error:', error);
      throw error;
    }
  },

  // Register
  register: async (email, password, confirmPassword) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        confirmPassword,
      });

      console.log('Register response:', response); // Debug log

      // Handle different response formats
      if (response.data) {
        return {
          token: response.data.token || response.token,
          user: response.data.user || response.user,
        };
      }

      return response;
    } catch (error) {
      console.error('Register service error:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout service error:', error);
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
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