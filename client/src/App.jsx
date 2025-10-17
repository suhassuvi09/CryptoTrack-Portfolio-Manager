import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext.jsx';

// Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Markets from './pages/Markets';
import Watchlist from './pages/Watchlist';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    fontSize: '14px',
                    padding: '16px',
                    zIndex: 9999,
                  },
                  success: {
                    style: {
                      background: '#10b981',
                      color: '#fff',
                    },
                    iconTheme: {
                      primary: '#fff',
                      secondary: '#10b981',
                    },
                  },
                  error: {
                    style: {
                      background: '#ef4444',
                      color: '#fff',
                    },
                    iconTheme: {
                      primary: '#fff',
                      secondary: '#ef4444',
                    },
                  },
                }}
              />

              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout><Dashboard /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portfolio"
                  element={
                    <ProtectedRoute>
                      <Layout><Portfolio /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/markets"
                  element={
                    <Layout><Markets /></Layout>
                  }
                />
                <Route
                  path="/watchlist"
                  element={
                    <ProtectedRoute>
                      <Layout><Watchlist /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <Layout><Analytics /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Layout><Settings /></Layout>
                    </ProtectedRoute>
                  }
                />

                {/* Catch all route */}
                <Route path="*" element={<Layout><NotFound /></Layout>} />
              </Routes>
            </div>
          </Router>
        </CurrencyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;