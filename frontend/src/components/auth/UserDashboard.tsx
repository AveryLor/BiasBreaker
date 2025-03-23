'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/utils/AuthContext';
import { authApi, QueryHistoryItem } from '@/utils/authApi';
import { formatDistanceToNow } from 'date-fns';

export default function UserDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  
  // Delete account states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated && !user) {
      router.push('/login');
    } else {
      // Fetch query history
      fetchQueryHistory();
    }
  }, [isAuthenticated, user, router]);
  
  const fetchQueryHistory = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await authApi.getQueryHistory();
      if (result.success && result.queries) {
        setQueryHistory(result.queries);
      } else {
        setError(result.message || 'Failed to load your search history');
      }
    } catch (err) {
      setError('An error occurred while fetching your search history');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });
    
    // Validate passwords match and meet requirements
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      setPasswordMessage({ text: 'Password must be at least 8 characters long', type: 'error' });
      return;
    }
    
    try {
      const result = await authApi.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      
      if (result.success) {
        setPasswordMessage({ text: 'Password updated successfully', type: 'success' });
        // Reset form
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
        setTimeout(() => {
          setShowPasswordForm(false);
          setPasswordMessage({ text: '', type: '' });
        }, 2000);
      } else {
        setPasswordMessage({ text: result.message, type: 'error' });
      }
    } catch (err) {
      setPasswordMessage({ text: 'An unexpected error occurred', type: 'error' });
      console.error(err);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setPasswordMessage({ text: 'Please type DELETE to confirm', type: 'error' });
      return;
    }
    
    try {
      const result = await authApi.deleteAccount();
      
      if (result.success) {
        await logout();
        router.push('/');
      } else {
        setPasswordMessage({ text: result.message, type: 'error' });
      }
    } catch (err) {
      setPasswordMessage({ text: 'An unexpected error occurred', type: 'error' });
      console.error(err);
    }
  };
  
  const handleReopenChat = (query: string) => {
    // Navigate to chat page with query
    router.push(`/?query=${encodeURIComponent(query)}`);
  };
  
  if (!user) {
    return <div className="text-center py-8">Loading...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">User Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account and view your search history</p>
      </div>
      
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'profile'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
            >
              Profile
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('history')}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'history'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
            >
              Search History
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('security')}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'security'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
            >
              Security
            </button>
          </li>
        </ul>
      </div>
      
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
      
      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Search History</h2>
          
          {isLoading ? (
            <div className="text-center py-8">Loading your search history...</div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
          ) : queryHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              You haven't made any searches yet.
            </div>
          ) : (
            <div className="space-y-4">
              {queryHistory.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium break-words">{item.query}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleReopenChat(item.query)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm whitespace-nowrap"
                    >
                      Reopen Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Security Settings</h2>
          
          <div className="space-y-6">
            {/* Change Password Section */}
            <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Password</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Update your password to keep your account secure
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 dark:text-indigo-400 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </button>
              </div>
              
              {showPasswordForm && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4">
                  {passwordMessage.text && (
                    <div
                      className={`p-3 rounded text-sm ${
                        passwordMessage.type === 'success'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {passwordMessage.text}
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="current_password"
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="new_password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      required
                      minLength={8}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                  </div>
                  
                  <div>
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirm_password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    Update Password
                  </button>
                </form>
              )}
            </div>
            
            {/* Delete Account Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Delete Account</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Permanently delete your account and all your data
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 dark:text-red-400 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  {showDeleteConfirm ? 'Cancel' : 'Delete Account'}
                </button>
              </div>
              
              {showDeleteConfirm && (
                <div className="mt-4 p-4 border border-red-300 rounded-md bg-red-50 dark:bg-gray-700 dark:border-red-800">
                  <p className="text-red-600 dark:text-red-400 mb-4">
                    This action cannot be undone. All your data will be permanently removed.
                  </p>
                  
                  {passwordMessage.text && passwordMessage.type === 'error' && (
                    <div className="p-3 mb-4 bg-red-100 text-red-700 rounded text-sm">
                      {passwordMessage.text}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      To confirm, type "DELETE" below:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Permanently Delete Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 