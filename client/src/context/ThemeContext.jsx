import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  theme: 'light', // 'light' or 'dark'
  systemTheme: 'light',
  isSystemTheme: false,
};

// Action types
const ThemeActionTypes = {
  SET_THEME: 'SET_THEME',
  SET_SYSTEM_THEME: 'SET_SYSTEM_THEME',
  TOGGLE_THEME: 'TOGGLE_THEME',
  SET_AUTO_THEME: 'SET_AUTO_THEME',
  LOAD_THEME: 'LOAD_THEME',
};

// Reducer function
const themeReducer = (state, action) => {
  switch (action.type) {
    case ThemeActionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload,
        isSystemTheme: false,
      };

    case ThemeActionTypes.SET_SYSTEM_THEME:
      return {
        ...state,
        systemTheme: action.payload,
        theme: state.isSystemTheme ? action.payload : state.theme,
      };

    case ThemeActionTypes.TOGGLE_THEME:
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
        isSystemTheme: false,
      };

    case ThemeActionTypes.SET_AUTO_THEME:
      return {
        ...state,
        isSystemTheme: action.payload,
        theme: action.payload ? state.systemTheme : state.theme,
      };

    case ThemeActionTypes.LOAD_THEME:
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
};

// Create context
const ThemeContext = createContext();

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);
  const { user, updateProfile } = useAuth();

  // Detect system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      const systemTheme = e.matches ? 'dark' : 'light';
      dispatch({
        type: ThemeActionTypes.SET_SYSTEM_THEME,
        payload: systemTheme,
      });
    };

    // Set initial system theme
    handleSystemThemeChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // Load theme from user preferences or localStorage
  useEffect(() => {
    loadTheme();
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    applyTheme(state.theme);
  }, [state.theme]);

  // Save theme to localStorage when it changes
  useEffect(() => {
    if (!state.isSystemTheme) {
      localStorage.setItem('cryptotrack_theme', state.theme);
    } else {
      localStorage.removeItem('cryptotrack_theme');
    }
    localStorage.setItem('cryptotrack_auto_theme', state.isSystemTheme.toString());
  }, [state.theme, state.isSystemTheme]);

  // Load theme from user preferences or localStorage
  const loadTheme = () => {
    let theme = 'light';
    let isSystemTheme = false;

    // Priority: User preferences > localStorage > system default
    if (user?.preferences?.theme) {
      theme = user.preferences.theme;
    } else {
      const savedTheme = localStorage.getItem('cryptotrack_theme');
      const savedAutoTheme = localStorage.getItem('cryptotrack_auto_theme') === 'true';
      
      if (savedAutoTheme) {
        isSystemTheme = true;
        theme = state.systemTheme;
      } else if (savedTheme) {
        theme = savedTheme;
      }
    }

    dispatch({
      type: ThemeActionTypes.LOAD_THEME,
      payload: {
        theme,
        isSystemTheme,
      },
    });
  };

  // Apply theme to document
  const applyTheme = (theme) => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name=\"theme-color\"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1f2937' : '#ffffff');
    }
  };

  // Set specific theme
  const setTheme = async (theme, updateUserPreference = false) => {
    dispatch({
      type: ThemeActionTypes.SET_THEME,
      payload: theme,
    });

    // Update user preference if authenticated and requested
    if (updateUserPreference && user) {
      try {
        await updateProfile({
          preferences: {
            ...user.preferences,
            theme,
          },
        }, false);
      } catch (error) {
        console.error('Failed to update theme preference:', error);
      }
    }
  };

  // Toggle between light and dark theme
  const toggleTheme = async (updateUserPreference = false) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    await setTheme(newTheme, updateUserPreference);
  };

  // Enable/disable automatic theme based on system preference
  const setAutoTheme = async (enabled) => {
    dispatch({
      type: ThemeActionTypes.SET_AUTO_THEME,
      payload: enabled,
    });

    if (enabled && user) {
      // Don't store specific theme in user preferences for auto theme
      try {
        await updateProfile({
          preferences: {
            ...user.preferences,
            theme: 'auto',
          },
        });
      } catch (error) {
        console.error('Failed to update auto theme preference:', error);
      }
    }
  };

  // Get current theme
  const getCurrentTheme = () => state.theme;

  // Check if current theme is dark
  const isDarkTheme = () => state.theme === 'dark';

  // Get theme class for conditional styling
  const getThemeClass = (lightClass = '', darkClass = '') => {
    return state.theme === 'dark' ? darkClass : lightClass;
  };

  // Get theme-aware color value
  const getThemeColor = (lightColor, darkColor) => {
    return state.theme === 'dark' ? darkColor : lightColor;
  };

  // Context value
  const value = {
    // State
    theme: state.theme,
    systemTheme: state.systemTheme,
    isSystemTheme: state.isSystemTheme,

    // Actions
    setTheme,
    toggleTheme,
    setAutoTheme,

    // Helper functions
    getCurrentTheme,
    isDarkTheme,
    getThemeClass,
    getThemeColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;