import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Mail, Lock, Palette, Globe, Eye, EyeOff, Save } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, isLoading: authLoading, updateProfile, changePassword } = useAuth();
  const { theme, toggleTheme, isDarkTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateProfile(profileForm);
      // Toast is already shown in AuthContext via showNotification parameter
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Error toast is already shown in AuthContext
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsSaving(true);

    try {
      const result = await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmNewPassword
      );

      if (result.success) {
        // Toast is already shown in AuthContext, just clear the form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      // Error toast is already shown in AuthContext
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeToggle = () => {
    toggleTheme(true); // Update user preference
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sign in to access settings
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your account preferences by creating an account
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 fade-in-up">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage your account preferences and security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="crypto-card p-6">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${activeTab === 'profile'
                  ? 'bg-gradient-to-r from-primary-500/10 to-primary-700/10 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${activeTab === 'security'
                  ? 'bg-gradient-to-r from-primary-500/10 to-primary-700/10 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <Lock className="h-5 w-5" />
                <span>Security</span>
              </button>

              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-all duration-200 ${activeTab === 'preferences'
                  ? 'bg-gradient-to-r from-primary-500/10 to-primary-700/10 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <Palette className="h-5 w-5" />
                <span>Preferences</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="crypto-card p-6">
              <h2 className="section-header mb-6">
                Profile Information
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      className="premium-input pl-10"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {isSaving ? (
                      <LoadingSpinner size="small" className="text-white" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="crypto-card p-6">
              <h2 className="section-header mb-6">
                Security Settings
              </h2>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="premium-input pl-10 pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="premium-input pl-10 pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      value={passwordForm.confirmNewPassword}
                      onChange={handlePasswordChange}
                      className="premium-input pl-10 pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {isSaving ? (
                      <LoadingSpinner size="small" className="text-white" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{isSaving ? 'Saving...' : 'Change Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="crypto-card p-6">
              <h2 className="section-header mb-6">
                Preferences
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Appearance
                  </h3>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Palette className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Theme
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Choose between light and dark mode
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleThemeToggle}
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 dark:bg-gray-600 transition-colors"
                    >
                      <span
                        className={`${isDarkTheme() ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Language
                  </h3>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Language
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Select your preferred language
                        </div>
                      </div>
                    </div>

                    <select
                      className="premium-input bg-white dark:bg-gray-700"
                      disabled
                    >
                      <option>English</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;