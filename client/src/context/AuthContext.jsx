import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('cryptotrack_token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AuthActionTypes = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  UPDATE_PROFILE_SUCCESS: 'UPDATE_PROFILE_SUCCESS',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AuthActionTypes.LOGIN_START:
    case AuthActionTypes.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AuthActionTypes.LOGIN_SUCCESS:
    case AuthActionTypes.REGISTER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };

    case AuthActionTypes.LOGIN_FAILURE:
    case AuthActionTypes.REGISTER_FAILURE:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };

    case AuthActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      };

    case AuthActionTypes.LOAD_USER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };

    case AuthActionTypes.LOAD_USER_FAILURE:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };

    case AuthActionTypes.UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        user: action.payload,
        error: null,
      };

    case AuthActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AuthActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app initialization
  useEffect(() => {
    loadUser();
  }, []);

  // Update localStorage when token changes
  useEffect(() => {
    if (state.token) {
      localStorage.setItem('cryptotrack_token', state.token);
      authService.setAuthToken(state.token);
    } else {
      localStorage.removeItem('cryptotrack_token');
      authService.setAuthToken(null);
    }
  }, [state.token]);

  // Load user from token
  const loadUser = async () => {
    const token = localStorage.getItem('cryptotrack_token');

    if (!token) {
      dispatch({ type: AuthActionTypes.SET_LOADING, payload: false });
      return;
    }

    try {
      authService.setAuthToken(token);
      const response = await authService.getCurrentUser();

      dispatch({
        type: AuthActionTypes.LOAD_USER_SUCCESS,
        payload: response.user,
      });
    } catch (error) {
      console.error('Failed to load user:', error);
      dispatch({
        type: AuthActionTypes.LOAD_USER_FAILURE,
        payload: error.response?.data?.message || 'Failed to load user',
      });
      localStorage.removeItem('cryptotrack_token');
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AuthActionTypes.LOGIN_START });

      const response = await authService.login(email, password);

      dispatch({
        type: AuthActionTypes.LOGIN_SUCCESS,
        payload: response,
      });

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      // Handle error from transformed interceptor response
      const message = error.message || error.response?.data?.message || 'Login failed';

      dispatch({
        type: AuthActionTypes.LOGIN_FAILURE,
        payload: message,
      }); toast.error(message);
      return { success: false, error: message };
    }
  };  // Register function
  const register = async (email, password, confirmPassword) => {
    try {
      dispatch({ type: AuthActionTypes.REGISTER_START });

      const response = await authService.register(email, password, confirmPassword);

      dispatch({
        type: AuthActionTypes.REGISTER_SUCCESS,
        payload: response,
      });

      toast.success('Registration successful! Welcome to CryptoTrack!');
      return { success: true };
    } catch (error) {
      // Handle error from transformed interceptor response
      const message = error.message || error.response?.data?.message || 'Registration failed';

      dispatch({
        type: AuthActionTypes.REGISTER_FAILURE,
        payload: message,
      });

      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AuthActionTypes.LOGOUT });
      localStorage.removeItem('cryptotrack_token');
      authService.setAuthToken(null);
      toast.success('Logged out successfully');
    }
  };

  // Update profile function
  const updateProfile = async (profileData, showNotification = true) => {
    try {
      const response = await authService.updateProfile(profileData);

      dispatch({
        type: AuthActionTypes.UPDATE_PROFILE_SUCCESS,
        payload: response.user,
      });

      if (showNotification) {
        toast.success('Profile updated successfully');
      }
      return { success: true, user: response.user };
    } catch (error) {
      // Handle error from transformed interceptor response
      const message = error.message || error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword, confirmNewPassword);
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      // Handle error from transformed interceptor response
      const message = error.message || error.response?.data?.message || 'Failed to change password';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AuthActionTypes.CLEAR_ERROR });
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return state.isAuthenticated && state.user && state.token;
  };

  // Get user preferences
  const getUserPreferences = () => {
    return state.user?.preferences || { currency: 'usd', theme: 'light' };
  };

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    loadUser,
    clearError,

    // Helper functions
    getUserPreferences,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;